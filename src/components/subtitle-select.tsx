import { Range, ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx";
import subtitleIcon from "../assets/subtitles.svg";
import { Dismounter, SubtitleTrack } from "../player.component";

export type SubtitleSelectProps = {
  subtitles: ReadonlySignal<Array<SubtitleTrack> | undefined>;
  onselect(track: SubtitleTrack): void;
  dismounter?: Dismounter;
};

export function SubtitleSelect(
  props: SubtitleSelectProps,
) {
  const popoverVisible = sig(false);

  const handlePress = () => {
    popoverVisible.dispatch(v => !v);
  };

  const handleSelect = (track: SubtitleTrack) => {
    props.onselect(track);
  };

  const onDocumentClick = (e: MouseEvent) => {
    if (!popoverVisible.current()) {
      return;
    }

    // check if the click was outside the popover
    if (
      e.target instanceof HTMLElement
      && !e.target.closest(".subtitle-selector-btn")
    ) {
      popoverVisible.dispatch(false);
      e.stopPropagation();
      e.preventDefault();
    }
  };

  window.addEventListener("click", onDocumentClick);
  props.dismounter?.ondismount(() => {
    window.removeEventListener("click", onDocumentClick);
  });

  const popover = (
    <Range
      into={<div class="subtitle-selector-popover" />}
      data={props.subtitles.derive(t => t ?? [])}
    >
      {t => (
        <button
          class="subtitle-selector-item"
          onclick={() => handleSelect(t)}
        >
          {t.label}
        </button>
      )}
    </Range>
  );

  return (
    <div>
      {props.subtitles.derive((subs) =>
        (subs?.length ?? 0) > 0
          ? (
            <button
              class={{
                "ctl-btn": true,
                "subtitle-selector-btn": true,
                "popover-visible": popoverVisible,
              }}
              onclick={handlePress}
            >
              <div class="subtitle-selector-icon" unsafeHTML>
                {subtitleIcon}
              </div>
              {popoverVisible.derive(v => v && popover)}
            </button>
          )
          : null
      )}
    </div>
  );
}
