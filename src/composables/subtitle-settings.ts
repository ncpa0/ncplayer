import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { NCPlayerContext } from "../player";
import { LocalSignal } from "./local-value";

export type SubtitleSettings = {
  fontFamily?: string;
  fontSize?: number;
  forceNative?: boolean;
  outlineColor?: string;
  outlineSize?: number;
  padding?: number;
  textColor?: string;
};

export const SUB_DEFAULTS = {
  fontFamily: "Verdana",
  fontSize: 3,
  outlineColor: "#ffffff",
  outlineSize: 0.06,
  padding: 1,
  textColor: "#000000",
  forceNative: false,
};

export class SubtitleSettingsController {
  readonly enabled;
  readonly showSettingsButton;
  readonly values;

  constructor(
    protected context: NCPlayerContext,
    public readonly defaultSubSettings: Readonly<Partial<typeof SUB_DEFAULTS>>,
  ) {
    this.values = new LocalSignal(
      "ncplayer-sub-settings",
      defaultSubSettings,
      { enabled: this.context.props.persistentSubSettings },
    );

    this.showSettingsButton = this.context.props.customSubtitleDisplay;
    this.enabled = sig.derive(
      this.values.signal,
      this.showSettingsButton,
      (settings, defaultEnabled) => {
        if (settings?.forceNative) return false;
        return defaultEnabled;
      },
    );
  }

  set(settings: Partial<SubtitleSettings>) {
    this.values.set({ ...this.values.get(), ...settings });
  }

  reset() {
    this.values.set(
      this.defaultSubSettings === SUB_DEFAULTS ? {} : this.defaultSubSettings,
    );
  }
}
