import { sig } from "@ncpa0cpl/vanilla-jsx";
import { NCPlayer, SubtitleTrack, VideoSource } from "./player.component";

class NCPlayerWebComponent extends HTMLElement {
  static get observedAttributes() {
    return [
      "autoplay",
      "controls-timeout",
      "height",
      "loop",
      "muted",
      "persistent-volume",
      "poster",
      "preload",
      "preview",
      "preview-height",
      "preview-update-throttle",
      "preview-width",
      "sources",
      "styles",
      "subtitles",
      "swipe-control-range",
      "width",
    ] as const;
  }

  private __signals = {
    autoplay: sig<boolean | undefined>(undefined),
    controlsTimeout: sig<number | undefined>(undefined),
    height: sig<number | undefined>(undefined),
    loop: sig<boolean | undefined>(undefined),
    muted: sig<boolean | undefined>(undefined),
    persistentVolume: sig<boolean | undefined>(undefined),
    poster: sig<string | undefined>(undefined),
    preload: sig<HTMLMediaElement["preload"] | undefined>(undefined),
    preview: sig<string | undefined>(undefined),
    previewHeight: sig<number | undefined>(undefined),
    previewUpdateThrottle: sig<number | undefined>(undefined),
    previewWidth: sig<number | undefined>(undefined),
    styles: sig<string | boolean | undefined>(undefined),
    swipeControlRange: sig<number | undefined>(undefined),
    width: sig<number | undefined>(undefined),
    sources: sig<string | VideoSource[] | undefined>(undefined),
    subtitles: sig<SubtitleTrack[] | undefined>(undefined),
  };

  get autoplay() {
    return this.__signals.autoplay.current();
  }
  set autoplay(value: boolean | undefined) {
    this.validateBoolean("autoplay", value);
    this.__signals.autoplay.dispatch(value);
  }

  get controlsTimeout() {
    return this.__signals.controlsTimeout.current();
  }
  set controlsTimeout(value: number | undefined) {
    this.validateNumber("controls-timeout", value);
    this.__signals.controlsTimeout.dispatch(value);
  }

  get height() {
    return this.__signals.height.current();
  }
  set height(value: number | undefined) {
    this.validateNumber("height", value);
    this.__signals.height.dispatch(value);
  }

  get loop() {
    return this.__signals.loop.current();
  }
  set loop(value: boolean | undefined) {
    this.validateBoolean("loop", value);
    this.__signals.loop.dispatch(value);
  }

  get muted() {
    return this.__signals.muted.current();
  }
  set muted(value: boolean | undefined) {
    this.validateBoolean("muted", value);
    this.__signals.muted.dispatch(value);
  }

  get persistentVolume() {
    return this.__signals.persistentVolume.current();
  }
  set persistentVolume(value: boolean | undefined) {
    this.validateBoolean("persistent-volume", value);
    this.__signals.persistentVolume.dispatch(value);
  }

  get poster() {
    return this.__signals.poster.current();
  }
  set poster(value: string | undefined) {
    this.validateString("poster", value);
    this.__signals.poster.dispatch(value);
  }

  get preload() {
    return this.__signals.preload.current();
  }
  set preload(value: HTMLMediaElement["preload"] | undefined) {
    this.validateString("preload", value);
    this.__signals.preload.dispatch(value);
  }

  get preview() {
    return this.__signals.preview.current();
  }
  set preview(value: string | undefined) {
    this.validateString("preview", value);
    this.__signals.preview.dispatch(value);
  }

  get previewHeight() {
    return this.__signals.previewHeight.current();
  }
  set previewHeight(value: number | undefined) {
    this.validateNumber("preview-height", value);
    this.__signals.previewHeight.dispatch(value);
  }

  get previewUpdateThrottle() {
    return this.__signals.previewUpdateThrottle.current();
  }
  set previewUpdateThrottle(value: number | undefined) {
    this.validateNumber("preview-update-throttle", value);
    this.__signals.previewUpdateThrottle.dispatch(value);
  }

  get previewWidth() {
    return this.__signals.previewWidth.current();
  }
  set previewWidth(value: number | undefined) {
    this.validateNumber("preview-width", value);
    this.__signals.previewWidth.dispatch(value);
  }

