import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx";
import throttle from "lodash.throttle";
import { clamp } from "../utilities/math";

export function usePlaybackControls(
  getElem: () => HTMLVideoElement,
  controlsTimeout: ReadonlySignal<number | undefined>,
  persistentVolume: ReadonlySignal<boolean | undefined>,
  swipeControlRange: ReadonlySignal<number | undefined>,
) {
  const volume = sig(
    persistentVolume.current()
      ? Number(localStorage.getItem("ncplayer-volume") ?? 1)
      : 1,
  );
  const bufferProgress = sig(0);
  const progress = sig(0);
  const isPLaying = sig(false);
  const showControls = sig(true);
  let lastTimeout: number | undefined;

  const startHideTimeout = (e?: MouseEvent) => {
    if (lastTimeout) {
      clearTimeout(lastTimeout);
    }

    if (
      !e || (e.target instanceof HTMLElement && !e.target.closest(".controls"))
    ) {
      lastTimeout = window.setTimeout(() => {
        if (isPLaying.current()) {
          showControls.dispatch(false);
        }
        lastTimeout = undefined;
      }, controlsTimeout?.current() ?? 1000);
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

  const handleVolumeChange = (newVolume: number) => {
    volume.dispatch(newVolume);
    if (persistentVolume.current()) {
      localStorage.setItem("ncplayer-volume", String(newVolume));
    }
  };

  const handleMouseLeave = () => {
    if (isPLaying.current()) {
      showControls.dispatch(false);
    }
  };

  const togglePlay = () => {
    const videoElem = getElem();
    if (videoElem.paused) {
      videoElem.play();
    } else {
      videoElem.pause();
    }
  };

  // Event capturer

  let swipeStartCurrentTime = 0;
  let swipeStartTs = 0;
  let isSwiping = false;
  let initX = 0;
  const handleCapturePointerUp = (e: MouseEvent) => {
    if (isSwiping) {
      return;
    }
    togglePlay();
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
      togglePlay();
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
      const timeRange = (swipeControlRange.current() ?? 60 * 1000) / 1000;
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

  return {
    progress,
    isPLaying,
    showControls,
    volume,
    bufferProgress,
    handle: {
      mouseMove: handleMouseMove,
      mouseLeave: handleMouseLeave,
      play: handlePlay,
      pause: handlePause,
      timeUpdate: handleTimeUpdate,
      volumeChange: handleVolumeChange,
      progress: handleProgress,
    },
    capturer: {
      pointerUp: handleCapturePointerUp,
      touchstart: handleCaptureTouchStart,
      touchend: handleCaptureTouchEnd,
      touchmove: handleCaptureTouchMove,
    },
  };
}
