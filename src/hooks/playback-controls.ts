import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import throttle from "lodash.throttle";
import { PlayerController } from "../player.component";
import { clamp } from "../utilities/math";
import { useFullscreenController } from "./fullscreen-controller";
import { GlobalEventController } from "./global-events-controller";

export interface VideoControls {
  togglePlay(): void;
  seekForward(t: number): void;
  seekBackward(t: number): void;
  seek(t: number): void;
  seekProgress(p: number): void;
  toggleMute(): void;
  setVolume(v: number): void;
  toggleFullscreen(): void;
}

function getInitVolume(
  persistentVolume: ReadonlySignal<boolean | undefined>,
) {
  if (persistentVolume.get()) {
    const stored = localStorage.getItem("ncplayer-volume");
    if (stored) {
      return Number(stored);
    }
  }
  return 1;
}

const INTERACTABLE_TAGS = ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "OPTION"];

export function usePlaybackControls(
  getElem: () => HTMLVideoElement,
  getPlayerElem: () => HTMLElement,
  globalEvents: GlobalEventController,
  controlsTimeout: ReadonlySignal<number | undefined>,
  persistentVolume: ReadonlySignal<boolean | undefined>,
  swipeControlRange: ReadonlySignal<number | undefined>,
  globalKeyListener: ReadonlySignal<boolean | undefined>,
  keySeekDuration: ReadonlySignal<number | undefined>,
) {
  const volume = sig(getInitVolume(persistentVolume));
  const bufferProgress = sig(0);
  const progress = sig(0);
  const isPLaying = sig(false);
  const showControls = sig(true);
  let lastTimeout: number | undefined;

  const fullscreenController = useFullscreenController(
    getPlayerElem,
    globalEvents,
  );

  let lastKnownVolumeBeforeMute = 1;
  const controls: VideoControls = {
    togglePlay() {
      const videoElem = getElem();
      if (videoElem.paused) {
        videoElem.play();
      } else {
        videoElem.pause();
      }
    },
    seek(t) {
      const videoElem = getElem();
      if (Number.isNaN(videoElem.duration)) {
        return;
      }

      const newCurrent = clamp(t, 0, videoElem.duration);
      const newProgress = newCurrent / videoElem.duration;

      videoElem.currentTime = newCurrent;
      progress.dispatch(newProgress);
    },
    seekProgress(p) {
      const videoElem = getElem();
      if (Number.isNaN(videoElem.duration)) {
        return;
      }

      const newCurrent = clamp(p * videoElem.duration, 0, videoElem.duration);

      videoElem.currentTime = newCurrent;
      progress.dispatch(p);
    },
    seekForward(t) {
      const videoElem = getElem();
      if (Number.isNaN(videoElem.duration)) {
        return;
      }

      this.seek(videoElem.currentTime + t);
    },
    seekBackward(t) {
      const videoElem = getElem();
      if (Number.isNaN(videoElem.duration)) {
        return;
      }

      this.seek(videoElem.currentTime - t);
    },
    setVolume(v) {
      v = clamp(v, 0, 1);
      volume.dispatch(v);
      if (persistentVolume.get()) {
        localStorage.setItem("ncplayer-volume", String(v));
      }
    },
    toggleMute() {
      const videoElem = getElem();
      if (videoElem.volume === 0) {
        this.setVolume(lastKnownVolumeBeforeMute);
      } else {
        lastKnownVolumeBeforeMute = videoElem.volume;
        this.setVolume(0);
      }
    },
    toggleFullscreen() {
      fullscreenController.toggleFullscreen();
    },
  };

  const startHideTimeout = (e?: MouseEvent) => {
    if (lastTimeout) {
      clearTimeout(lastTimeout);
    }

    if (
      !e || (e.target instanceof HTMLElement && !e.target.closest(".controls"))
    ) {
      lastTimeout = window.setTimeout(() => {
        if (isPLaying.get()) {
          showControls.dispatch(false);
        }
        lastTimeout = undefined;
      }, controlsTimeout?.get() ?? 1000);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    showControls.dispatch(true);
    startHideTimeout(e);
  };

  const handlePlay = (e: Event) => {
    const elem = e.target as HTMLVideoElement;
    isPLaying.dispatch(true);
    progress.dispatch(elem.currentTime / elem.duration);
    startHideTimeout();
  };

  const handlePause = (e: Event) => {
    const elem = e.target as HTMLVideoElement;
    isPLaying.dispatch(false);
    progress.dispatch(elem.currentTime / elem.duration);
    showControls.dispatch(true);
  };

  const handleTimeUpdate = (e: Event) => {
    const elem = e.target as HTMLVideoElement;
    if (elem.duration) {
      progress.dispatch(elem.currentTime / elem.duration);
    }
  };

  const handleProgress = (e: Event) => {
    const elem = e.target as HTMLVideoElement;
    if (elem.buffered.length > 0 && !Number.isNaN(elem.duration)) {
      // find buffered range that's closest to the current time
      let buffered = 0;
      for (let i = 0; i < elem.buffered.length; i++) {
        const buffStart = elem.buffered.start(i);
        const buffEnd = elem.buffered.end(i);
        if (
          (buffStart - 16) <= elem.currentTime
          && elem.currentTime <= buffEnd
        ) {
          buffered = buffEnd;
          break;
        }
      }
      bufferProgress.dispatch(buffered / elem.duration);
    }
  };

  const handleMouseLeave = () => {
    if (isPLaying.get()) {
      showControls.dispatch(false);
    }
  };

  // Event capturer

  let swipeStartCurrentTime = 0;
  let swipeStartTs = 0;
  let lastPointerUpTs = 0;
  let isSwiping = false;
  let initX = 0;
  const handleCapturePointerUp = (e: PointerEvent) => {
    const now = Date.now();
    if (now - lastPointerUpTs < 200) {
      controls.toggleFullscreen();
    }
    lastPointerUpTs = now;

    if (isSwiping) {
      return;
    }

    const isRmb = e.button === 2;
    if (!isRmb) {
      controls.togglePlay();
    }
  };

  const handleCaptureTouchStart = (e: TouchEvent) => {
    isSwiping = true;
    swipeStartTs = Date.now();
    swipeStartCurrentTime = getElem().currentTime;

    const target = e.target as HTMLElement;
    const targetRect = target.getBoundingClientRect();
    if (e.touches.length === 0) {
      initX = targetRect.width / 2;
    } else {
      initX = e.touches[0]!.clientX - targetRect.left;
    }

    showControls.dispatch(true);
    clearTimeout(lastTimeout);
  };

  const handleCaptureTouchEnd = (e: TouchEvent) => {
    isSwiping = false;

    if (Date.now() - swipeStartTs < 200) {
      controls.togglePlay();
    }

    startHideTimeout();
  };

  const handleCaptureTouchMove = throttle(
    (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 0) {
        return;
      }

      // calculate pointer x position relative to the target
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const touchX = e.touches[0]!.clientX - rect.left;
      const relToInit = touchX - initX;
      const relToInitMax = rect.width - 32 - initX;
      const relToInitMin = -initX;

      const percentToMove = relToInit >= 0
        ? relToInit / relToInitMax
        : -1 * relToInit / relToInitMin;

      // calculate new time based on touching position
      const videoElem = getElem();
      const timeRange = (swipeControlRange.get() ?? 60 * 1000) / 1000;
      const minT = Math.max(0, swipeStartCurrentTime - timeRange);
      const maxT = Math.min(
        videoElem.duration,
        swipeStartCurrentTime + timeRange,
      );
      const deltaT = percentToMove * timeRange;
      const newTime = clamp(deltaT + swipeStartCurrentTime, minT, maxT);

      videoElem.currentTime = newTime;
      progress.dispatch(newTime / videoElem.duration);
    },
    50,
    { leading: true, trailing: true },
  );

  // Key controls

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (globalKeyListener.get() === false) {
      if (!target.closest(".ncplayer")) {
        return;
      }
    } else {
      if (INTERACTABLE_TAGS.includes(target.tagName)) {
        return;
      }
    }

    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    switch (e.key) {
      case "ArrowLeft": {
        showControls.dispatch(true);
        startHideTimeout();
        controls.seekBackward(keySeekDuration.get() ?? 5);
        break;
      }
      case "ArrowRight": {
        showControls.dispatch(true);
        startHideTimeout();
        controls.seekForward(keySeekDuration.get() ?? 5);
        break;
      }
      case "m": {
        showControls.dispatch(true);
        startHideTimeout();
        controls.toggleMute();
        break;
      }
      case "f": {
        showControls.dispatch(true);
        startHideTimeout();
        controls.toggleFullscreen();
        break;
      }
      case " ":
      case "k":
        controls.togglePlay();
        break;
    }
  };

  globalEvents.on("keydown", handleKeyDown, "document");

  return {
    isFullscreen: fullscreenController.isFullscreen,
    progress,
    isPLaying,
    showControls,
    volume,
    bufferProgress,
    controls,
    handle: {
      mouseMove: handleMouseMove,
      mouseLeave: handleMouseLeave,
      play: handlePlay,
      pause: handlePause,
      timeUpdate: handleTimeUpdate,
      progress: handleProgress,
    },
    capturer: {
      pointerUp: handleCapturePointerUp,
      touchstart: handleCaptureTouchStart,
      touchend: handleCaptureTouchEnd,
      touchmove: handleCaptureTouchMove,
    },
    publicController: {
      play() {
        getElem().play();
      },
      pause() {
        getElem().pause();
      },
      seek(t) {
        controls.seek(t);
      },
      setVolume(v) {
        controls.setVolume(v);
      },
      toggleFullscreen() {
        controls.toggleFullscreen();
      },
      toggleMute() {
        controls.toggleMute();
      },
      reset() {
        const videoElem = getElem();
        videoElem.pause();
        videoElem.currentTime = 0;
        progress.dispatch(0);
        bufferProgress.dispatch(0);
      },
      video() {
        return getElem();
      },
    } as PlayerController,
  };
}