  get styles() {
    return this.__signals.styles.current();
  }
  set styles(value: string | boolean | undefined) {
    if (typeof value !== "string" && typeof value !== "boolean") {
      throw new Error(
        `Attribute "styles" must be either a string or a boolean`,
      );
    }
    this.__signals.styles.dispatch(value);
  }

  get swipeControlRange() {
    return this.__signals.swipeControlRange.current();
  }
  set swipeControlRange(value: number | undefined) {
    this.validateNumber("swipe-control-range", value);
    this.__signals.swipeControlRange.dispatch(value);
  }

  get width() {
    return this.__signals.width.current();
  }
  set width(value: number | undefined) {
    this.validateNumber("width", value);
    this.__signals.width.dispatch(value);
  }

  get sources() {
    return this.__signals.sources.current();
  }
  set sources(value: string | VideoSource[] | undefined) {
    this.__signals.sources.dispatch(value);
  }

  get subtitles() {
    return this.__signals.subtitles.current();
  }
  set subtitles(value: SubtitleTrack[] | undefined) {
    this.__signals.subtitles.dispatch(value);
  }

  private __disconnectCallbacks: Function[] = [];
  private __player!: HTMLDivElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  private validateString(attributeName: string, value: string | undefined) {
    if (value === undefined) {
      return;
    }

    if (typeof value !== "string") {
      throw new Error(`Attribute "${attributeName}" must be a string`);
    }
  }

  private validateNumber(attributeName: string, value: number | undefined) {
    if (value === undefined) {
      return;
    }

    if (typeof value !== "number") {
      throw new Error(`Attribute "${attributeName}" must be a number`);
    }
  }

  private validateBoolean(attributeName: string, value: boolean | undefined) {
    if (value === undefined) {
      return;
    }

    if (typeof value !== "boolean") {
      throw new Error(`Attribute "${attributeName}" must be a boolean`);
    }
  }

  private parse(value: string | null, type: "string"): string | undefined;
  private parse(value: string | null, type: "boolean"): boolean | undefined;
  private parse(value: string | null, type: "number"): number | undefined;
  private parse(
    value: string | null,
    type: "number" | "boolean" | "string",
  ): any {
    if (value == null) {
      return undefined;
    }
    switch (type) {
      case "number":
        return Number(value);
      case "boolean":
        return true;
    }
    return value;
  }

  private parseSources(
    value: string | null,
  ): string | VideoSource[] | undefined {
    if (value == null) {
      return undefined;
    }
    if (value.includes(";")) {
      /**
       * ex. "src=video.mp4,type=video/mp4,label=1080p;;src=video.webm,type=video/webm,label=720p"
       */
      return value.split(";;").map((source) => {
        let src = "";
        let type = "";
        let label = "";

        let fname = "";
        let value = "";
        let stage = 0; // 0 - parsing name, 1 - parsing value
        for (let i = 0; i < source.length; i++) {
          const char = source[i];

          switch (stage) {
            case 0:
              if (char === "=") {
                stage = 1;
                continue;
              }
              fname += char;
              break;
            case 1:
              if (char === ",") {
                const following = source.substring(i + 1);
                if (/^\w+=/.test(following)) {
                  stage = 0;
                  switch (fname) {
                    case "src":
                      src = value.trim();
                      break;
                    case "type":
                      type = value.trim();
                      break;
                    case "label":
                      label = value.trim();
                      break;
                  }
                  continue;
                }
              }
              value += char;
              break;
          }
        }

        return { src, type, label };
      });
    }
    return value;
  }

