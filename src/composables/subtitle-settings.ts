import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { NCPlayerContext } from "../player";
import { LocalValue } from "./local-value";

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
};

export class SubtitleSettingsController {
  private storedSettings;
  readonly enabled;
  readonly showSettingsButton;
  readonly values;

  constructor(
    protected context: NCPlayerContext,
    public readonly defaultSubSettings: Readonly<Partial<typeof SUB_DEFAULTS>>,
  ) {
    this.storedSettings = new LocalValue(
      "ncplayer-sub-settings",
      defaultSubSettings,
    );

    this.values = sig<Readonly<SubtitleSettings>>(
      this.storedSettings.get(),
    );
    this.values.observe(s => this.storeSettings(s));

    this.showSettingsButton = this.context.props.customSubtitleDisplay;
    this.enabled = sig.derive(
      this.values,
      this.showSettingsButton,
      (settings, defaultEnabled) => {
        if (settings?.forceNative) return false;
        return defaultEnabled;
      },
    );
  }

  private storeSettings(s: Readonly<SubtitleSettings>) {
    if (this.context.props.persistentVolume.get()) {
      this.storedSettings.set(s);
    }
  }

  set(settings: Partial<SubtitleSettings>) {
    this.values.dispatch(v => ({ ...v, ...settings }));
  }

  reset() {
    this.values.dispatch(
      this.defaultSubSettings === SUB_DEFAULTS ? {} : this.defaultSubSettings,
    );
  }
}
