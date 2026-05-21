import { Range } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import SubtitleIcon from "../assets/subtitles.svg";
import { NCPlayerContext } from "../player";
import { SubtitleTrack } from "../player.component";
import { isInside } from "../utilities/is-inside";
import { CustomSubTrackController } from "./subtitle-controller-custom-track";
import { NativeSubTrackController } from "./subtitle-controller-native-track";

export interface TrackController {
  activeTrack(): ReadonlySignal<SubtitleTrack | undefined>;
  activeTrackID(): ReadonlySignal<string | undefined>;
  select(track: SubtitleTrack): void;
  unselect(): void;
  transfer(c: TrackController): void;
  dispose(): void;
  renderSubtitles(): HTMLDivElement | null;
}

export class SubtitleController {
  subtitlesElement = sig<HTMLDivElement | null>();
  private popoverElement = sig<HTMLDivElement>();
  private popoverVisible = sig(false);
  private track!: TrackController;

  constructor(
    protected context: NCPlayerContext,
  ) {
    const observer = context.subSettings.enabled.add(customSubsEnabled => {
      const prevCtrl = this.track;
      this.track = customSubsEnabled
        ? new CustomSubTrackController(context)
        : new NativeSubTrackController(context);

      if (prevCtrl) {
        prevCtrl.transfer(this.track);
        prevCtrl.dispose();
      }

      this.popoverElement.dispatch(this.renderPopover());
      this.subtitlesElement.dispatch(this.track.renderSubtitles());
    });
    context.globalEvent.on(
      "click",
      (e) => this.handleDocumentClick(e as MouseEvent),
      "document",
      {
        capture: true,
      },
    );

    context.cleanup(() => {
      observer.detach();
      this.track.dispose();
    });
  }

  private handleSubBtnClick() {
    this.popoverVisible.dispatch(true);
  }

  private handleDocumentClick(e: MouseEvent) {
    if (!this.popoverVisible.get()) {
      return;
    }

    // check if the click was outside the popover
    if (!isInside(e.target, ".subtitle-selector-popover")) {
      this.popoverVisible.dispatch(false);
      e.stopPropagation();
    }
  }

  private renderPopover() {
    const { subtitles } = this.context.props;

    return (
      <div
        class={{
          "subtitle-selector-popover": true,
          "popover-visible": this.popoverVisible,
        }}
      >
        <Range
          into={<div class="display-contents" />}
          data={subtitles.derive(t => t ?? [])}
        >
          {t => (
            <button
              class={{
                "subtitle-selector-item": true,
                "active": sig.eq(this.track.activeTrackID(), t.id),
              }}
              onclick={(ev) => {
                this.track.select(t);
                this.popoverVisible.dispatch(false);
                ev.stopPropagation();
                this.context.subtitleSelectListener({ selectedTrack: t });
              }}
            >
              {t.label}
            </button>
          )}
        </Range>
        <button
          class={{
            "subtitle-selector-item": true,
            "active": sig.eq(this.track.activeTrackID(), null),
          }}
          onclick={(ev) => {
            this.track.unselect();
            this.popoverVisible.dispatch(false);
            ev.stopPropagation();
            this.context.subtitleSelectListener({ selectedTrack: null });
          }}
        >
          None
        </button>
      </div>
    ) as HTMLDivElement;
  }

  renderButton() {
    const { subtitles } = this.context.props;

    return (
      <div>
        {subtitles.derive((subs) =>
          (subs?.length ?? 0) > 0
            ? (
              <button
                class={{
                  "ctl-btn": true,
                  "subtitle-selector-btn": true,
                  "popover-visible": this.popoverVisible,
                }}
                onclick={e => this.handleSubBtnClick()}
              >
                <div class="subtitle-selector-icon">
                  <SubtitleIcon />
                </div>
                {this.popoverElement}
              </button>
            )
            : <></>
        )}
      </div>
    );
  }

  selectSubtitleTrack(trackID: string | undefined) {
    if (trackID == null) {
      this.track.unselect();
    }

    const subtrack = this.context.props.subtitles.get()?.find(s =>
      s.id === trackID
    );
    if (subtrack) {
      this.track.select(subtrack);
    }
  }
}
