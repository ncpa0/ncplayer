type PropertiesOf<O> = {
  [K in keyof O as O[K] extends Function ? never : K]?: O[K];
};

export abstract class Struct {
  static new<T extends new() => any>(
    this: T,
    initialValues: PropertiesOf<InstanceType<T>> = {},
  ): InstanceType<T> {
    const instance = new this();
    Object.assign(instance, initialValues);
    return instance;
  }
}

export class TextBlock {
  text = "";
  speaker?: string;

  constructor(public tags: Set<string> = new Set()) {}

  setSpeaker(speaker: string) {
    this.speaker = speaker;
  }

  removeSpeaker() {
    this.speaker = undefined;
  }

  isBold() {
    return this.tags.has("b1");
  }

  isItalic() {
    return this.tags.has("i1");
  }

  isUnderline() {
    return this.tags.has("u1");
  }

  addTag(tag: string) {
    switch (tag) {
      case "b1":
        this.tags.delete("b0");
        this.tags.add("b1");
        break;
      case "b0":
        this.tags.delete("b1");
        break;
      case "i1":
        this.tags.delete("i0");
        this.tags.add("i1");
        break;
      case "i0":
        this.tags.delete("i1");
        break;
      case "u1":
        this.tags.delete("u0");
        this.tags.add("u1");
        break;
      case "u0":
        this.tags.delete("u1");
        break;
      case "an1":
      case "an2":
      case "an3":
      case "an4":
      case "an5":
      case "an6":
      case "an7":
      case "an8":
      case "an9":
        this.tags.delete("an1");
        this.tags.delete("an2");
        this.tags.delete("an3");
        this.tags.delete("an4");
        this.tags.delete("an5");
        this.tags.delete("an6");
        this.tags.delete("an7");
        this.tags.delete("an8");
        this.tags.delete("an9");
        this.tags.add(tag);
        break;
      default:
        this.tags.add(tag);
        break;
    }
  }

  private cls?: string;
  getClass() {
    if (this.cls != null) {
      return this.cls;
    }

    let classes: string[] = [];
    for (const t of this.tags) {
      if (t.startsWith("c:")) {
        classes.push(t.substring(2));
      }
    }
    return this.cls = classes.join(" ");
  }

  next() {
    const n = new TextBlock(new Set(this.tags));
    n.speaker = this.speaker;
    return n;
  }
}

export class Timestamp extends Struct {
  hour = "";
  minute = "";
  second = "";
  millisecond = "";

  private totalMs?: number;
  getTs(): number {
    if (this.totalMs != null) {
      return this.totalMs;
    }

    this.totalMs = (Number(this.hour) * 60 * 60 * 1000)
      + (Number(this.minute) * 60 * 1000)
      + (Number(this.second) * 1000)
      + (Number(this.millisecond));

    return this.totalMs;
  }
}

export class LineSettings extends Struct {
  line?: `${number}%` | `${number}`;
  align?: "start" | "end" | "center";
  size?: `${number}%`;
  position?: `${number}%`;

  verticalPos() {
    if (this.line == null) return "100";
    if (this.line.endsWith("%")) {
      return this.line.substring(0, this.line.length - 1);
    }
    if (this.line === "0") {
      return "0";
    }
    return "100";
  }

  horizontalPos() {
    if (this.position == null) return 50;
    return Number(
      this.position.endsWith("%")
        ? this.position.substring(0, this.position.length - 1)
        : this.position,
    );
  }

  alignment() {
    return this.align ?? "center";
  }

  getWidth() {
    return this.size ?? "100%";
  }
}

export class SubLine extends Struct {
  lineNumber = ""; // optional cue id
  start = Timestamp.new();
  end = Timestamp.new();
  content = "";
  settings = LineSettings.new();

  private parsedMemo?: TextBlock[];

