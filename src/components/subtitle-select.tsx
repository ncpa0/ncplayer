import { Range } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import SubtitleIcon from "../assets/subtitles.svg";
import { useCustomSubs } from "../hooks/custom-subs";
import { GlobalEventController } from "../hooks/global-events-controller";
import { useSubtrackController } from "../hooks/subtrack-controller";
import { SubtitleTrack } from "../player.component";
import { isInside } from "../utilities/is-inside";

export type SubtitleSettings = {
  fontSize?: number;
  textColor?: string;
  outlineColor?: string;
  outlineSize?: number;
  fontFamily?: string;
  padding?: number;
  forceNative?: boolean;
};

export type SubtitleSelectProps = {
  subtitles: ReadonlySignal<Array<SubtitleTrack> | undefined>;
  showControls: ReadonlySignal<boolean>;
  videoElem: HTMLVideoElement;
  globalEvents: GlobalEventController;
  addCleanup: (fn: Function) => void;
  customSubtitleDisplay: ReadonlySignal<boolean | undefined>;
  subSettings: ReadonlySignal<SubtitleSettings | undefined>;
  onChange?: (event: { selectedTrack: null | SubtitleTrack }) => void;
};

export function SubtitleSelect(
  props: SubtitleSelectProps,
) {
  const { globalEvents, onChange, customSubtitleDisplay } = props;
  const popoverVisible = sig(false);

  const nativeSubs = useSubtrackController(
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

  const o = customSubtitleDisplay.observe(customSubsEnabled => {
    if (customSubsEnabled) {
      const activeTrack = nativeSubs.activeTrack.get();
      if (activeTrack) {
        nativeSubs.handleSubTrackDisable();
        cSubs.selectSubs(activeTrack);
      }
    } else {
      const activeTrack = cSubs.activeTrack.get()?.track;
      if (activeTrack) {
        cSubs.unselect();
        setTimeout(() => {
          nativeSubs.handleSubTrackSelect(activeTrack);
        }, 100);
      }
    }
  });
  props.addCleanup(() => o.detach());

  const handlePress = () => {
    popoverVisible.dispatch(true);
  };

  const onDocumentClick = (e: MouseEvent) => {
    if (!popoverVisible.get()) {
      return;
    }

    // check if the click was outside the popover
    if (!isInside(e.target, ".subtitle-selector-popover")) {
      popoverVisible.dispatch(false);
      e.stopPropagation();
    }
  };

  globalEvents.on("click", onDocumentClick, "document", { capture: true });

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
              "active": sig.eq(nativeSubs.activeTrackID, t.id),
            }}
            onclick={(ev) => {
              nativeSubs.handleSubTrackSelect(t);
              popoverVisible.dispatch(false);
              ev.stopPropagation();
              onChange?.({ selectedTrack: t });
            }}
          >
            {t.label}
          </button>
        )}
      </Range>
      <button
        class={{
          "subtitle-selector-item": true,
          "active": sig.eq(nativeSubs.activeTrackID, null),
        }}
        onclick={(ev) => {
          nativeSubs.handleSubTrackDisable();
          popoverVisible.dispatch(false);
          ev.stopPropagation();
          onChange?.({ selectedTrack: null });
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
              "active": sig.eq(cSubs.activeTrackID, t.id),
            }}
            onclick={(ev) => {
              cSubs.selectSubs(t);
              popoverVisible.dispatch(false);
              ev.stopPropagation();
              onChange?.({ selectedTrack: t });
            }}
          >
            {t.label}
          </button>
        )}
      </Range>
      <button
        class={{
          "subtitle-selector-item": true,
          "active": sig.eq(cSubs.activeTrackID, null),
        }}
        onclick={(ev) => {
          cSubs.unselect();
          popoverVisible.dispatch(false);
          ev.stopPropagation();
          onChange?.({ selectedTrack: null });
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

          const groupedLines = Object.groupBy(lines, (l) =>
            l.settings.verticalPos());

          const inset = settings?.padding ?? 1;

          return (
            <div
              class="subtitles-container"
              style={{
                top: `${inset.toFixed(2)}em`,
                left: `${inset.toFixed(2)}em`,
                right: `${inset.toFixed(2)}em`,
                bottom: props.showControls.derive(s =>
                  s ? `${(inset + 4).toFixed(2)}em` : `${inset.toFixed(2)}em`
                ),
              }}
            >
              {Object.entries(groupedLines).map(([valignStr, lines]) => {
                if (!lines) {
                  return <></>;
                }

                const valign = Number(valignStr);
                const lineStyles: JSX.VjsxStyles = {};

                if (valign <= 50) {
                  lineStyles.top = valign + "%";
                } else {
                  lineStyles.bottom = (100 - valign) + "%";
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
                    {lines.map((line) => {
                      const text = line.parseContent();

                      const sublineStyles: JSX.VjsxStyles = {
                        maxWidth: line.settings.getWidth(),
                        textAlign: line.settings.alignment(),
                      };
                      if (line.settings.horizontalPos() < 50) {
                        sublineStyles.marginLeft = "unset";
                      } else if (line.settings.horizontalPos() > 50) {
                        sublineStyles.marginRight = "unset";
                      }

                      return (
                        <span class="subtitle-subline" style={sublineStyles}>
                          {text.flatMap((t) => {
                            const textLines = t.text.split("\n");
                            const tclasses: Record<string, string | boolean> = {
                              "subtitle-text-block": true,
                              "sub-bold": t.isBold(),
                              "sub-italic": t.isItalic(),
                              "sub-underline": t.isUnderline(),
                            };
                            if (t.getClass() != "") {
                              tclasses[t.getClass()] = true;
                            }
                            return (
                              <span
                                class={tclasses}
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
                  </span>
                );
              })}
            </div>
          );
        },
      )}
    </div>
  );

  return {
    controlElement,
    subsOut,
    controls: {
      selectSubtitleTrack(trackID: string | undefined) {
        if (trackID == null) {
          if (customSubtitleDisplay.get()) {
            cSubs.unselect();
          } else {
            nativeSubs.handleSubTrackDisable();
          }
        }

        const track = props.subtitles.get()?.find(s => s.id === trackID);
        if (track) {
          if (customSubtitleDisplay.get()) {
            cSubs.selectSubs(track);
          } else {
            nativeSubs.handleSubTrackSelect(track);
          }
        }
      },
    },
  };
}
