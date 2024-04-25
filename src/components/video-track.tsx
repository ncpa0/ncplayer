import { ReadonlySignal, sig, Signal } from "@ncpa0cpl/vanilla-jsx";
import throttle from "lodash.throttle";
import { Dismounter } from "../player.component";
import { detectMobile } from "../utilities/detect-mobile";
import { changeWithStep, clamp, toPrecision } from "../utilities/math";

export type VideoTrackProps = {
  video: HTMLVideoElement;
  progress: Signal<number>;
  preview: ReadonlySignal<string | undefined>;
  previewWidth: ReadonlySignal<number | undefined>;
  previewHeight: ReadonlySignal<number | undefined>;
  previewUpdateThrottle: ReadonlySignal<number | undefined>;
  onSeek: (time: number) => void;
  dismounter?: Dismounter;
};

export function VideoTrack(props: VideoTrackProps) {
  const progress = props.progress;
  const previewUpdateThrottle = props.previewUpdateThrottle;

  const progressBarStyle = progress.derive((p) => {
    return `right: ${clamp((1 - p) * 100, 0, 100)}%;`;
  });

  const thumbStyle = progress.derive((p) => {
    return `left: calc(${clamp(p * 100, 0, 100)}% - 0.3em);`;
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

  let previewPlayer = sig.derive(
    props.preview,
    props.previewWidth,
    props.previewHeight,
    (preview, width, height) => {
      // also disable preview on mobile devices
      if (!preview || detectMobile()) return;

      if (!width && !height) {
        width = 320;
      }

      return (
        <video
          class="preview-player"
          width={width}
          height={height}
          src={preview}
          controls={false}
          muted
        />
      ) as HTMLVideoElement;
    },
  );

  const previewHandlers = sig.derive(
    previewPlayer,
    previewUpdateThrottle,
    (player, throttleTime = 250) => {
      if (!player) {
        return {
          handleMouseEnter: undefined,
          handleMouseLeave: undefined,
          handleMouseMove: undefined,
        };
      }

      const updatePreview = throttle(
        (trackRect: DOMRect, clientX: number) => {
          const percent = (clientX - trackRect.left) / trackRect.width;
          const tmpValue = changeWithStep(
            props.progress.current(),
            toPrecision(min + percent * (max - min), 6),
            0.01,
          ) * props.video.duration;

          if (Number.isFinite(tmpValue)) {
            player.currentTime = tmpValue;
          }
        },
        throttleTime,
        { leading: true, trailing: true },
      );

      let isOver = false;
      const handleMouseEnter = () => {
        isOver = true;
        player.style.display = "initial";
      };

      const handleMouseLeave = () => {
        isOver = false;
        player.style.display = "none";
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isOver) return;

        const trackRect = vtrack.getBoundingClientRect();
        const initPreviewRect = player.getBoundingClientRect();

        // get mouse position relative to the track element
        const mouseXRel = e.clientX
          - trackRect.left;

        // clamp the left offset to prevent the preview from going offscreen
        const minLeft = -1 * trackRect.left;
        const maxLeft = window.innerWidth - initPreviewRect.width
          - trackRect.left;
        player.style.left =
          clamp(mouseXRel - initPreviewRect.width / 2, minLeft, maxLeft) + "px";

        updatePreview(trackRect, e.clientX);
      };

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
    >
      <div class="track-bg" draggable={false} />
      <div class="track-progress" draggable={false} style={progressBarStyle} />
      <div class="track-thumb" draggable={false} style={thumbStyle} />
      {previewPlayer}
    </div>
  );

  return vtrack;
}
