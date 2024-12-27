import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { SubtitleTrack } from "../player.component";
import { countChar } from "../utilities/count-char";

function liftCue(cue: VTTCue) {
  if (cue.line === "auto") {
    const eolChars = countChar(cue.text, "\n");
    // cues in chrome are iffy, need to set them to
    // positive number first for them to take effect
    cue.line = 1;
    cue.line = -3 - eolChars;
  }
}

function resetCues(cuesList?: TextTrackCueList | null) {
  const cues = [...(cuesList ?? [])] as VTTCue[];
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i]!;
    if (cue.line !== "auto") {
      cue.line = "auto";
    }
  }
}

export function useSubtrackController(
  videoElem: HTMLVideoElement,
  showControls: ReadonlySignal<boolean>,
  addCleanup: (fn: Function) => void,
) {
  const activeTrack = sig<null | string>(null);

  const handleSubTrackSelect = (track: SubtitleTrack) => {
    for (const trackElem of videoElem.textTracks) {
      if (trackElem.id === track.id) {
        trackElem.mode = "showing";
        activeTrack.dispatch(track.id);

        // cue line changes are iffy, won't take effect if set before displaying
        // so we need to wait a bit
        setTimeout(() => {
          const cues = [...(trackElem.activeCues ?? [])] as VTTCue[];
          for (const cue of cues) {
            liftCue(cue);
          }
        }, 25);
      } else {
        trackElem.mode = "hidden";
      }
      trackElem.cues;
    }
  };

  const handleSubTrackDisable = () => {
    for (const trackElem of videoElem.textTracks) {
      if (trackElem.mode === "showing") {
        trackElem.mode = "hidden";
        resetCues(trackElem.cues);
        activeTrack.dispatch(null);
      }
    }
  };

  let cleanup = () => {};
  const listener = showControls.add(show => {
    cleanup();
    if (show) {
      for (const trackElem of videoElem.textTracks) {
        if (trackElem.mode !== "showing") continue;

        const handleCueChange = () => {
          const cues: VTTCue[] = [...(trackElem.activeCues as any ?? [])];
          for (let i = 0; i < cues.length; i++) {
            const cue = cues[i]!;
            liftCue(cue);
          }
        };

        handleCueChange();
        trackElem.addEventListener("cuechange", handleCueChange);
        cleanup = () => {
          trackElem.removeEventListener("cuechange", handleCueChange);
          cleanup = () => {};
        };
      }
    } else {
      for (const trackElem of videoElem.textTracks) {
        if (trackElem.mode !== "showing") continue;
        resetCues(trackElem.cues);
      }
    }
  });

  addCleanup(() => {
    cleanup();
    listener.detach();
  });

  return {
    activeTrack,
    handleSubTrackSelect,
    handleSubTrackDisable,
  };
}
