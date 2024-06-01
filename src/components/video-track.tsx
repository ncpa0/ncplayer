import { ReadonlySignal, sig, Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import throttle from "lodash.throttle";
import { Dismounter } from "../player.component";
import { detectMobile } from "../utilities/detect-mobile";
import { formatTime } from "../utilities/format-time";
import { changeWithStep, clamp, toPrecision } from "../utilities/math";
import { stopEvent } from "../utilities/stop-event";

export type VideoTrackProps = {
  video: HTMLVideoElement;
  progress: Signal<number>;
  bufferProgress: ReadonlySignal<number>;
  preview: ReadonlySignal<string | undefined>;
  previewWidth: ReadonlySignal<number | undefined>;
  previewHeight: ReadonlySignal<number | undefined>;
  previewUpdateThrottle: ReadonlySignal<number | undefined>;
  onSeek: (time: number) => void;
  dismounter?: Dismounter;
};

export function VideoTrack(props: VideoTrackProps) {
  const previewUpdateThrottle = props.previewUpdateThrottle;

  const bufferProgressBarStyle = props.bufferProgress.derive((p) => {
    return `right: ${clamp((1 - p) * 100, 0, 100)}%;`;
  });

  const progressBarStyle = props.progress.derive((p) => {
    return `right: ${clamp((1 - p) * 100, 0, 100)}%;`;
  });

  const thumbStyle = props.progress.derive((p) => {
    return `left: calc(${clamp(p * 100, 0, 100)}% - 0.75em);`;
  });

  let isPressed = false;

  const handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();

    if (e.pointerType === "mouse" && e.button !== 0) return;

    isPressed = true;
    handlePointerMove(e);

    return false;
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isPressed) return;
    e.stopPropagation();
    isPressed = false;
  };

  const min = 0;
  const max = 1;
  const handlePointerMove = (e: PointerEvent) => {
    if (isPressed) {
      e.stopPropagation();
      const { left, width } = vtrack.getBoundingClientRect();
      const percent = (e.clientX - left) / width;
      const tmpValue = changeWithStep(
        props.progress.current(),
        toPrecision(min + percent * (max - min), 6),
        0.01,
      );

      props.onSeek(clamp(tmpValue, 0, 1));
    }
  };

  let previewPlayer = props.preview.derive(
    (preview) => {
      // also disable preview on mobile devices
      if (!preview || detectMobile()) return;

      const dim = sig.derive(
        props.previewWidth,
        props.previewHeight,
        (width, height) => {
          if (!width && !height) {
            return { width: 320, height: undefined };
          }

          return { width, height };
        },
      );

      return (
        <video
          class="preview-player"
          width={dim.derive(d => d.width)}
          height={dim.derive(d => d.height)}
          src={preview}
          controls={false}
          preload={"metadata"}
          muted
        />
      ) as HTMLVideoElement;
    },
  );

  const timePreview = (
    <span class="track-hover-time-preview">
      00:00
    </span>
  ) as HTMLSpanElement;

  const previewHandlers = sig.derive(
    previewPlayer,
    previewUpdateThrottle,
    (player, throttleTime = 250) => {
      const updatePreviews = throttle(
        (trackRect: DOMRect, clientX: number) => {
          const percent = (clientX - trackRect.left) / trackRect.width;
          const tmpValue = changeWithStep(
            props.progress.current(),
            toPrecision(min + percent * (max - min), 6),
            0.01,
          ) * props.video.duration;

          if (Number.isFinite(tmpValue)) {
            if (player && Math.abs(player.currentTime - tmpValue) > 1.1) {
              player!.currentTime = tmpValue;
            }
            timePreview.textContent = formatTime(tmpValue);
          }
        },
        throttleTime,
        { leading: true, trailing: true },
      );

      let isOver = false;
      const handleMouseEnter = () => {
        isOver = true;
        timePreview.style.display = "initial";
        if (player) {
          player.style.display = "initial";
        }
      };

      const handleMouseLeave = () => {
        isOver = false;
        timePreview.style.display = "none";
        if (player) {
          player.style.display = "none";
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isOver) return;

        const trackRect = vtrack.getBoundingClientRect();
        // get mouse position relative to the track element
        const mouseXRel = e.clientX
          - trackRect.left;

        const timePreviewRect = timePreview.getBoundingClientRect();
        timePreview.style.left = mouseXRel - timePreviewRect.width / 2 + "px";

        if (player) {
          const initPreviewRect = player.getBoundingClientRect();
          // clamp the left offset to prevent the preview from going offscreen
          const minLeft = -1 * trackRect.left;
          const maxLeft = window.innerWidth - initPreviewRect.width
            - trackRect.left;
          player.style.left =
            clamp(mouseXRel - initPreviewRect.width / 2, minLeft, maxLeft)
            + "px";
        }

        updatePreviews(trackRect, e.clientX);
      };

      const handlePreviewMouseover = () => {
        handleMouseLeave();
      };

      if (player) {
        player.onmouseenter = handlePreviewMouseover;
      }
      timePreview.onmouseenter = handlePreviewMouseover;

      return {
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
      };
    },
  );

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);

  props.dismounter?.ondismount(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    previewPlayer.current()?.remove();
  });

  const vtrack = (
    <div
      class="video-track"
      draggable={false}
      onpointerdown={handlePointerDown}
      onmousemove={previewHandlers.derive((h) => h.handleMouseMove)}
      onmouseenter={previewHandlers.derive((h) => h.handleMouseEnter)}
      onmouseleave={previewHandlers.derive((h) => h.handleMouseLeave)}
      onpointermove={stopEvent}
      ondrag={stopEvent}
    >
      <div
        class="track-bg"
        draggable={false}
        onpointermove={stopEvent}
        ondrag={stopEvent}
      />
      <div
        class="track-buffer-progress"
        draggable={false}
        style={bufferProgressBarStyle}
        onpointermove={stopEvent}
        ondrag={stopEvent}
      />
      <div
        class="track-progress"
        draggable={false}
        style={progressBarStyle}
        onpointermove={stopEvent}
        ondrag={stopEvent}
      />
      <div
        class="track-thumb"
        draggable={false}
        style={thumbStyle}
        onpointermove={stopEvent}
        ondrag={stopEvent}
      />
      {timePreview}
      {previewPlayer}
    </div>
  );

  return vtrack;
}
