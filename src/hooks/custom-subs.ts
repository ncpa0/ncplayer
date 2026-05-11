import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { SubtitleTrack } from "../player.component";
import { SubLine, VTTParser } from "../utilities/web-vtt-parser";

export function useCustomSubs(props: {
  subtitles: ReadonlySignal<Array<SubtitleTrack> | undefined>;
  enabled: ReadonlySignal<boolean | undefined>;
  videoElem: HTMLVideoElement;
  addCleanup: (fn: Function) => void;
}) {
  const selectedSubs = sig<VTTIndex>();
  const visibleLines = sig<SubLine[]>([], {
    compare: arraysEq,
  });

  const onProgress = () => {
    const vttIndex = selectedSubs.get();
    if (vttIndex) {
      const lines = vttIndex.find(props.videoElem.currentTime * 1000);
      visibleLines.dispatch(lines);
    }
  };

  const selectSubs = (t: SubtitleTrack) => {
    selectedSubs.dispatch(undefined);
    visibleLines.dispatch([]);

    fetch(t.src).then(resp => resp.text()).then(subs => {
      const lines = VTTParser.parse(subs);
      selectedSubs.dispatch(new VTTIndex(t.id, t.label, t.srclang, lines));

      for (const l of lines) {
        l.parseContent();
      }

      onProgress();
    });
  };

  const unselect = () => {
    selectedSubs.dispatch(undefined);
    visibleLines.dispatch([]);
  };

  const observer = props.enabled.observe((isEnabled) => {
    if (isEnabled) {
      props.videoElem.addEventListener("timeupdate", onProgress);
    } else {
      props.videoElem.removeEventListener("timeupdate", onProgress);
    }
  });

  props.addCleanup(() => observer.detach());

  return {
    visibleLines,
    selectSubs,
    unselect,
    activeTrack: selectedSubs.derive(i => i?.id),
  };
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
  private starts: number[];
  private lines: SubLine[];

  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly lang: string,
    lines: SubLine[],
  ) {
    this.lines = lines;
    this.starts = lines.map(l => l.start.getTs());
  }

  find(time: number): SubLine[] {
    const result: SubLine[] = [];

    // Binary search for closest start <= time
    let left = 0;
    let right = this.starts.length - 1;
    let idx = -1;

    while (left <= right) {
      const mid = (left + right) >> 1;

      if (this.starts[mid]! <= time) {
        idx = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (idx === -1) return result;

    // Walk backwards (handle overlaps)
    for (let i = idx; i >= 0; i--) {
      const line = this.lines[i]!;
      if (line.end.getTs() < time) break;
      if (line.start.getTs() <= time) {
        result.push(line);
      }
    }

    // Walk forward (rare overlaps)
    for (let i = idx + 1; i < this.lines.length; i++) {
      const line = this.lines[i]!;
      if (line.start.getTs() > time) break;
      if (line.end.getTs() >= time) {
        result.push(line);
      }
    }

    return result;
  }
}
