import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { NCPlayerContext } from "../player";
import { SubtitleTrack } from "../player.component";
import { SubLine, VTTParser } from "../utilities/web-vtt-parser";
import { TrackController } from "./subtitle-controller";

export class CustomSubTrackController implements TrackController {
  private selectedSubs = sig<{
    index: VTTIndex;
    styles?: HTMLStyleElement;
  }>();
  private visibleLines = sig<SubLine[]>([], {
    compare: arraysEq,
  });
  private fetchAbort?: AbortController;
  private settingsObserver;
  private subsObserver;

  constructor(protected context: NCPlayerContext) {
    const progressCb = () => this.onProgress();
    this.settingsObserver = context.subSettings.enabled.add((isEnabled) => {
      if (isEnabled) {
        context.video.addEventListener(
          "timeupdate",
          progressCb,
        );
      } else {
        context.video.removeEventListener(
          "timeupdate",
          progressCb,
        );
      }
    });
    this.subsObserver = this.context.props.subtitles.add((subs = []) => {
      const currentTrackID = this.selectedSubs.get()?.index.track.id;
      if (currentTrackID != null && !subs.some(s => s.id === currentTrackID)) {
        this.unselect();
      }

      const defaultSub = subs.find(s => s.default);
      if (defaultSub) {
        this.select(defaultSub);
      }
    });
  }

  private _activeTrack = this.selectedSubs.derive(s => s?.index.track);
  activeTrack(): ReadonlySignal<SubtitleTrack | undefined> {
    return this._activeTrack;
  }

  private _activeTrackID = this._activeTrack.derive(t => t?.id);
  activeTrackID(): ReadonlySignal<string | undefined> {
    return this._activeTrackID;
  }

  private onProgress() {
    const vttIndex = this.selectedSubs.get()?.index;
    if (vttIndex) {
      const lines = vttIndex.find(this.context.video.currentTime * 1000);
      lines.sort((a, b) => {
        return a.start.getTs() - b.start.getTs();
      });
      this.visibleLines.dispatch(lines);
    }
  }

  getSubTrackClassName(t: SubtitleTrack) {
    return "sub_" + t.id.replaceAll(/[^a-zA-Z0-9-_]/g, "");
  }

  select(t: SubtitleTrack) {
    if (t === this.selectedSubs.get()?.index.track) {
      return;
    }

    if (this.fetchAbort != null) {
      this.fetchAbort.abort(new Error("another track was selected"));
      this.fetchAbort = undefined;
    }

    this.selectedSubs.dispatch(undefined);
    this.visibleLines.dispatch([]);

    this.fetchAbort = new AbortController();
    const s = this.fetchAbort.signal;

    fetch(t.src, { signal: s }).then(resp => resp.text())
      .then(subs => {
        if (s.aborted) return;

        const { lines, styles } = VTTParser.parse(subs);

        this.selectedSubs.dispatch({
          index: new VTTIndex(t, lines),
          styles: styles.length > 0
            ? ((
              <style>
                {styles.map(s =>
                  s.toHtmlStyles({
                    cue: `.${this.getSubTrackClassName(t)} .ncplayer-cue`,
                    bold: ".sub-bold",
                    italic: ".sub-italic",
                    underline: ".sub-underline",
                  })
                )}
              </style>
            ) as HTMLStyleElement)
            : undefined,
        });

        for (const l of lines) {
          l.parseContent();
        }

        this.onProgress();
      });
  }

  unselect() {
    this.selectedSubs.dispatch(undefined);
    this.visibleLines.dispatch([]);
    this.fetchAbort?.abort();
    this.fetchAbort = undefined;
  }

  transfer(c: TrackController): void {
    const at = this.selectedSubs.get()?.index.track;
    this.unselect();
    if (at) {
      setTimeout(() => {
        c.select(at);
      }, 100);
    }
  }

  dispose() {
    this.settingsObserver.detach();
    this.subsObserver.detach();
    this.fetchAbort?.abort();
  }

