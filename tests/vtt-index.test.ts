import { describe, expect, it } from "vitest";
import { VTTIndex } from "../src/composables/subtitle-controller-custom-track";
import {
  LineSettings,
  SubLine,
  Timestamp,
} from "../src/utilities/web-vtt-parser";

const track = { id: "t1", src: "", srclang: "en", label: "English" };

function msToTimestamp(ms: number): Timestamp {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mls = ms % 1000;
  return Timestamp.new({
    hour: String(h),
    minute: String(m).padStart(2, "0"),
    second: String(s).padStart(2, "0"),
    millisecond: String(mls).padStart(3, "0"),
  });
}

function makeLine(startMs: number, endMs: number, content = ""): SubLine {
  return SubLine.new({
    start: msToTimestamp(startMs),
    end: msToTimestamp(endMs),
    content,
    settings: LineSettings.new(),
  });
}

function expectContents(actual: SubLine[], expected: string[]) {
  const contents = actual.map((l) => l.content);
  expect(contents).toHaveLength(expected.length);
  for (const e of expected) {
    expect(contents).toContainEqual(e);
  }
}

describe("VTTIndex", () => {
  describe("find", () => {
    it("returns an empty array when no cues exist", () => {
      const index = new VTTIndex(track, []);
      expect(index.find(0)).toEqual([]);
    });

    it("returns an empty array when time is before all cues", () => {
      const index = new VTTIndex(track, [makeLine(1000, 2000, "A")]);
      expect(index.find(500)).toEqual([]);
    });

    it("returns an empty array when time is after all cues", () => {
      const index = new VTTIndex(track, [makeLine(1000, 2000, "A")]);
      expect(index.find(2500)).toEqual([]);
    });

    it("returns a cue active at the given time", () => {
      const index = new VTTIndex(track, [makeLine(1000, 2000, "A")]);
      expectContents(index.find(1500), ["A"]);
    });

    it("returns a cue when time equals its start timestamp", () => {
      const index = new VTTIndex(track, [makeLine(1000, 2000, "A")]);
      expectContents(index.find(1000), ["A"]);
    });

    it("returns a cue when time equals its end timestamp", () => {
      const index = new VTTIndex(track, [makeLine(1000, 2000, "A")]);
      expectContents(index.find(2000), ["A"]);
    });

    it("returns multiple overlapping cues", () => {
      const index = new VTTIndex(track, [
        makeLine(0, 5000, "A"),
        makeLine(2000, 3000, "B"),
        makeLine(6000, 7000, "C"),
      ]);
      expectContents(index.find(2500), ["A", "B"]);
    });

    it("returns an empty array in a gap between cues", () => {
      const index = new VTTIndex(track, [
        makeLine(0, 1000, "A"),
        makeLine(2000, 3000, "B"),
      ]);
      expect(index.find(1500)).toEqual([]);
    });

    it("finds the last cue correctly", () => {
      const index = new VTTIndex(track, [
        makeLine(0, 1000, "A"),
        makeLine(2000, 3000, "B"),
        makeLine(4000, 5000, "C"),
      ]);
      expectContents(index.find(4500), ["C"]);
    });

    it("finds correct cues after a small backward seek", () => {
      const index = new VTTIndex(track, [
        makeLine(0, 5000, "A"),
        makeLine(3000, 4000, "B"),
        makeLine(20000, 21000, "C"),
      ]);

      expectContents(index.find(3500), ["A", "B"]);
      // backward seek of 500ms (< 10s threshold)
      expectContents(index.find(3000), ["A", "B"]);
    });

    it("finds correct cues after a large backward seek", () => {
      const index = new VTTIndex(track, [
        makeLine(0, 5000, "A"),
        makeLine(3000, 4000, "B"),
        makeLine(20000, 21000, "C"),
      ]);

      expectContents(index.find(3500), ["A", "B"]);
      expectContents(index.find(20500), ["C"]);
      // backward seek of 19500ms (>= 10s threshold)
      expectContents(index.find(1000), ["A"]);
    });

    it("handles many non-overlapping cues via forward scanning", () => {
      const lines: SubLine[] = [];
      for (let i = 0; i < 200; i++) {
        lines.push(makeLine(i * 1000, i * 1000 + 800, `Cue${i}`));
      }
      const index = new VTTIndex(track, lines);

      // Simulate playback in small 250ms increments
      for (let t = 0; t < 200_000; t += 250) {
        const expected: string[] = [];
        for (const l of lines) {
          if (l.start.getTs() <= t && l.end.getTs() >= t) {
            expected.push(l.content);
          }
        }
        const result = index.find(t);
        expectContents(result, expected);
      }
    });

    it("handles many cues with overlaps via forward scanning", () => {
      const lines: SubLine[] = [];
      // Create overlapping cues: even cues span 2s, odd cues span 1s and overlap
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          lines.push(makeLine(i * 1000, i * 1000 + 2000, `Even${i}`));
        } else {
          lines.push(makeLine(i * 1000, i * 1000 + 500, `Odd${i}`));
        }
      }
      const index = new VTTIndex(track, lines);

      // Simulate playback in 150ms increments
      for (let t = 0; t < 100_000; t += 150) {
        const expected: string[] = [];
        for (const l of lines) {
          if (l.start.getTs() <= t && l.end.getTs() >= t) {
            expected.push(l.content);
          }
        }
        const result = index.find(t);
        expectContents(result, expected);
      }
    });

    it("handles a mix of short and long cues with forward increments", () => {
      const lines: SubLine[] = [
        makeLine(0, 2100, "LongA"),
        makeLine(1000, 1500, "Short1"),
        makeLine(2000, 2200, "Short2"),
        makeLine(2500, 8000, "LongB"),
        makeLine(4000, 4100, "Short3"),
        makeLine(6000, 6100, "Short4"),
        makeLine(7000, 7100, "Short5"),
        makeLine(9000, 12000, "LongC"),
      ];
      const index = new VTTIndex(track, lines);

      // Simulate playback in 100ms increments
      expectContents(index.find(0), ["LongA"]);
      expectContents(index.find(100), ["LongA"]);
      expectContents(index.find(200), ["LongA"]);
      expectContents(index.find(300), ["LongA"]);
      expectContents(index.find(400), ["LongA"]);
      expectContents(index.find(500), ["LongA"]);
      expectContents(index.find(600), ["LongA"]);
      expectContents(index.find(700), ["LongA"]);
      expectContents(index.find(800), ["LongA"]);
      expectContents(index.find(900), ["LongA"]);
      expectContents(index.find(1000), ["LongA", "Short1"]);
      expectContents(index.find(1100), ["LongA", "Short1"]);
      expectContents(index.find(1200), ["LongA", "Short1"]);
      expectContents(index.find(1300), ["LongA", "Short1"]);
      expectContents(index.find(1400), ["LongA", "Short1"]);
      expectContents(index.find(1500), ["LongA", "Short1"]);
      expectContents(index.find(1600), ["LongA"]);
      expectContents(index.find(1700), ["LongA"]);
      expectContents(index.find(1800), ["LongA"]);
      expectContents(index.find(1900), ["LongA"]);
      expectContents(index.find(2000), ["LongA", "Short2"]);
      expectContents(index.find(2100), ["LongA", "Short2"]);
      expectContents(index.find(2200), ["Short2"]);
      expectContents(index.find(2300), []);
      expectContents(index.find(2400), []);
      expectContents(index.find(2500), ["LongB"]);
      expectContents(index.find(2600), ["LongB"]);
    });

    it("handles gaps and active regions with small forward steps", () => {
      const lines: SubLine[] = [
        makeLine(0, 1000, "A"),
        makeLine(3000, 4000, "B"),
        makeLine(8000, 9000, "C"),
        makeLine(9500, 10000, "D"),
      ];
      const index = new VTTIndex(track, lines);

      // Simulate playback in 200ms increments
      for (let t = 0; t <= 10000; t += 200) {
        const expected: string[] = [];
        for (const l of lines) {
          if (l.start.getTs() <= t && l.end.getTs() >= t) {
            expected.push(l.content);
          }
        }
        const result = index.find(t);
        expectContents(result, expected);
      }
    });

    it("handles a dense subtitle track with frequent small time steps", () => {
      const lines: SubLine[] = [];
      // 500 cues, each 300ms long, starting every 250ms (50ms overlap)
      for (let i = 0; i < 500; i++) {
        lines.push(makeLine(i * 250, i * 250 + 300, `Dense${i}`));
      }
      const index = new VTTIndex(track, lines);

      // Simulate playback in 50ms increments
      for (let t = 0; t < 125_000; t += 50) {
        const expected: string[] = [];
        for (const l of lines) {
          if (l.start.getTs() <= t && l.end.getTs() >= t) {
            expected.push(l.content);
          }
        }
        const result = index.find(t);
        expectContents(result, expected);
      }
    });

    it("handles forward scanning with a backward seek mid-playback", () => {
      const lines: SubLine[] = [];
      for (let i = 0; i < 50; i++) {
        lines.push(makeLine(i * 2000, i * 2000 + 1500, `Cue${i}`));
      }
      const index = new VTTIndex(track, lines);

      // Forward scan first 10 cues
      for (let t = 0; t < 20000; t += 250) {
        const expected: string[] = [];
        for (const l of lines) {
          if (l.start.getTs() <= t && l.end.getTs() >= t) {
            expected.push(l.content);
          }
        }
        expectContents(index.find(t), expected);
      }

      // Small backward seek (< 10s)
      const backwardTime = 18000;
      expectContents(index.find(backwardTime), ["Cue9"]);

      // Continue forward scan
      for (let t = backwardTime; t < 50000; t += 250) {
        const expected: string[] = [];
        for (const l of lines) {
          if (l.start.getTs() <= t && l.end.getTs() >= t) {
            expected.push(l.content);
          }
        }
        expectContents(index.find(t), expected);
      }
    });
  });
});
