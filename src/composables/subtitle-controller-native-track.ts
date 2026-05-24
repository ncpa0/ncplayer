import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { NCPlayerContext } from "../player";
import { SubtitleTrack } from "../player.component";
import { countChar } from "../utilities/count-char";
import { TrackController } from "./subtitle-controller";

export class NativeSubTrackController implements TrackController {
  private _activeTrack = sig<undefined | SubtitleTrack>(undefined);
  private _activeTrackID = this._activeTrack.derive(t => t?.id);
  private activeTrackElem: TextTrack | undefined;
  private cleanupFn = () => {};
  private settingsObserver;
  private subsObserver;

  constructor(protected context: NCPlayerContext) {
    this.settingsObserver = context.controls.showControls.add(show => {
      this.onControlsVisibilityChange(show);
    });
    this.subsObserver = this.context.props.subtitles.add((subs = []) => {
      const currentTrackID = this._activeTrack.get()?.id;
      if (currentTrackID != null && !subs.some(s => s.id === currentTrackID)) {
        this.unselect();
      }
    });
  }

  private liftCue(cue: VTTCue) {
    if (cue.line === "auto") {
      const eolChars = countChar(cue.text, "\n");
      // cues in chrome are iffy, need to set them to
      // positive number first for them to take effect
      cue.line = 1;
      cue.line = -3 - eolChars;
    }
  }

  private resetCues(cuesList?: TextTrackCueList | null) {
    const cues = [...(cuesList ?? [])] as VTTCue[];
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i]!;
      if (cue.line !== "auto") {
        cue.line = "auto";
      }
    }
  }

  private onControlsVisibilityChange(show: boolean) {
    this.cleanupFn();
    if (show) {
      for (const trackElem of this.context.video.textTracks) {
        if (trackElem.mode !== "showing") continue;

        const handleCueChange = () => {
          const cues: VTTCue[] = [...(trackElem.activeCues as any ?? [])];
          for (let i = 0; i < cues.length; i++) {
            const cue = cues[i]!;
            this.liftCue(cue);
          }
        };

        handleCueChange();
        trackElem.addEventListener("cuechange", handleCueChange);
        this.cleanupFn = () => {
          trackElem.removeEventListener("cuechange", handleCueChange);
          this.cleanupFn = () => {};
        };
      }
    } else {
      for (const trackElem of this.context.video.textTracks) {
        if (trackElem.mode !== "showing") continue;
        this.resetCues(trackElem.cues);
      }
    }
  }

  activeTrack(): ReadonlySignal<SubtitleTrack | undefined> {
    return this._activeTrack;
  }

  activeTrackID(): ReadonlySignal<string | undefined> {
    return this._activeTrackID;
  }

  select(track: SubtitleTrack): void {
    if (track === this._activeTrack.get()) {
      return;
    }

    for (const trackElem of this.context.video.textTracks) {
      if (trackElem.id === track.id) {
        if (this.activeTrackElem) {
          this.activeTrackElem.mode = "disabled";
        }
        // console.log("enabling sub track:", trackElem);
        trackElem.mode = "showing";
        this.activeTrackElem = trackElem;
        this._activeTrack.dispatch(track);

        // cue line changes are iffy, won't take effect if set before displaying
        // so we need to wait a bit
        setTimeout(() => {
          const cues = [...(trackElem.activeCues ?? [])] as VTTCue[];
          for (const cue of cues) {
            this.liftCue(cue);
          }
        }, 25);
      } else {
        trackElem.mode = "disabled";
      }
    }
  }

  unselect(): void {
    if (this.activeTrackElem) {
      this.activeTrackElem.mode = "disabled";
    }
    this._activeTrack.dispatch(undefined);
  }

  transfer(c: TrackController): void {
    const at = this._activeTrack.get();
    if (at) {
      this.unselect();
      setTimeout(() => {
        c.select(at);
      }, 100);
    }
  }

  dispose() {
    this.cleanupFn();
    this.settingsObserver.detach();
    this.subsObserver.detach();
  }

  renderSubtitles() {
    return null;
  }
}
