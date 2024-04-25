import { sig } from "@ncpa0cpl/vanilla-jsx";
import { Dismounter } from "../player.component";
import { getFullScreenElement } from "../utilities/get-fullscreen-elem";

export function useFullscreenController(
  getElem: () => HTMLElement,
  dismounter?: Dismounter,
) {
  const isFullscreen = sig(false);

  const handleFullscreenBtnClick = () => {
    if (isFullscreen.current()) {
      document.exitFullscreen();
    } else {
      getElem()
        .requestFullscreen()
        .catch(() => {
          console.warn("Fullscreen request was denied.");
        });
    }
  };

  const handleFullscreenToggle = () => {
    if (getFullScreenElement() == null) {
      isFullscreen.dispatch(false);
    } else {
      isFullscreen.dispatch(true);
    }
  };

  document.addEventListener("webkitfullscreenchange", handleFullscreenToggle);
  document.addEventListener("mozfullscreenchange", handleFullscreenToggle);
  document.addEventListener("MSFullscreenChange", handleFullscreenToggle);
  document.addEventListener("fullscreenchange", handleFullscreenToggle);
  dismounter?.ondismount(() => {
    document.removeEventListener(
      "webkitfullscreenchange",
      handleFullscreenToggle,
    );
    document.removeEventListener("mozfullscreenchange", handleFullscreenToggle);
    document.removeEventListener("MSFullscreenChange", handleFullscreenToggle);
    document.removeEventListener("fullscreenchange", handleFullscreenToggle);
  });

  return {
    isFullscreen,
    handleFullscreenBtnClick,
  };
}
