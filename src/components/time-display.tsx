import { sig, Signal } from "@ncpa0cpl/vanilla-jsx";

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

      const hours = Math.floor(currentTime / 3600);
      const minutes = Math.floor((currentTime % 3600) / 60);
      const seconds = Math.floor(currentTime % 60);

      if (hours > 0) {
        const newTime = `${hours.toString().padStart(2, "0")}:${
          minutes.toString().padStart(2, "0")
        }:${seconds.toString().padStart(2, "0")}`;
        lastTime = newTime;
        return newTime;
      } else {
        const newTime = `${minutes.toString().toString().padStart(2, "0")}:${
          seconds.toString().padStart(2, "0")
        }`;
        lastTime = newTime;
        return newTime;
      }
    },
  );

  return <span class="time-display">{time}</span>;
}
