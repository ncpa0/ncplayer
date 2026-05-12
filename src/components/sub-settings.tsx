import { ReadonlySignal, sig, Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import SubSettingsIcon from "../assets/cog.svg";
import { GlobalEventController } from "../hooks/global-events-controller";
import { isInside } from "../utilities/is-inside";
import { SubtitleSettings } from "./subtitle-select";

export const SUB_DEFAULTS = {
  fontSize: 3,
  outlineSize: 0.04,
  padding: 1,
  fontFamily: "Verdana",
  textColor: "#000000",
  outlineColor: "#ffffff",
};

export function getInitSubSettings(
  persistent: ReadonlySignal<boolean | undefined>,
  definedDefs?: Partial<typeof SUB_DEFAULTS>,
): SubtitleSettings {
  if (persistent.get()) {
    const stored = localStorage.getItem("ncplayer-sub-settings");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
  }
  return definedDefs ?? {};
}

export function SubtitleSettingsBtn(
  props: {
    enabled: ReadonlySignal<boolean | undefined>;
    settings: Signal<SubtitleSettings>;
    globalEvents: GlobalEventController;
    defaults?: Partial<typeof SUB_DEFAULTS>;
  },
) {
  const defaults = props.defaults
    ? {
      ...SUB_DEFAULTS,
      ...props.defaults,
    }
    : SUB_DEFAULTS;

  const popoverVisible = sig(false);

  const handlePress = () => {
    popoverVisible.dispatch(true);
  };

  const handleFontSizeIncrement = () => {
    const fs = props.settings.get().fontSize ?? defaults.fontSize;
    props.settings.dispatch(v => ({ ...v, fontSize: fs + 0.1 }));
  };

  const handleFontSizeDecrement = () => {
    const fs = props.settings.get().fontSize ?? defaults.fontSize;
    props.settings.dispatch(v => ({ ...v, fontSize: fs - 0.1 }));
  };

  const handleOutlineSizeIncrement = () => {
    const fs = props.settings.get().outlineSize ?? defaults.outlineSize;
    props.settings.dispatch(v => ({ ...v, outlineSize: fs + 0.01 }));
  };

  const handleOutlineSizeDecrement = () => {
    const fs = props.settings.get().outlineSize ?? defaults.outlineSize;
    props.settings.dispatch(v => ({ ...v, outlineSize: fs - 0.01 }));
  };

  const handlePaddingSizeIncrement = () => {
    const fs = props.settings.get().padding ?? defaults.padding;
    props.settings.dispatch(v => ({ ...v, padding: fs + 0.1 }));
  };

  const handlePaddingSizeDecrement = () => {
    const fs = props.settings.get().padding ?? defaults.padding;
    props.settings.dispatch(v => ({ ...v, padding: fs - 0.1 }));
  };

  const handleFontColorChange = (
    ev: Event & { target: HTMLInputElement },
  ) => {
    const newColor = ev.target.value;
    props.settings.dispatch(v => ({ ...v, textColor: newColor }));
  };

  const handleOutlineColorChange = (
    ev: Event & { target: HTMLInputElement },
  ) => {
    const newColor = ev.target.value;
    props.settings.dispatch(v => ({ ...v, outlineColor: newColor }));
  };

  const handleFontChange = (ev: Event & { target: HTMLInputElement }) => {
    const newFont = ev.target.value;
    props.settings.dispatch(v => ({ ...v, fontFamily: newFont }));
  };

  const handleReset = () => {
    props.settings.dispatch(props.defaults ?? {});
  };

  props.globalEvents.on(
    "click",
    (e) => {
      if (!popoverVisible.get()) {
        return;
      }

      if (!isInside(e.target, ".subtitle-settings-popover")) {
        popoverVisible.dispatch(false);
        e.stopPropagation();
      }
    },
    "document",
    { capture: true },
  );

  return (
    <div class={{ "subtitle-settings": true, "visible": props.enabled }}>
      {sig.and(
        props,
        <button
          class={{
            "ctl-btn": true,
            "subtitle-settings-btn": true,
            "popover-visible": popoverVisible,
          }}
          onclick={handlePress}
        >
          <div class="subtitle-selector-icon">
            <SubSettingsIcon />
          </div>
        </button>,
      )}
      <div
        class={{
          "subtitle-settings-popover": true,
          visible: popoverVisible,
        }}
      >
        <div class={"settings-entry"}>
          <h2 class="sub-settings-header">Subtitles Settings</h2>
        </div>
        <div class={"settings-entry"}>
          <span>
            Font size:
          </span>
          <div>
            <button
              class="subsettbtn fontsizebtn"
              onclick={handleFontSizeDecrement}
            >
              -
            </button>
            <span class="fontsize-preview">
              x{props.settings.derive(v =>
                (v.fontSize ?? defaults.fontSize).toFixed(2)
              )}
            </span>
            <button
              class="subsettbtn fontsizebtn"
              onclick={handleFontSizeIncrement}
            >
              +
            </button>
          </div>
        </div>

        <div class={"settings-entry"}>
          <span>
            Outline size:
          </span>
          <div>
            <button
              class="subsettbtn fontsizebtn"
              onclick={handleOutlineSizeDecrement}
            >
              -
            </button>
            <span class="fontsize-preview">
              x{props.settings.derive(v =>
                (v.outlineSize ?? defaults.outlineSize).toFixed(2)
              )}
            </span>
            <button
              class="subsettbtn fontsizebtn"
              onclick={handleOutlineSizeIncrement}
            >
              +
            </button>
          </div>
        </div>

        <div class={"settings-entry"}>
          <span>
            Padding:
          </span>
          <div>
            <button
              class="subsettbtn fontsizebtn"
              onclick={handlePaddingSizeDecrement}
            >
              -
            </button>
            <span class="fontsize-preview">
              {props.settings.derive(v =>
                (v.padding ?? defaults.padding).toFixed(2)
              )}
            </span>
            <button
              class="subsettbtn fontsizebtn"
              onclick={handlePaddingSizeIncrement}
            >
              +
            </button>
          </div>
        </div>

        <div class={"settings-entry"}>
          <span>
            Font Family:
          </span>
          <div>
            <input
              class="subsettinput"
              defaultValue={props.settings.derive(
                v => v.fontFamily ?? defaults.fontFamily,
              )}
              onchange={handleFontChange}
            />
          </div>
        </div>

        <div class={"settings-entry"}>
          <span>
            Color:
          </span>
          <div>
            <input
              class="subsettinput"
              defaultValue={props.settings.derive(
                v => v.textColor ?? defaults.textColor,
              )}
              onchange={handleFontColorChange}
            />
          </div>
        </div>

        <div class={"settings-entry"}>
          <span>
            Outline Color:
          </span>
          <div>
            <input
              class="subsettinput"
              defaultValue={props.settings.derive(
                v => v.outlineColor ?? defaults.outlineColor,
              )}
              onchange={handleOutlineColorChange}
            />
          </div>
        </div>

        <div class={"settings-entry"}>
          <span></span>
          <button class="subsettbtn" onclick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
