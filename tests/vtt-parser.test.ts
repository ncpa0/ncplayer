import { describe, expect, it } from "vitest";
import { Timestamp, VTTParser } from "../src/utilities/web-vtt-parser";

const SAMPLE_SIMPLE = `WEBVTT

1
00:01:29.980 --> 00:01:39.740
At the far northern edge of the continent,
we arrived at the place the people of this world
call heaven: Aureole, the land where souls rest.

2
00:01:39.740 --> 00:01:48.000
It was a place where many souls gathered,
and where I was able to converse with my old comrades.
— Great Mage Flamme

3
00:01:59.900 --> 00:02:00.860
Frieren.
`;

const SAMPLE_CUE_SETTINGS = `WEBVTT

1
00:01:29.980 --> 00:01:39.740 line:0%
At the far northern edge of the continent

2
00:01:39.740 --> 00:01:48.000 line:50% align:end
It was a place where many souls gathered

3
00:01:59.900 --> 00:02:00.860 align:start
Frieren.
`;

const SAMPLE_TAGS = `WEBVTT

1
00:01:29.980 --> 00:01:39.740 line:0%
At the far <b>northern edge</b> of the continent

2
00:01:39.740 --> 00:01:48.000 line:50% align:end
<i>It was a place where <b>many</b> souls gathered</i>

3
00:01:59.900 --> 00:02:00.860 align:start
<i>Frieren.</i>
`;

const SAMPLE_BR = `WEBVTT

1
00:00:01.000 --> 00:00:03.000
Hello<br />world

2
00:00:03.000 --> 00:00:05.000
Line1<br><br />Line2
`;

const SAMPLE_WEIRD_TAGS = `WEBVTT

1
00:00:01.000 --> 00:00:03.000
Hello <B   >world</B>

2
00:00:03.000 --> 00:00:05.000
<I   >italic <B   >bold</B   ></I   >

3
00:00:05.000 --> 00:00:07.000
Line<br   />break
`;

const NORMALIZATION_VOICE_SAMPLE = `WEBVTT

1
00:00:01.000 --> 00:00:03.000
<v   Alice  >Hello<BR />world</v>
`;

describe("VTTParser", () => {
  it("parses simple vtt subtitles", () => {
    const subLines = VTTParser.parse(SAMPLE_SIMPLE);

    expect(subLines).toEqual([
      {
        lineNumber: "1",
        settings: {},
        content:
          "At the far northern edge of the continent,\nwe arrived at the place the people of this world\ncall heaven: Aureole, the land where souls rest.",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "29",
          millisecond: "980",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "39",
          millisecond: "740",
        }),
      },
      {
        lineNumber: "2",
        settings: {},
        content:
          "It was a place where many souls gathered,\nand where I was able to converse with my old comrades.\n— Great Mage Flamme",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "39",
          millisecond: "740",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "48",
          millisecond: "000",
        }),
      },
      {
        lineNumber: "3",
        settings: {},
        content: "Frieren.",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "59",
          millisecond: "900",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "02",
          second: "00",
          millisecond: "860",
        }),
      },
    ]);
  });

  it("parses vtt with cue settings", () => {
    const subLines = VTTParser.parse(SAMPLE_CUE_SETTINGS);

    expect(subLines).toEqual([
      {
        lineNumber: "1",
        settings: { line: "0%" },
        content: "At the far northern edge of the continent",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "29",
          millisecond: "980",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "39",
          millisecond: "740",
        }),
      },
      {
        lineNumber: "2",
        settings: {
          line: "50%",
          align: "end",
        },
        content: "It was a place where many souls gathered",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "39",
          millisecond: "740",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "48",
          millisecond: "000",
        }),
      },
      {
        lineNumber: "3",
        settings: {
          align: "start",
        },
        content: "Frieren.",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "59",
          millisecond: "900",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "02",
          second: "00",
          millisecond: "860",
        }),
      },
    ]);
  });

  it("parses vtt with tags", () => {
    const subLines = VTTParser.parse(SAMPLE_TAGS);

    expect(subLines).toEqual([
      {
        lineNumber: "1",
        settings: { line: "0%" },
        content: "At the far <b>northern edge</b> of the continent",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "29",
          millisecond: "980",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "39",
          millisecond: "740",
        }),
      },
      {
        lineNumber: "2",
        settings: {
          line: "50%",
          align: "end",
        },
        content: "<i>It was a place where <b>many</b> souls gathered</i>",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "39",
          millisecond: "740",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "48",
          millisecond: "000",
        }),
      },
      {
        lineNumber: "3",
        settings: {
          align: "start",
        },
        content: "<i>Frieren.</i>",
        start: Timestamp.new({
          hour: "00",
          minute: "01",
          second: "59",
          millisecond: "900",
        }),
        end: Timestamp.new({
          hour: "00",
          minute: "02",
          second: "00",
          millisecond: "860",
        }),
      },
    ]);

    expect(subLines[0].parseContent()).toEqual([
      {
        text: "At the far ",
        tags: new Set(),
      },
      {
        text: "northern edge",
        tags: new Set(["b1"]),
      },
      {
        text: " of the continent",
        tags: new Set([]),
      },
    ]);

    expect(subLines[1].parseContent()).toEqual([
      {
        text: "It was a place where ",
        tags: new Set(["i1"]),
      },
      {
        text: "many",
        tags: new Set(["i1", "b1"]),
      },
      {
        text: " souls gathered",
        tags: new Set(["i1"]),
      },
    ]);

    expect(subLines[2].parseContent()).toEqual([
      {
        text: "Frieren.",
        tags: new Set(["i1"]),
      },
    ]);
  });

  it("parses <br /> as newline in parseContent", () => {
    const subLines = VTTParser.parse(SAMPLE_BR);

    expect(subLines[0].parseContent()).toEqual([
      {
        text: "Hello\nworld",
        tags: new Set(),
      },
    ]);

    expect(subLines[1].parseContent()).toEqual([
      {
        text: "Line1\n\nLine2",
        tags: new Set(),
      },
    ]);
  });

  it("normalizes tags with uppercase and extra whitespace", () => {
    const subLines = VTTParser.parse(SAMPLE_WEIRD_TAGS);

    // <B   >
    expect(subLines[0].parseContent()).toEqual([
      {
        text: "Hello ",
        tags: new Set(),
      },
      {
        text: "world",
        tags: new Set(["b1"]),
      },
    ]);

    // nested with messy spacing
    expect(subLines[1].parseContent()).toEqual([
      {
        text: "italic ",
        tags: new Set(["i1"]),
      },
      {
        text: "bold",
        tags: new Set(["i1", "b1"]),
      },
    ]);

    // weird <br   />
    expect(subLines[2].parseContent()).toEqual([
      {
        text: "Line\nbreak",
        tags: new Set(),
      },
    ]);
  });

  it("handles mixed normalization + voice + br", () => {
    const subLines = VTTParser.parse(NORMALIZATION_VOICE_SAMPLE);

    expect(subLines[0].parseContent()).toEqual([
      {
        speaker: "Alice",
        text: "Hello\nworld",
        tags: new Set(),
      },
    ]);
  });
});
