import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { getFullScreenElement } from "../utilities/get-fullscreen-elem";
import { GlobalEventController } from "./global-events-controller";

export function useFullscreenController(
  getElem: () => HTMLElement,
  globalEvents: GlobalEventController,
) {
  const isFullscreen = sig(false);

  const toggleFullscreen = () => {
    if (isFullscreen.get()) {
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

  globalEvents.on("webkitfullscreenchange", handleFullscreenToggle, "document");
  globalEvents.on("mozfullscreenchange", handleFullscreenToggle, "document");
  globalEvents.on("MSFullscreenChange", handleFullscreenToggle, "document");
  globalEvents.on("fullscreenchange", handleFullscreenToggle, "document");

  return {
    isFullscreen,
    toggleFullscreen,
  };
}