  renderSubtitles() {
    return (
      <div
        class={this.selectedSubs.derive(s =>
          s ? this.getSubTrackClassName(s?.index.track) : ""
        )}
      >
        {this.selectedSubs.derive(s => s?.styles)}
        {sig.derive(
          this.visibleLines,
          this.context.subSettings.values.signal,
          (lines, settings) => {
            const groupedLines = Object.groupBy(
              lines,
              (l) => l.settings.verticalPos(),
            );

            const inset = settings.padding ?? 1;

            return (
              <div
                class="subtitles-container"
                style={{
                  top: `${inset.toFixed(2)}em`,
                  left: `${inset.toFixed(2)}em`,
                  right: `${inset.toFixed(2)}em`,
                  bottom: this.context.controls.showControls.derive(s =>
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

                  if (settings.textColor) {
                    lineStyles["--txtclr"] = settings.textColor;
                  }
                  if (settings.fontSize) {
                    lineStyles["--fsize"] = settings.fontSize + "cqw";
                  }
                  if (settings.outlineSize) {
                    lineStyles["--outlinesize"] = settings.outlineSize.toFixed(
                      3,
                    );
                  }
                  if (settings.outlineColor) {
                    lineStyles["--outlineclr"] = settings.outlineColor;
                  }
                  if (settings.fontFamily) {
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
                          <span
                            class="subtitle-subline"
                            style={sublineStyles}
                          >
                            <span class="ncplayer-cue">
                              {text.flatMap((t) => {
                                const textLines = t.text.split("\n");
                                const tclasses: Record<
                                  string,
                                  string | boolean
                                > = {
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
                                    lang={t.language}
                                  >
                                    {textLines.flatMap((l, idx) => {
                                      const isLast =
                                        idx === textLines.length - 1;
                                      if (isLast) return l;
                                      return [l, <br />];
                                    })}
                                  </span>
                                );
                              })}
                            </span>
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
    ) as HTMLDivElement;
  }
}

function arraysEq<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]! !== b[i]!) {
      return false;
    }
  }
  return true;
}

export class VTTIndex {
  private readonly starts: readonly number[];

  constructor(
    public readonly track: SubtitleTrack,
    private readonly lines: readonly SubLine[],
  ) {
    this.starts = lines.map(l => l.start.getTs());
  }

  private lastHitIdx?: number;
  private lastHitTime?: number;

  private result(time: number, idx: number, res: SubLine[]) {
    if (idx >= 0 && res.length > 0) {
      this.lastHitIdx = idx;
      this.lastHitTime = time;
    }

    return res;
  }

  find(time: number): SubLine[] {
    if (
      this.lastHitIdx != null
      && this.lastHitTime! - time < 10_000
    ) {
      return this.linearSearch(time, this.lastHitIdx);
    }

    return this.binarySearch(time);
  }

  private linearSearch(time: number, startIdx: number): SubLine[] {
    const result: SubLine[] = [];
    let firstHitIdx = -1;

    let line: SubLine;
    for (let i = startIdx; i < this.lines.length; i++) {
      line = this.lines[i]!;
      if (line.start.getTs() > time) break;
      if (line.end.getTs() >= time) {
        firstHitIdx = firstHitIdx === -1 ? i : firstHitIdx;
        result.push(line);
      }
    }

    return this.result(time, firstHitIdx, result);
  }

  private binarySearch(time: number): SubLine[] {
    const result: SubLine[] = [];

    // Binary search for closest start <= time
    let left = 0;
    let right = this.starts.length - 1;
    let idx = -1;

    let mid: number;
    while (left <= right) {
      mid = (left + right) >> 1;

      if (this.starts[mid]! <= time) {
        idx = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (idx === -1) return result;

    let firstHitIdx = -1;

    // Walk backwards (handle overlaps)
    let line: SubLine;
    for (let i = idx; i >= 0; i--) {
      line = this.lines[i]!;
      if (line.end.getTs() < time) break;
      if (line.start.getTs() <= time) {
        firstHitIdx = i;
        result.push(line);
      }
    }

    // Walk forward (rare overlaps)
    for (let i = idx + 1; i < this.lines.length; i++) {
      line = this.lines[i]!;
      if (line.start.getTs() > time) break;
      if (line.end.getTs() >= time) {
        firstHitIdx = firstHitIdx === -1 ? i : firstHitIdx;
        result.push(line);
      }
    }

    return this.result(time, firstHitIdx, result);
  }
}
