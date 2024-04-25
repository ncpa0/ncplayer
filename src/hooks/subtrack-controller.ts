import { Signal } from "@ncpa0cpl/vanilla-jsx";
import { Dismounter, SubtitleTrack } from "../player.component";
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

export function useSubtrackController(
  videoElem: HTMLVideoElement,
  showControls: Signal<boolean>,
  dismounter?: Dismounter,
) {
  const handleSubTrackSelect = (track: SubtitleTrack) => {
    for (const trackElem of videoElem.textTracks) {
      if (trackElem.id === track.id) {
        trackElem.mode = "showing";

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

        const cues = [...(trackElem.activeCues ?? [])] as VTTCue[];
        for (const cue of cues) {
          if (cue.line !== "auto") {
            cue.line = "auto";
          }
        }
      }
    }
  });

  dismounter?.ondismount(() => {
    cleanup();
    listener.detach();
  });

  return {
    handleSubTrackSelect,
  };
}