  parseContent() {
    if (this.parsedMemo != null) {
      return this.parsedMemo;
    }

    let currentText = new TextBlock();
    const textBlocks: TextBlock[] = [currentText];

    let isInTag = false;
    let tagBuffer = "";

    for (let i = 0; i < this.content.length; i++) {
      const char = this.content[i];

      // -------- TAG PARSING --------
      if (isInTag) {
        if (char === ">") {
          isInTag = false;

          const raw = tagBuffer.trim();
          tagBuffer = "";

          const isClosing = raw.startsWith("/");
          const tagName = isClosing ? raw.slice(1) : raw;

          // normalize (handle <br>, <br/>, <br />)
          const normalizedTag = tagName
            .replace(/\s+/g, " ")
            .replace(/\/$/, "")
            .trim()
            .toLowerCase();

          // ---- LINE BREAK ----
          if (!isClosing && normalizedTag === "br") {
            currentText.text += "\n";
            continue;
          }

          const nextBlock = currentText.next();

          // ---- VOICE TAG ----
          if (!isClosing && normalizedTag.startsWith("v ")) {
            const speaker = tagName.slice(2).trim();
            nextBlock.setSpeaker(speaker);
          } else if (isClosing && normalizedTag === "v") {
            [...nextBlock.tags]
              .filter(t => t.startsWith("v:"))
              .forEach(t => nextBlock.removeSpeaker());
          } // ---- BOLD ----
          else if (normalizedTag === "b") {
            nextBlock.addTag(isClosing ? "b0" : "b1");
          } // ---- ITALIC ----
          else if (normalizedTag === "i") {
            nextBlock.addTag(isClosing ? "i0" : "i1");
          } // ---- UNDERLINE ----
          else if (normalizedTag === "u") {
            nextBlock.addTag(isClosing ? "u0" : "u1");
          } // ---- OPTIONAL: class tags <c.foo> ----
          else if (!isClosing && normalizedTag.startsWith("c.")) {
            nextBlock.addTag(`c:${tagName.slice(2)}`);
          } else if (isClosing && normalizedTag === "c") {
            [...nextBlock.tags]
              .filter(t => t.startsWith("c:"))
              .forEach(t => nextBlock.tags.delete(t));
          }

          currentText = nextBlock;
          textBlocks.push(currentText);
          continue;
        }

        tagBuffer += char;
        continue;
      }

      // -------- NORMAL FLOW --------
      switch (char) {
        case "<":
          isInTag = true;
          continue;

        case "{":
          // keep your existing SRT tag support
          if (this.content[i + 1] === "\\") {
            let currentTag = "";
            i += 2;

            while (i < this.content.length && this.content[i] !== "}") {
              if (this.content[i] === "\\") {
                if (currentTag) currentText.addTag(currentTag);
                currentTag = "";
              } else {
                currentTag += this.content[i];
              }
              i++;
            }

            if (currentTag) currentText.addTag(currentTag);
            continue;
          }
          break;
      }

      currentText.text += char;
    }

    const result = textBlocks.filter(t => t.text.length > 0);
    result.forEach(t => {
      t.text = t.text
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&nbsp;", " ")
        .replaceAll("&lrm;", "")
        .replaceAll("&rlm;", "");
    });
    this.parsedMemo = result;
    return result;
  }
}

export function isEol(char: string): boolean {
  return char === "\n" || char === "\r";
}

export function isCharCodeInRange(
  char: string,
  min: number,
  max: number,
): boolean {
  const charCode = char.charCodeAt(0);
  return charCode >= min && charCode <= max;
}

