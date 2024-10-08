import { Range } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import SubtitleIcon from "../assets/subtitles.svg";
import { useSubtrackController } from "../hooks/subtrack-controller";
import { Dismounter, SubtitleTrack } from "../player.component";

export type SubtitleSelectProps = {
  subtitles: ReadonlySignal<Array<SubtitleTrack> | undefined>;
  showControls: ReadonlySignal<boolean>;
  videoElem: HTMLVideoElement;
  dismounter?: Dismounter;
};

export function SubtitleSelect(
  props: SubtitleSelectProps,
) {
  const popoverVisible = sig(false);

  const { activeTrack, handleSubTrackSelect, handleSubTrackDisable } =
    useSubtrackController(
      props.videoElem,
      props.showControls,
      props.dismounter,
    );

  const handlePress = (e: MouseEvent) => {
    popoverVisible.dispatch(v => !v);
    e.stopPropagation();
    e.preventDefault();
  };

  const onDocumentClick = (e: MouseEvent) => {
    if (!popoverVisible.get()) {
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
    <div class="subtitle-selector-popover">
      <Range
        into={<div class="display-contents" />}
        data={props.subtitles.derive(t => t ?? [])}
      >
        {t => (
          <button
            class={{
              "subtitle-selector-item": true,
              "active": activeTrack.derive(at => at === t.id),
            }}
            onmousedown={(ev) => {
              handleSubTrackSelect(t);
              popoverVisible.dispatch(false);
              ev.stopPropagation();
              ev.preventDefault();
            }}
          >
            {t.label}
          </button>
        )}
      </Range>
      <button
        class={{
          "subtitle-selector-item": true,
          "active": activeTrack.derive(at => at === null),
        }}
        onmousedown={handleSubTrackDisable}
      >
        None
      </button>
    </div>
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
              onmousedown={handlePress}
            >
              <div class="subtitle-selector-icon">
                <SubtitleIcon />
              </div>
              {popoverVisible.derive(v => v && popover)}
            </button>
          )
          : null
      )}
    </div>
  );
}
