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

const STYLED_SAMPLE = `WEBVTT

STYLE
::cue {
  background-image: linear-gradient(to bottom, dimgray, lightgray);
  color: papayawhip;
}

NOTE comment blocks can be used between style blocks.

STYLE
::cue(b) {
  color: peachpuff;
}

1
00:00:01.000 --> 00:00:03.000
<v   Alice  >Hello<BR />world</v>
`;

const BOM_SAMPLE = `\uFEFFWEBVTT

1
00:00:01.000 --> 00:00:02.000
Hello
`;

const STYLE_WITH_EMPTY_LINES_SAMPLE = `WEBVTT

STYLE

::cue {
  color: lime;

  font-family: Arial;

}

::cue(.important) {
  font-weight: bold;
}

1
00:00:01.000 --> 00:00:02.000
Hello
`;

const REGION_SAMPLE = `WEBVTT

REGION
id:fred
width:40%
lines:3
regionanchor:0%,100%
viewportanchor:10%,90%

1
00:00:01.000 --> 00:00:02.000
Hello
`;

const NOTE_WITH_BLANK_LINES_SAMPLE = `WEBVTT

NOTE
this is a note

with blank lines

and more text

1
00:00:01.000 --> 00:00:02.000
Hello
`;

const BLANK_LINES_ON_CUES_SAMPLE = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Hello
2
00:00:03.000 --> 00:00:04.000
World
`;

const MALFORMED_CUE_SAMPLE = `WEBVTT

1
00:00:01.000 --> 00:00:02.000 line: align position:50% size:
Hello
`;

const TS_WITHOUT_HOUR_SAMPLE = `WEBVTT

1
00:01.500 --> 00:05.000
Hello
`;

const ESCAPE_SEQ_SAMPLE = `WEBVTT

1
00:01.500 --> 00:05.000
&lt;b&gt;Hello &amp; goodbye&lt;/b&gt;
`;

const TAGS_WITH_CLASSES_SAMPLE = `WEBVTT

1
00:01.500 --> 00:05.000
<b.foo><u.bar.baz>Hello<b/></u>
`;

const VALUE_TAGS_WITH_CLASSES_SAMPLE = `WEBVTT

1
00:01.500 --> 00:05.000
<v.cl1.cl2 Tom>Howdy</v>
<lang.langline pl-PL>Co tam robisz?</lang>
`;

const NESTES_CLASSES_SAMPLE = `WEBVTT

1
00:01.500 --> 00:05.000
<v.cl1 Tom>Normal, <b.bldcls>bold</b> <c.foobar><i.italic><lang.lnpl pl-PL>italic polish</lang></i> no italic,</c> back to normal</v>
`;

const STYLE_WITH_NOTES_IN_BETWEEN_SAMPLE = `WEBVTT

NOTE lorem ipsum
dolor sit amet
STYLE
::cue {
  color: lime;
}

NOTE this
is a
multiline note

STYLE
::cue(.important) {
  font-weight: bold;
}

REGION
width: 50%

STYLE
::cue(b) {
  font-weight: 900;
}

