import { Range } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import SubtitleIcon from "../assets/subtitles.svg";
import { useCustomSubs } from "../hooks/custom-subs";
import { GlobalEventController } from "../hooks/global-events-controller";
import { useSubtrackController } from "../hooks/subtrack-controller";
import { SubtitleTrack } from "../player.component";

export type SubtitleSettings = {
  fontSize?: number;
  textColor?: string;
  outlineColor?: string;
  outlineSize?: number;
  fontFamily?: string;
};

export type SubtitleSelectProps = {
  subtitles: ReadonlySignal<Array<SubtitleTrack> | undefined>;
  showControls: ReadonlySignal<boolean>;
  videoElem: HTMLVideoElement;
  globalEvents: GlobalEventController;
  addCleanup: (fn: Function) => void;
  customSubtitleDisplay: ReadonlySignal<boolean | undefined>;
  subSettings: ReadonlySignal<SubtitleSettings | undefined>;
};

export function SubtitleSelect(
  props: SubtitleSelectProps,
) {
  const { globalEvents, customSubtitleDisplay } = props;
  const popoverVisible = sig(false);

  const { activeTrack, handleSubTrackSelect, handleSubTrackDisable } =
    useSubtrackController(
      props.videoElem,
      props.showControls,
      props.addCleanup,
    );

  const cSubs = useCustomSubs({
    addCleanup: props.addCleanup,
    enabled: customSubtitleDisplay,
    subtitles: props.subtitles,
    videoElem: props.videoElem,
  });

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

  globalEvents.on("click", onDocumentClick);

  const nativeSubsPopover = (
    <div class="subtitle-selector-popover">
      <Range
        into={<div class="display-contents" />}
        data={props.subtitles.derive(t => t ?? [])}
      >
        {t => (
          <button
            class={{
              "subtitle-selector-item": true,
              "active": sig.eq(activeTrack, t.id),
            }}
            onclick={(ev) => {
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
          "active": sig.eq(activeTrack, null),
        }}
        onclick={() => {
          handleSubTrackDisable();
        }}
      >
        None
      </button>
    </div>
  );

  const customSubsPopover = (
    <div class="subtitle-selector-popover">
      <Range
        into={<div class="display-contents" />}
        data={props.subtitles.derive(t => t ?? [])}
      >
        {t => (
          <button
            class={{
              "subtitle-selector-item": true,
              "active": sig.eq(cSubs.activeTrack, t.id),
            }}
            onclick={(ev) => {
              cSubs.selectSubs(t);
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
          "active": sig.eq(cSubs.activeTrack, null),
        }}
        onclick={() => {
          cSubs.unselect();
        }}
      >
        None
      </button>
    </div>
  );

  const controlElement = (
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
              <div class="subtitle-selector-icon">
                <SubtitleIcon />
              </div>
              {sig.derive(
                popoverVisible,
                customSubtitleDisplay,
                (visible, useCustom) => {
                  if (!visible) {
                    return <></>;
                  }
                  if (useCustom) {
                    return customSubsPopover;
                  }
                  return nativeSubsPopover;
                },
              )}
            </button>
          )
          : <></>
      )}
    </div>
  );

  const subsOut = (
    <div>
      {sig.derive(
        customSubtitleDisplay,
        cSubs.visibleLines,
        props.subSettings,
        (useCustom, lines, settings) => {
          if (!useCustom) return <></>;

          return (
            <div
              class="subtitles-container"
              style={{
                bottom: props.showControls.derive(s => s ? "4em" : "1em"),
              }}
            >
              {lines.map(line => {
                const text = line.parseContent();
                const lineStyles: JSX.VjsxStyles = {
                  maxWidth: line.settings.getWidth(),
                  textAlign: line.settings.alignment(),
                };

                if (line.settings.verticalPos() <= 50) {
                  lineStyles.top = line.settings.verticalPos() + "%";
                } else {
                  lineStyles.bottom = (100 - line.settings.verticalPos()) + "%";
                }

                lineStyles.left = 0;
                lineStyles.right = 0;
                lineStyles.width = "100%";
                lineStyles.marginLeft = "auto";
                lineStyles.marginRight = "auto";
                if (line.settings.horizontalPos() < 50) {
                  lineStyles.textAlign = "start";
                } else if (line.settings.horizontalPos() > 50) {
                  lineStyles.textAlign = "end";
                } else {
                  lineStyles.textAlign = "center";
                }

                if (settings?.textColor) {
                  lineStyles["--txtclr"] = settings.textColor;
                }
                if (settings?.fontSize) {
                  lineStyles["--fsize"] = settings.fontSize + "cqw";
                }
                if (settings?.outlineSize) {
                  lineStyles["--outlinesize"] = settings.outlineSize.toFixed(3);
                }
                if (settings?.outlineColor) {
                  lineStyles["--outlineclr"] = settings.outlineColor;
                }
                if (settings?.fontFamily) {
                  lineStyles["--font"] = settings.fontFamily;
                }

                return (
                  <span
                    class="subtitle-line"
                    style={lineStyles}
                  >
                    {text.map(t => {
                      const textLines = t.text.split("\n");
                      return (
                        <span
                          class={{
                            "subtitle-text-block": true,
                            "sub-bold": t.isBold(),
                            "sub-italic": t.isItalic(),
                            "sub-underline": t.isUnderline(),
                          }}
                        >
                          {textLines.flatMap((l, idx) => {
                            const isLast = idx === textLines.length - 1;
                            if (isLast) return l;
                            return [l, <br />];
                          })}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </div>
          );
        },
      )}
    </div>
  );

  return { controlElement, subsOut };
}
