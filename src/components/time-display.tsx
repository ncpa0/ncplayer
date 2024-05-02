import { sig, Signal } from "@ncpa0cpl/vanilla-jsx";
import { formatTime } from "../utilities/format-time";

export type TimeDisplayProps = {
  progress: Signal<number>;
  isVisible: Signal<boolean>;
  videoElement: HTMLVideoElement;
};

export function TimeDisplay(props: TimeDisplayProps) {
  let lastTime = "00:00";
  const time = sig.derive(
    props.progress,
    props.isVisible,
    (_, visible) => {
      if (!visible) {
        return lastTime;
      }

      const currentTime = props.videoElement.currentTime;
      const timeFmt = formatTime(currentTime);
      lastTime = timeFmt;
      return timeFmt;
    },
  );

  return <span class="time-display">{time}</span>;
}