  private parseSubtitles(
    value: string | null,
  ): SubtitleTrack[] | undefined {
    if (value == null) {
      return undefined;
    }

    /**
     * ex. "id=1,src=subtitles_en.vtt,label=English,srclang=en,default=true;;id=2,src=subtitles_es.vtt,label=Spanish,srclang=es,default=false"
     */
    return value.split(";;").map((source) => {
      let id = "";
      let src = "";
      let label = "";
      let srclang = "";
      let isDefault = false;

      let fname = "";
      let value = "";
      let stage = 0; // 0 - parsing name, 1 - parsing value

      const assignParsed = () => {
        stage = 0;
        switch (fname) {
          case "id":
            id = value.trim();
            break;
          case "src":
            src = value.trim();
            break;
          case "label":
            label = value.trim();
            break;
          case "srclang":
            srclang = value.trim();
            break;
          case "default":
            isDefault = value.trim() === "true";
            break;
        }
        fname = "";
        value = "";
      };

      for (let i = 0; i < source.length; i++) {
        const char = source[i];

        switch (stage) {
          case 0:
            if (char === "=") {
              stage = 1;
              continue;
            }
            fname += char;
            break;
          case 1:
            if (char === ",") {
              const following = source.substring(i + 1);
              if (/^\w+=/.test(following)) {
                assignParsed();
                continue;
              }
            }
            value += char;
            break;
        }
      }
      assignParsed();

      return {
        id,
        label,
        src,
        srclang,
        default: isDefault,
      };
    });
  }

  protected connectedCallback() {
    this.style.display = "contents";

    this.__player = NCPlayer({
      autoplay: this.__signals.autoplay,
      controlsTimeout: this.__signals.controlsTimeout,
      height: this.__signals.height,
      loop: this.__signals.loop,
      muted: this.__signals.muted,
      persistentVolume: this.__signals.persistentVolume,
      poster: this.__signals.poster,
      preload: this.__signals.preload,
      preview: this.__signals.preview,
      previewHeight: this.__signals.previewHeight,
      previewUpdateThrottle: this.__signals.previewUpdateThrottle,
      previewWidth: this.__signals.previewWidth,
      sources: this.__signals.sources,
      styles: this.__signals.styles,
      swipeControlRange: this.__signals.swipeControlRange,
      width: this.__signals.width,
      subtitles: this.__signals.subtitles,
      dismounter: {
        ondismount: (fn) => {
          this.__disconnectCallbacks.push(fn);
        },
      },
    });

    this.shadowRoot!.replaceChildren(this.__player);
  }

  protected disconnectedCallback() {
    this.__disconnectCallbacks
      .splice(0, this.__disconnectCallbacks.length)
      .forEach((fn) => fn());
  }

  protected attributeChangedCallback(
    name: typeof NCPlayerWebComponent.observedAttributes[number],
    oldValue: string | null,
    newValue: string | null,
  ) {
    switch (name) {
      case "autoplay":
        this.autoplay = this.parse(newValue, "boolean");
        break;
      case "controls-timeout":
        this.controlsTimeout = this.parse(newValue, "number");
        break;
      case "height":
        this.height = this.parse(newValue, "number");
        break;
      case "loop":
        this.loop = this.parse(newValue, "boolean");
        break;
      case "muted":
        this.muted = this.parse(newValue, "boolean");
        break;
      case "persistent-volume":
        this.persistentVolume = this.parse(newValue, "boolean");
        break;
      case "poster":
        this.poster = this.parse(newValue, "string");
        break;
      case "preload":
        this.preload = this.parse(
          newValue,
          "string",
        ) as HTMLMediaElement["preload"];
        break;
      case "preview":
        this.preview = this.parse(newValue, "string");
        break;
      case "preview-height":
        this.previewHeight = this.parse(newValue, "number");
        break;
      case "preview-update-throttle":
        this.previewUpdateThrottle = this.parse(newValue, "number");
        break;
      case "preview-width":
        this.previewWidth = this.parse(newValue, "number");
        break;
      case "swipe-control-range":
        this.swipeControlRange = this.parse(newValue, "number");
        break;
      case "width":
        this.width = this.parse(newValue, "number");
        break;
      case "sources":
        this.sources = this.parseSources(newValue);
        break;
      case "subtitles":
        this.subtitles = this.parseSubtitles(newValue);
        break;
      case "styles":
        if (newValue == null) {
          this.styles = undefined;
        } else if (newValue === "none") {
          this.styles = false;
        } else {
          this.styles = newValue;
        }
        break;
    }
  }
}

export function register(name: string = "nc-player") {
  customElements.define(name, NCPlayerWebComponent);
}
