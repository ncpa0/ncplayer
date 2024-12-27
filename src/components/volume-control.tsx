import { If } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import VolumeMutedIcon from "../assets/volume-muted.svg";
import VolumeIcon from "../assets/volume.svg";
import { GlobalEventController } from "../hooks/global-events-controller";
import { changeWithStep, clamp, toPrecision } from "../utilities/math";
import { stopEvent } from "../utilities/stop-event";

export type VolumeControlProps = {
  volume: ReadonlySignal<number>;
  onVolumeChange: (newVolume: number) => void;
  onVolumeToggle: () => void;
  globalEvents: GlobalEventController;
};

export function VolumeControl(props: VolumeControlProps) {
  const { globalEvents } = props;

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
        props.volume.get(),
        toPrecision(min + percent * (max - min), 6),
        0.01,
      );

      const newVol = clamp(tmpValue, 0, 1);

      props.onVolumeChange(newVol);
    }
  };

  globalEvents.on("pointermove", handlePointerMove);
  globalEvents.on("pointerup", handlePointerUp);

  const slider = (
    <div
      class="volume-ctl-slider"
      draggable={false}
      onpointerdown={handlePointerDown}
      onpointermove={stopEvent}
      ondrag={stopEvent}
      tabIndex={1}
      role="slider"
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
      <div
        class="volume-ctl-icon"
        onmousedown={() => {
          props.onVolumeToggle();
        }}
        tabIndex={1}
        role="button"
      >
        <If
          condition={props.volume.derive(v => v === 0)}
          then={() => <VolumeMutedIcon />}
          else={() => <VolumeIcon />}
        />
      </div>
      {slider}
    </div>
  );
}
