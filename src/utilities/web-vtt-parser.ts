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
  language?: string;

  constructor(public tags: Set<string> = new Set()) {}

  setSpeaker(speaker: string) {
    this.speaker = speaker;
  }

  removeSpeaker() {
    this.speaker = undefined;
  }

  setLanguage(lang: string) {
    this.language = lang;
  }

  removeLanguage() {
    this.language = undefined;
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

  addClasses(cls: string[]) {
    for (let i = 0; i < cls.length; i++) {
      this.tags.add(`c:${cls[i]}`);
    }
  }

  removeClasses(cls: string[]) {
    for (let i = 0; i < cls.length; i++) {
      this.tags.delete(`c:${cls[i]}`);
    }
  }

  addTag(
    tag:
      | "b1"
      | "b0"
      | "i1"
      | "i0"
      | "u1"
      | "u0"
      | "rt1"
      | "rt0"
      | "ruby1"
      | "ruby0",
  ) {
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
    n.language = this.language;
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

  private isTag(
    tagType: "b" | "u" | "i" | "v" | "c" | "rt" | "ruby" | "lang",
    value: string,
  ): boolean {
    switch (tagType) {
      case "b":
        return value === "b" || value.startsWith("b.");
      case "u":
        return value === "u" || value.startsWith("u.");
      case "i":
        return value === "i" || value.startsWith("i.");
      case "v":
        return value === "v" || value.startsWith("v.")
          || value.startsWith("v ");
      case "c":
        return value === "c" || value.startsWith("c.");
      case "ruby":
        return value === "ruby" || value.startsWith("ruby.");
      case "rt":
        return value === "rt" || value.startsWith("rt.");
      case "lang":
        return value === "lang" || value.startsWith("lang.")
          || value.startsWith("lang ");
    }
    return false;
  }

  private parseTagClasses(tag: string): string[] {
    const classes: string[] = [];

    let char: string;
    for (let i = 0; i < tag.length; i++) {
      char = tag[i]!;

      if (char === ".") {
        classes.push("");
      } else if (char === " " && classes.length > 0) {
        return classes;
      } else if (classes.length > 0) {
        classes[classes.length - 1] += char;
      }
    }

    return classes;
  }

  private parseTagValue(tag: string): string {
    let tagName = "";
    let tagNameComplete = false;

    let char: string;
    for (let i = 0; i < tag.length; i++) {
      char = tag[i]!;

      if (!tagNameComplete) {
        if (char === " " && tagName.length > 0) {
          tagNameComplete = true;
          continue;
        }
        tagName += char;
      } else {
        return tag.slice(i).trim();
      }
    }

    return "";
  }

  parseContent() {
    if (this.parsedMemo != null) {
      return this.parsedMemo;
    }

    let currentText = new TextBlock();
    const textBlocks: TextBlock[] = [currentText];

    let isInTag = false;
    let tagBuffer = "";
    const classStack = {
      b: [] as Array<string[]>,
      u: [] as Array<string[]>,
      i: [] as Array<string[]>,
      v: [] as Array<string[]>,
      c: [] as Array<string[]>,
      rt: [] as Array<string[]>,
      ruby: [] as Array<string[]>,
      lang: [] as Array<string[]>,
    };

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

          // ---- BOLD ----
          if (this.isTag("b", normalizedTag)) {
            if (isClosing) {
              nextBlock.addTag("b0");
              nextBlock.removeClasses(classStack.b.pop() ?? []);
            } else {
              const cls = this.parseTagClasses(tagName);
              nextBlock.addClasses(cls);
              nextBlock.addTag("b1");
              classStack.b.push(cls);
            }
          } // ---- ITALIC ----
          else if (this.isTag("i", normalizedTag)) {
            if (isClosing) {
              nextBlock.addTag("i0");
              nextBlock.removeClasses(classStack.i.pop() ?? []);
            } else {
              const cls = this.parseTagClasses(tagName);
              nextBlock.addClasses(cls);
              nextBlock.addTag("i1");
              classStack.i.push(cls);
            }
          } // ---- UNDERLINE ----
          else if (this.isTag("u", normalizedTag)) {
            if (isClosing) {
              nextBlock.addTag("u0");
              nextBlock.removeClasses(classStack.u.pop() ?? []);
            } else {
              const cls = this.parseTagClasses(tagName);
              nextBlock.addClasses(cls);
              nextBlock.addTag("u1");
              classStack.u.push(cls);
            }
          } // ---- RUBY TEXT ----
          else if (this.isTag("rt", normalizedTag)) {
            if (isClosing) {
              nextBlock.addTag("rt0");
              nextBlock.removeClasses(classStack.rt.pop() ?? []);
            } else {
              const cls = this.parseTagClasses(tagName);
              nextBlock.addClasses(cls);
              nextBlock.addTag("rt1");
              classStack.rt.push(cls);
            }
          } // ---- RUBY ----
          else if (this.isTag("ruby", normalizedTag)) {
            if (isClosing) {
              nextBlock.addTag("ruby0");
              nextBlock.removeClasses(classStack.ruby.pop() ?? []);
            } else {
              const cls = this.parseTagClasses(tagName);
              nextBlock.addClasses(cls);
              nextBlock.addTag("ruby1");
              classStack.ruby.push(cls);
            }
          } // ---- VOICE TAG ----
          if (this.isTag("v", normalizedTag)) {
            if (isClosing) {
              nextBlock.removeSpeaker();
              nextBlock.removeClasses(classStack.v.pop() ?? []);
            } else {
              const speaker = this.parseTagValue(tagName);
              const cls = this.parseTagClasses(tagName);
              nextBlock.setSpeaker(speaker);
              nextBlock.addClasses(cls);
              classStack.v.push(cls);
            }
          } // ---- LANG ----
          else if (this.isTag("lang", normalizedTag)) {
            if (isClosing) {
              nextBlock.removeLanguage();
              nextBlock.removeClasses(classStack.lang.pop() ?? []);
            } else {
              const language = this.parseTagValue(tagName);
              const cls = this.parseTagClasses(tagName);
              nextBlock.setLanguage(language);
              nextBlock.addClasses(cls);
              classStack.lang.push(cls);
            }
          } // ---- class tags <c.foo> ----
          else if (this.isTag("c", normalizedTag)) {
            if (isClosing) {
              nextBlock.removeClasses(classStack.c.pop() ?? []);
            } else {
              const cls = this.parseTagClasses(tagName);
              nextBlock.addClasses(cls);
              classStack.c.push(cls);
            }
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
          if (this.content[i + 1] === "\\") {
            let currentTag = "";
            i += 2;

            while (i < this.content.length && this.content[i] !== "}") {
              if (this.content[i] === "\\") {
                if (currentTag) currentText.tags.add(currentTag);
                currentTag = "";
              } else {
                currentTag += this.content[i];
              }
              i++;
            }

            if (currentTag) currentText.tags.add(currentTag);
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

export type CueSelectors = {
  cue: string;
  bold: string;
  italic: string;
  underline: string;
};

export class SubStyle extends Struct {
  content: string[] = [];

  addline(l: string) {
    if (l.trim().length !== 0) {
      this.content.push(l);
    }
  }

  isComplete() {
    if (this.content.length === 0) {
      return false;
    }

    for (let i = this.content.length - 1; i >= 0; i--) {
      const line = this.content[i]!;
      for (let j = line.length - 1; j >= 0; j--) {
        const char = line[j];
        if (char === "}") return true;
        if (char === " ") continue;
        return false;
      }
    }

    return false;
  }

  private toHtmlStylesResult?: string;
  toHtmlStyles(selectors: CueSelectors) {
    if (this.toHtmlStylesResult != null) {
      return this.toHtmlStylesResult;
    }

    const concated = this.content.join("\n");
    let result: string;

    if (concated.includes("::cue(")) {
      result = concated.replaceAll(/::cue\((.+?)\)/g, (_, selector) => {
        const transformedSelector = selector
          .replace(/^\s*b\s*$|^\s*b(\s*\.)/, selectors.bold + "$1")
          .replace(/^\s*i\s*$|^\s*i(\s*\.)/, selectors.italic + "$1")
          .replace(/^\s*u\s*$|^\s*u(\s*\.)/, selectors.underline + "$1");
        return `${selectors.cue} ${transformedSelector}`;
      });
    } else {
      result = concated;
    }

    result = result.replaceAll("::cue", selectors.cue);

    this.toHtmlStylesResult = result;
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
    const styleLines: SubStyle[] = [];

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

      // ---- HANDLE STYLE / NOTE / REGION BLOCKS ----
      if (
        line === "STYLE"
        || line.startsWith("REGION")
        || line.startsWith("NOTE")
      ) {
        outer: while (i < rawLines.length) {
          let next = rawLines[i]!;

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

          let trimmedNext = next.trimStart();

          if (
            trimmedNext.startsWith("NOTE")
            || trimmedNext.startsWith("REGION")
          ) {
            while (i < rawLines.length) {
              next = rawLines[i]!;

              if (isTimestampLine(next)) {
                break outer;
              }

              if (
                next.trim() !== ""
                && isTimestampLine(rawLines[i + 1])
              ) {
                break outer;
              }

              if (next.startsWith("STYLE") || next.startsWith("::cue")) {
                trimmedNext = next.trimStart();
                break;
              }

              i++;
            }
          }

          if (trimmedNext.startsWith("STYLE")) {
            const lastStyle = styleLines.at(-1);
            if (!lastStyle || lastStyle.isComplete()) {
              styleLines.push(SubStyle.new());
            }
            i++;
            continue;
          }

          if (trimmedNext.startsWith("::cue")) {
            const lastStyle = styleLines.at(-1);
            if (!lastStyle || lastStyle.isComplete()) {
              styleLines.push(SubStyle.new());
            }
          }

          if (styleLines.length === 0) {
            styleLines.push(SubStyle.new());
          }

          styleLines.at(-1)!.addline(next);

          i++;
        }
        i++;

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

    return { lines, styles: styleLines };
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
