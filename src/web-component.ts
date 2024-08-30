import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { NCPlayer, SubtitleTrack, VideoSource } from "./player.component";
import { replace } from "./utilities/repalce";

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
      "styles",
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
    sources: sig<string | Partial<VideoSource>[] | undefined>(undefined),
    subtitles: sig<Partial<SubtitleTrack>[] | undefined>(undefined),
    defaultSub: sig<string | undefined>(undefined),
  };

  get autoplay() {
    return this.__signals.autoplay.get();
  }
  set autoplay(value: boolean | undefined) {
    if (this.__signals.autoplay.get() !== value) {
      this.validateBoolean("autoplay", value);
      this.__signals.autoplay.dispatch(value);
      this.onPropertySet("autoplay", value);
    }
  }

  get controlsTimeout() {
    return this.__signals.controlsTimeout.get();
  }
  set controlsTimeout(value: number | undefined) {
    if (this.__signals.controlsTimeout.get() !== value) {
      this.validateNumber("controls-timeout", value);
      this.__signals.controlsTimeout.dispatch(value);
      this.onPropertySet("controls-timeout", value);
    }
  }

  get height() {
    return this.__signals.height.get();
  }
  set height(value: number | undefined) {
    if (this.__signals.height.get() !== value) {
      this.validateNumber("height", value);
      this.__signals.height.dispatch(value);
      this.onPropertySet("height", value);
    }
  }

  get loop() {
    return this.__signals.loop.get();
  }
  set loop(value: boolean | undefined) {
    if (this.__signals.loop.get() !== value) {
      this.validateBoolean("loop", value);
      this.__signals.loop.dispatch(value);
      this.onPropertySet("loop", value);
    }
  }

  get muted() {
    return this.__signals.muted.get();
  }
  set muted(value: boolean | undefined) {
    if (this.__signals.muted.get() !== value) {
      this.validateBoolean("muted", value);
      this.__signals.muted.dispatch(value);
      this.onPropertySet("muted", value);
    }
  }

  get persistentVolume() {
    return this.__signals.persistentVolume.get();
  }
  set persistentVolume(value: boolean | undefined) {
    if (this.__signals.persistentVolume.get() !== value) {
      this.validateBoolean("persistent-volume", value);
      this.__signals.persistentVolume.dispatch(value);
      this.onPropertySet("persistent-volume", value);
    }
  }

  get poster() {
    return this.__signals.poster.get();
  }
  set poster(value: string | undefined) {
    if (this.__signals.poster.get() !== value) {
      this.validateString("poster", value);
      this.__signals.poster.dispatch(value);
      this.onPropertySet("poster", value);
    }
  }

  get preload() {
    return this.__signals.preload.get();
  }
  set preload(value: HTMLMediaElement["preload"] | undefined) {
    if (this.__signals.preload.get() !== value) {
      this.validateString("preload", value);
      this.__signals.preload.dispatch(value);
      this.onPropertySet("preload", value);
    }
  }

  get preview() {
    return this.__signals.preview.get();
  }
  set preview(value: string | undefined) {
    if (this.__signals.preview.get() !== value) {
      this.validateString("preview", value);
      this.__signals.preview.dispatch(value);
      this.onPropertySet("preview", value);
    }
  }

  get previewHeight() {
    return this.__signals.previewHeight.get();
  }
  set previewHeight(value: number | undefined) {
    if (this.__signals.previewHeight.get() !== value) {
      this.validateNumber("preview-height", value);
      this.__signals.previewHeight.dispatch(value);
      this.onPropertySet("preview-height", value);
    }
  }

  get previewUpdateThrottle() {
    return this.__signals.previewUpdateThrottle.get();
  }
  set previewUpdateThrottle(value: number | undefined) {
    if (this.__signals.previewUpdateThrottle.get() === value) {
      this.validateNumber("preview-update-throttle", value);
      this.__signals.previewUpdateThrottle.dispatch(value);
      this.onPropertySet("preview-update-throttle", value);
    }
  }

  get previewWidth() {
    return this.__signals.previewWidth.get();
  }
  set previewWidth(value: number | undefined) {
    if (this.__signals.previewWidth.get() !== value) {
      this.validateNumber("preview-width", value);
      this.__signals.previewWidth.dispatch(value);
      this.onPropertySet("preview-width", value);
    }
  }

  get styles() {
    return this.__signals.styles.get();
  }
  set styles(value: string | boolean | undefined) {
    if (this.__signals.styles.get() !== value) {
      if (typeof value !== "string" && typeof value !== "boolean") {
        throw new Error(
          `Attribute "styles" must be either a string or a boolean`,
        );
      }
      this.__signals.styles.dispatch(value);
      this.onPropertySet("styles", value);
    }
  }

  get swipeControlRange() {
    return this.__signals.swipeControlRange.get();
  }
  set swipeControlRange(value: number | undefined) {
    if (this.__signals.swipeControlRange.get() !== value) {
      this.validateNumber("swipe-control-range", value);
      this.__signals.swipeControlRange.dispatch(value);
      this.onPropertySet("swipe-control-range", value);
    }
  }

  get width() {
    return this.__signals.width.get();
  }
  set width(value: number | undefined) {
    if (this.__signals.width.get() !== value) {
      this.validateNumber("width", value);
      this.__signals.width.dispatch(value);
      this.onPropertySet("width", value);
    }
  }

  get sources() {
    return this.__signals.sources.get();
  }
  set sources(value: string | Partial<VideoSource>[] | undefined) {
    this.__signals.sources.dispatch(value);
  }

  get subtitles() {
    return this.__signals.subtitles.get();
  }
  set subtitles(value: Partial<SubtitleTrack>[] | undefined) {
    this.__signals.subtitles.dispatch(value);
  }

  private __disconnectCallbacks: Function[] = [];
  private __player!: HTMLDivElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  private onPropertySet(name: string, value: any) {
    if (value == null || value === false) {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, String(value));
    }
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

  private handleSubtitleAttributeChange(name: string, value: string | null) {
    const [id, prop] = name.split("-") as [string, string | undefined];

    if (id === "default") {
      this.__signals.defaultSub.dispatch(value ?? undefined);
      return;
    }

    this.__signals.subtitles.dispatch((subs) => {
      if (!subs) {
        subs = [];
      }
      const existingEntryIdx = subs.findIndex(s => s.id === id);

      if (!prop) {
        // ex: `sub-0="./english.vtt"`

        if (existingEntryIdx === -1) {
          return subs.concat({ id, src: value ?? undefined });
        } else {
          return replace(subs, existingEntryIdx, (old) => {
            return { ...old, src: value ?? undefined };
          });
        }
      } else if (prop === "label") {
        // ex: `sub-0-label="English"`

        if (existingEntryIdx === -1) {
          return subs.concat({ id, label: value ?? undefined });
        } else {
          return replace(subs, existingEntryIdx, (old) => {
            return { ...old, label: value ?? undefined };
          });
        }
      } else if (prop === "lang") {
        // ex: `sub-0-lang="en"`

        if (existingEntryIdx === -1) {
          return subs.concat({ id, srclang: value ?? undefined });
        } else {
          return replace(subs, existingEntryIdx, (old) => {
            return { ...old, srclang: value ?? undefined };
          });
        }
      }
    });
  }

  private handleSourceAttributeChange(name: string, value: string | null) {
    if (name === "") {
      this.__signals.sources.dispatch(value ?? undefined);
      return;
    }

    const [id, prop] = name.split("-") as [string, string | undefined];

    this.__signals.sources.dispatch((sources) => {
      if (!Array.isArray(sources)) {
        sources = [];
      }

      const existingEntryIdx = sources.findIndex(s => s.id === id);

      if (!prop) {
        // ex: `source-0="./video.mp4"`

        if (existingEntryIdx === -1) {
          return sources.concat({ id, src: value ?? undefined });
        } else {
          return replace(sources, existingEntryIdx, (old) => {
            return { ...old, src: value ?? undefined };
          });
        }
      } else if (prop === "type") {
        // ex: `source-0-type="video/mp4"`

        if (existingEntryIdx === -1) {
          return sources.concat({ id, type: value ?? undefined });
        } else {
          return replace(sources, existingEntryIdx, (old) => {
            return { ...old, type: value ?? undefined };
          });
        }
      } else if (prop === "label") {
        // ex: `source-0-label="HD"`

        if (existingEntryIdx === -1) {
          return sources.concat({ id, label: value ?? undefined });
        } else {
          return replace(sources, existingEntryIdx, (old) => {
            return { ...old, label: value ?? undefined };
          });
        }
      }
    });
  }

  /**
   * Since there's no way to observe attributes which names are not known in advance,
   * To have subtitles controlled via attributes we need to use MutationObserver to
   * detect changes in all attributes and filter out ones related to subtitles.
   */
  private handleDynamicAttributeChange(mutRecords: MutationRecord[]) {
    for (let i = 0; i < mutRecords.length; i++) {
      const record = mutRecords[i]!;
      if (record.type !== "attributes") {
        continue;
      }

      if (record.attributeName!.startsWith("sub-")) {
        this.handleSubtitleAttributeChange(
          record.attributeName!.substring(4),
          this.getAttribute(record.attributeName!),
        );
      } else if (
        record.attributeName! === "source"
        || record.attributeName!.startsWith("source-")
      ) {
        this.handleSourceAttributeChange(
          record.attributeName!.substring(7),
          this.getAttribute(record.attributeName!),
        );
      }
    }
  }

  private mutObserver!: MutationObserver;
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
      styles: this.__signals.styles,
      swipeControlRange: this.__signals.swipeControlRange,
      width: this.__signals.width,
      sources: this.__signals.sources.derive(sources => {
        if (Array.isArray(sources)) {
          return sources.filter((s): s is VideoSource => {
            return (
              typeof s.src === "string"
              && typeof s.type === "string"
              && typeof s.label === "string"
            );
          }).sort((a, b) => a.id!.localeCompare(b.id!));
        }
        return sources;
      }),
      subtitles: sig.derive(
        this.__signals.subtitles,
        this.__signals.defaultSub,
        (subs, defaultId) => {
          if (Array.isArray(subs)) {
            if (defaultId) {
              const idx = subs.findIndex(s => s.id === defaultId);
              if (idx !== -1) {
                subs = replace(subs, idx, (old) => {
                  return { ...old, default: true };
                });
              }
            }

            return subs.filter((s): s is SubtitleTrack => {
              return (
                typeof s.id === "string"
                && typeof s.src === "string"
                && typeof s.label === "string"
                && typeof s.srclang === "string"
              );
            }).sort((a, b) => a.id.localeCompare(b.id));
          }
          return subs;
        },
      ),
      dismounter: {
        ondismount: (fn) => {
          this.__disconnectCallbacks.push(fn);
        },
      },
    });

    this.shadowRoot!.replaceChildren(this.__player);

    const observer = new MutationObserver(
      this.handleDynamicAttributeChange.bind(this),
    );
    observer.observe(this, {
      attributes: true,
    });
    this.mutObserver = observer;

    for (const attr of this.attributes) {
      if (attr.name.startsWith("sub-")) {
        this.handleSubtitleAttributeChange(attr.name.substring(4), attr.value);
      } else if (
        attr.name === "source"
        || attr.name.startsWith("source-")
      ) {
        this.handleSourceAttributeChange(attr.name.substring(7), attr.value);
      }
    }
  }

  protected disconnectedCallback() {
    this.__disconnectCallbacks
      .splice(0, this.__disconnectCallbacks.length)
      .forEach((fn) => fn());

    this.mutObserver.disconnect();
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
