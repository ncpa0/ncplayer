import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import volumeMutedIcon from "../assets/volume-muted.svg";
import volumeIcon from "../assets/volume.svg";
import { Dismounter } from "../player.component";
import { changeWithStep, clamp, toPrecision } from "../utilities/math";
import { stopEvent } from "../utilities/stop-event";

export type VolumeControlProps = {
  volume: ReadonlySignal<number>;
  onVolumeChange: (newVolume: number) => void;
  dismounter?: Dismounter;
};

export function VolumeControl(props: VolumeControlProps) {
  let lastKnownVolumeBeforeMute = 1;

  const progressBarStyle = props.volume.derive((p) => {
    return `right: ${clamp((1 - p) * 100, 0, 100)}%;`;
  });

  const thumbStyle = props.volume.derive((p) => {
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
      const { left, width } = slider.getBoundingClientRect();
      const percent = (e.clientX - left) / width;
      const tmpValue = changeWithStep(
        props.volume.current(),
        toPrecision(min + percent * (max - min), 6),
        0.01,
      );

      const newVol = clamp(tmpValue, 0, 1);

      if (newVol === 0) {
        lastKnownVolumeBeforeMute = 1;
      }
      props.onVolumeChange(newVol);
    }
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);

  const slider = (
    <div
      class="volume-ctl-slider"
      draggable={false}
      onpointerdown={handlePointerDown}
      onpointermove={stopEvent}
      ondrag={stopEvent}
    >
      <div
        class="volume-ctl-slider-bg"
        draggable={false}
        onpointermove={stopEvent}
        ondrag={stopEvent}
      />
      <div
        class="volume-ctl-slider-progress"
        draggable={false}
        style={progressBarStyle}
        onpointermove={stopEvent}
        ondrag={stopEvent}
      />
      <div
        class="volume-ctl-slider-thumb"
        draggable={false}
        style={thumbStyle}
        onpointermove={stopEvent}
        ondrag={stopEvent}
      />
    </div>
  );

  return (
    <div
      class={{
        "volume-ctl": true,
        muted: props.volume.derive(v => v === 0),
      }}
    >
      {props.volume.derive((v) => {
        return (
          <div
            class="volume-ctl-icon"
            unsafeHTML
            onclick={() => {
              if (v === 0) {
                props.onVolumeChange(lastKnownVolumeBeforeMute);
              } else {
                lastKnownVolumeBeforeMute = v;
                props.onVolumeChange(0);
              }
            }}
          >
            {v === 0 ? volumeMutedIcon : volumeIcon}
          </div>
        );
      })}
      {slider}
    </div>
  );
}