export class VTTParser {
  private static error(msg: string): never {
    throw new Error(`VTTParser: ${msg}`);
  }
  static parse(s: string) {
    // ---- NORMALIZE ----
    s = s.replace(/^\uFEFF/, ""); // BOM
    s = s.replaceAll("\r\n", "\n");

    const lines: SubLine[] = [];
    const rawLines = s.split("\n");

    let i = 0;

    const TIMESTAMP_RE =
      /^\s*(\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(\d{2}:)?\d{2}:\d{2}\.\d{3}/;

    const isTimestampLine = (line?: string) =>
      !!line && TIMESTAMP_RE.test(line);

    // ---- SKIP WEBVTT HEADER ----
    if (rawLines[i]?.replace(/^\uFEFF/, "").startsWith("WEBVTT")) {
      i++;

      // skip header metadata
      while (
        i < rawLines.length
        && rawLines[i]!.trim() !== ""
      ) {
        i++;
      }

      while (
        i < rawLines.length
        && rawLines[i]!.trim() === ""
      ) {
        i++;
      }
    }

    while (i < rawLines.length) {
      let line = rawLines[i]?.trim();

      // ---- SKIP EMPTY ----
      if (!line) {
        i++;
        continue;
      }

      // ---- SKIP STYLE / NOTE / REGION BLOCKS ----
      if (
        line === "STYLE"
        || line === "REGION"
        || line.startsWith("NOTE")
      ) {
        i++;

        while (i < rawLines.length) {
          const next = rawLines[i]!;

          // stop if next cue begins
          if (isTimestampLine(next)) {
            break;
          }

          // stop if cue-id followed by timestamp
          if (
            next.trim() !== ""
            && isTimestampLine(rawLines[i + 1])
          ) {
            break;
          }

          i++;
        }

        continue;
      }

      const sub = SubLine.new();

      // ---- OPTIONAL CUE IDENTIFIER ----
      if (!isTimestampLine(line)) {
        sub.lineNumber = line;
        i++;
        line = rawLines[i]?.trim();
      }

      if (!line || !isTimestampLine(line)) {
        this.error(`Invalid VTT cue (line ${i})`);
      }

      // ---- PARSE TIMINGS ----
      const [startPart, rest] = line.split("-->");

      if (!rest) {
        this.error(`Invalid VTT timing separator (line ${i})`);
      }

      const timingParts = rest.trim().split(/\s+/);

      const endPart = timingParts.shift();

      if (!endPart) {
        this.error(`Invalid VTT end timestamp (line ${i})`);
      }

      parseTimestamp(startPart!.trim(), sub.start);
      parseTimestamp(endPart.trim(), sub.end);

      // ---- PARSE SETTINGS ----
      for (const setting of timingParts) {
        const colonIdx = setting.indexOf(":");

        // malformed setting
        if (colonIdx <= 0) {
          continue;
        }

        const key = setting.slice(0, colonIdx);
        const value = setting.slice(colonIdx + 1);

        // missing value
        if (!value) {
          continue;
        }

        if (
          key === "line"
          || key === "align"
          || key === "position"
          || key === "size"
        ) {
          sub.settings[key] = value as any;
        }
      }

      i++;

      // ---- PARSE CONTENT ----
      while (i < rawLines.length) {
        const contentLine = rawLines[i]!;

        // explicit cue separator
        if (contentLine.trim() === "") {
          i++;
          break;
        }

        // implicit cue separator (missing blank line)
        if (isTimestampLine(contentLine)) {
          break;
        }

        // cue-id followed by timestamp
        if (
          contentLine.trim() !== ""
          && isTimestampLine(rawLines[i + 1])
        ) {
          break;
        }

        sub.content += contentLine + "\n";
        i++;
      }

      sub.content = sub.content.trimEnd();
      lines.push(sub);
    }

    return lines;
  }
}

function parseTimestamp(input: string, ts: Timestamp) {
  // Supports: HH:MM:SS.mmm OR MM:SS.mmm
  const parts = input.split(":");

  if (parts.length === 3) {
    ts.hour = parts[0]!;
    ts.minute = parts[1]!;
    const [sec, ms] = parts[2]!.split(".");
    ts.second = sec!;
    ts.millisecond = ms || "0";
  } else if (parts.length === 2) {
    ts.hour = "0";
    ts.minute = parts[0]!;
    const [sec, ms] = parts[1]!.split(".");
    ts.second = sec!;
    ts.millisecond = ms || "0";
  } else {
    throw new Error("Invalid VTT timestamp");
  }
}
