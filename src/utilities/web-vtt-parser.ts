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
    if (this.line == null) return 100;
    return Number(
      this.line.endsWith("%")
        ? this.line.substring(0, this.line.length - 1)
        : this.line,
    );
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

        case "&":
          currentText.text += "&amp;";
          continue;
      }

      currentText.text += char;
    }

    const result = textBlocks.filter(t => t.text.length > 0);
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
    s = s.replaceAll("\r\n", "\n");

    const lines: SubLine[] = [];
    const rawLines = s.split("\n");

    let i = 0;

    // Skip WEBVTT header
    if (rawLines[i]?.startsWith("WEBVTT")) {
      i++;
      while (rawLines[i]?.trim() !== "") i++;
      i++;
    }

    while (i < rawLines.length) {
      let line = rawLines[i]?.trim();

      if (!line) {
        i++;
        continue;
      }

      const sub = SubLine.new();

      // Detect cue identifier (optional)
      if (!line.includes("-->")) {
        sub.lineNumber = line;
        i++;
        line = rawLines[i]?.trim();
      }

      if (!line) {
        this.error(`Invalid VTT cue (line ${i})`);
      }

      if (!line.includes("-->")) {
        const prevLine = lines.at(-1);
        if (prevLine) {
          prevLine.content += "\n" + line;
          continue;
        }
        this.error(`Invalid VTT cue (line ${i})`);
      }

      // Parse timing + settings
      const [startPart, rest] = line.split("-->");
      const [endPart, ...settingsParts] = rest!.trim().split(/\s+/);

      parseTimestamp(startPart!.trim(), sub.start);
      parseTimestamp(endPart!.trim(), sub.end);

      // Parse settings
      for (const setting of settingsParts) {
        const [key, value] = setting.split(":");
        if (
          key && value
          && (key === "line" || key === "align" || key === "position"
            || key === "size")
        ) {
          sub.settings[key] = value as any;
        }
      }

      i++;

      // Parse content
      while (i < rawLines.length && rawLines[i]!.trim() !== "") {
        sub.content += rawLines[i]! + "\n";
        i++;
      }

      sub.content = sub.content.trim();
      lines.push(sub);

      i++;
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
