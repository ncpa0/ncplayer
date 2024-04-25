import { Signal } from "@ncpa0cpl/vanilla-jsx";
import playImage from "../assets/media-playback-start.svg";
import pauseImage from "../assets/media-playback-stop.svg";

export type StartButtonProps = {
  video: HTMLVideoElement;
  playing: Signal<boolean>;
};

export function StartButton(props: StartButtonProps) {
  const handleClick = () => {
    if (props.video.paused) {
      props.video.play();
    } else {
      props.video.pause();
    }
  };

  return (
    <button class="ctl-btn play-pause-btn" onclick={handleClick}>
      {props.playing.derive((p) => {
        if (p) {
          return (
            <div class="ctl-btn-icon play-pause-icon-pause" unsafeHTML>
              {pauseImage}
            </div>
          );
        } else {
          return (
            <div class="ctl-btn-icon play-pause-icon-play" unsafeHTML>
              {playImage}
            </div>
          );
        }
      })}
    </button>
  );
}
