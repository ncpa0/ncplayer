import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx";

export function usePlaybackControls(
  controlsTimeout: ReadonlySignal<number | undefined>,
  persistentVolume: ReadonlySignal<boolean | undefined>,
) {
  const volume = sig(
    persistentVolume.current()
      ? Number(localStorage.getItem("ncplayer-volume") ?? 1)
      : 1,
  );
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

  const handleProgress = (e: Event) => {
    const elem = e.target as HTMLVideoElement;
    if (elem.duration) {
      progress.dispatch(elem.currentTime / elem.duration);
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

  return {
    progress,
    isPLaying,
    showControls,
    volume,
    handle: {
      mouseMove: handleMouseMove,
      mouseLeave: handleMouseLeave,
      play: handlePlay,
      pause: handlePause,
      progress: handleProgress,
      volumeChange: handleVolumeChange,
    },
  };
}
