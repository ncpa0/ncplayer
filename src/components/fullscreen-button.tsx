import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx";
import fullscreenExitIcon from "../assets/fullscreen-exit.svg";
import fullscreenIcon from "../assets/fullscreen.svg";

export type FullscreenButtonProps = {
  isFullscreen: ReadonlySignal<boolean>;
  onPress: () => void;
};

export function FullscreenButton(props: FullscreenButtonProps) {
  return (
    <button class="ctl-btn fullscreen-btn" onclick={props.onPress}>
      {props.isFullscreen.derive((isFullscreen) => {
        if (isFullscreen) {
          return (
            <div class="ctl-btn-icon fullscreen-exit" unsafeHTML>
              {fullscreenExitIcon}
            </div>
          );
        } else {
          return (
            <div class="ctl-btn-icon fullscreen-open" unsafeHTML>
              {fullscreenIcon}
            </div>
          );
        }
      })}
    </button>
  );
}