NOTE lorem ipsum
dolor sit amet
1
00:00:01.000 --> 00:00:02.000
Hello
`;

describe("VTTParser", () => {
  it("parses simple vtt subtitles", () => {
    const { lines: subLines } = VTTParser.parse(SAMPLE_SIMPLE);

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
    const { lines: subLines } = VTTParser.parse(SAMPLE_CUE_SETTINGS);

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
    const { lines: subLines } = VTTParser.parse(SAMPLE_TAGS);

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
    const { lines: subLines } = VTTParser.parse(SAMPLE_BR);

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
    const { lines: subLines } = VTTParser.parse(SAMPLE_WEIRD_TAGS);

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
    const { lines: subLines } = VTTParser.parse(NORMALIZATION_VOICE_SAMPLE);

    expect(subLines[0].parseContent()).toEqual([
      {
        speaker: "Alice",
        text: "Hello\nworld",
        tags: new Set(),
      },
    ]);
  });

  it("still works when vtt file contains styles and notes", () => {
    const { lines: subLines, styles } = VTTParser.parse(STYLED_SAMPLE);

    expect(subLines[0].parseContent()).toEqual([
      {
        speaker: "Alice",
        text: "Hello\nworld",
        tags: new Set(),
      },
    ]);

    expect(styles).toEqual([
      expect.objectContaining({
        content: [
          "::cue {",
          "  background-image: linear-gradient(to bottom, dimgray, lightgray);",
          "  color: papayawhip;",
          "}",
        ],
      }),
      expect.objectContaining({
        content: [
          "::cue(b) {",
          "  color: peachpuff;",
          "}",
        ],
      }),
    ]);
  });

  it("handles BOM before WEBVTT", () => {
    const input = BOM_SAMPLE;

    const { lines: subLines } = VTTParser.parse(input);

    expect(subLines).toHaveLength(1);

    expect(subLines[0]).toEqual({
      lineNumber: "1",
      settings: {},
      content: "Hello",
      start: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "01",
        millisecond: "000",
      }),
      end: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "02",
        millisecond: "000",
      }),
    });
  });

  it("ignores STYLE blocks with internal blank lines", () => {
    const input = STYLE_WITH_EMPTY_LINES_SAMPLE;

    const { lines: subLines, styles } = VTTParser.parse(input);

    expect(subLines).toHaveLength(1);
    expect(subLines[0]!.content).toBe("Hello");

    expect(styles).toEqual([
      expect.objectContaining({
        content: [
          "::cue {",
          "  color: lime;",
          "  font-family: Arial;",
          "}",
        ],
      }),
      expect.objectContaining({
        content: [
          "::cue(.important) {",
          "  font-weight: bold;",
          "}",
        ],
      }),
    ]);
  });

  it("ignores REGION blocks", () => {
    const input = REGION_SAMPLE;

    const { lines: subLines } = VTTParser.parse(input);

    expect(subLines).toHaveLength(1);
    expect(subLines[0]!.content).toBe("Hello");
  });

  it("ignores NOTE blocks with blank lines", () => {
    const input = NOTE_WITH_BLANK_LINES_SAMPLE;

    const { lines: subLines } = VTTParser.parse(input);

    expect(subLines).toHaveLength(1);
    expect(subLines[0]!.content).toBe("Hello");
  });

  it("handles missing blank lines between cues", () => {
    const input = BLANK_LINES_ON_CUES_SAMPLE;

    const { lines: subLines } = VTTParser.parse(input);

    expect(subLines).toHaveLength(2);

    expect(subLines[0]).toEqual({
      lineNumber: "1",
      settings: {},
      content: "Hello",
      start: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "01",
        millisecond: "000",
      }),
      end: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "02",
        millisecond: "000",
      }),
    });

    expect(subLines[1]).toEqual({
      lineNumber: "2",
      settings: {},
      content: "World",
      start: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "03",
        millisecond: "000",
      }),
      end: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "04",
        millisecond: "000",
      }),
    });
  });

  it("ignores malformed cue settings without values", () => {
    const input = MALFORMED_CUE_SAMPLE;

    const { lines: subLines } = VTTParser.parse(input);

    expect(subLines).toHaveLength(1);

    expect(subLines[0]).toEqual({
      lineNumber: "1",
      settings: {
        position: "50%",
      },
      content: "Hello",
      start: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "01",
        millisecond: "000",
      }),
      end: Timestamp.new({
        hour: "00",
        minute: "00",
        second: "02",
        millisecond: "000",
      }),
    });
  });

  it("supports timestamps without hours", () => {
    const input = TS_WITHOUT_HOUR_SAMPLE;

    const { lines: subLines } = VTTParser.parse(input);

    expect(subLines).toHaveLength(1);

    expect(subLines[0]).toEqual({
      lineNumber: "1",
      settings: {},
      content: "Hello",
      start: Timestamp.new({
        hour: "0",
        minute: "00",
        second: "01",
        millisecond: "500",
      }),
      end: Timestamp.new({
        hour: "0",
        minute: "00",
        second: "05",
        millisecond: "000",
      }),
    });
  });

  it("handles escape sequences", () => {
    const input = ESCAPE_SEQ_SAMPLE;

    const { lines: subLines } = VTTParser.parse(input);

    expect(subLines).toHaveLength(1);

    expect(subLines[0]).toEqual({
      lineNumber: "1",
      settings: {},
      content: "&lt;b&gt;Hello &amp; goodbye&lt;/b&gt;",
      start: Timestamp.new({
        hour: "0",
        minute: "00",
        second: "01",
        millisecond: "500",
      }),
      end: Timestamp.new({
        hour: "0",
        minute: "00",
        second: "05",
        millisecond: "000",
      }),
    });

    expect(subLines[0].parseContent()).toEqual([
      expect.objectContaining({ text: "<b>Hello & goodbye</b>" }),
    ]);
  });

  it("tags with classes", () => {
    const { lines } = VTTParser.parse(TAGS_WITH_CLASSES_SAMPLE);

    expect(lines).toHaveLength(1);

    expect(lines[0].parseContent()).toEqual([
      expect.objectContaining({
        text: "Hello",
        tags: new Set([
          "u1",
          "b1",
          "c:foo",
          "c:bar",
          "c:baz",
        ]),
      }),
    ]);
  });

  it("tags with values and classes", () => {
    const { lines } = VTTParser.parse(VALUE_TAGS_WITH_CLASSES_SAMPLE);

    expect(lines).toHaveLength(1);

    expect(lines[0].parseContent()).toEqual([
      expect.objectContaining({
        text: "Howdy",
        speaker: "Tom",
        language: undefined,
        tags: new Set([
          "c:cl1",
          "c:cl2",
        ]),
      }),
      expect.objectContaining({
        text: "\n",
        speaker: undefined,
        language: undefined,
        tags: new Set(),
      }),
      expect.objectContaining({
        text: "Co tam robisz?",
        speaker: undefined,
        language: "pl-PL",
        tags: new Set([
          "c:langline",
        ]),
      }),
    ]);
  });

  it("tags with nested classes", () => {
    const { lines } = VTTParser.parse(NESTES_CLASSES_SAMPLE);

    expect(lines).toHaveLength(1);

    console.log(lines[0].parseContent());
    expect(lines[0].parseContent()).toEqual([
      expect.objectContaining({
        speaker: "Tom",
        text: "Normal, ",
        language: undefined,
        tags: new Set([
          "c:cl1",
        ]),
      }),
      expect.objectContaining({
        text: "bold",
        speaker: "Tom",
        language: undefined,
        tags: new Set([
          "c:cl1",
          "c:bldcls",
          "b1",
        ]),
      }),
      expect.objectContaining({
        text: " ",
        speaker: "Tom",
        language: undefined,
        tags: new Set([
          "c:cl1",
        ]),
      }),
      expect.objectContaining({
        text: "italic polish",
        speaker: "Tom",
        language: "pl-PL",
        tags: new Set([
          "c:cl1",
          "c:foobar",
          "c:italic",
          "c:lnpl",
          "i1",
        ]),
      }),
      expect.objectContaining({
        text: " no italic,",
        speaker: "Tom",
        language: undefined,
        tags: new Set([
          "c:cl1",
          "c:foobar",
        ]),
      }),
      expect.objectContaining({
        text: " back to normal",
        speaker: "Tom",
        language: undefined,
        tags: new Set([
          "c:cl1",
        ]),
      }),
    ]);
  });

  it("styles with notes and regions in-between", () => {
    const { lines, styles } = VTTParser.parse(
      STYLE_WITH_NOTES_IN_BETWEEN_SAMPLE,
    );

    expect(styles.length).toBe(3);
    expect(styles).toEqual([
      expect.objectContaining({
        content: [
          "::cue {",
          "  color: lime;",
          "}",
        ],
      }),
      expect.objectContaining({
        content: [
          "::cue(.important) {",
          "  font-weight: bold;",
          "}",
        ],
      }),
      expect.objectContaining({
        content: [
          "::cue(b) {",
          "  font-weight: 900;",
          "}",
        ],
      }),
    ]);

    expect(lines.length).toBe(1);
    expect(lines[0].parseContent()).toEqual([
      expect.objectContaining({
        text: "Hello",
      }),
    ]);
  });
});
