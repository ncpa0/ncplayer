import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import SubSettingsIcon from "../assets/cog.svg";
import { EventController } from "../composables/event-controller";
import {
  SUB_DEFAULTS,
  SubtitleSettingsController,
} from "../composables/subtitle-settings";
import { isInside } from "../utilities/is-inside";

export function SubtitleSettingsBtn(
  props: {
    visible: ReadonlySignal<boolean | undefined>;
    settings: SubtitleSettingsController;
    globalEvents: EventController;
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

  const handleForceNativeChange = (
    ev: Event & {
      target: HTMLInputElement;
    },
  ) => {
    props.settings.set({ forceNative: ev.target.checked });
  };

  const handleFontSizeIncrement = () => {
    const fs = props.settings.values.get().fontSize ?? defaults.fontSize;
    props.settings.set({ fontSize: fs + 0.1 });
  };

  const handleFontSizeDecrement = () => {
    const fs = props.settings.values.get().fontSize ?? defaults.fontSize;
    props.settings.set({ fontSize: fs - 0.1 });
  };

  const handleOutlineSizeIncrement = () => {
    const fs = props.settings.values.get().outlineSize ?? defaults.outlineSize;
    props.settings.set({ outlineSize: fs + 0.01 });
  };

  const handleOutlineSizeDecrement = () => {
    const fs = props.settings.values.get().outlineSize ?? defaults.outlineSize;
    props.settings.set({ outlineSize: fs - 0.01 });
  };

  const handlePaddingSizeIncrement = () => {
    const fs = props.settings.values.get().padding ?? defaults.padding;
    props.settings.set({ padding: fs + 0.1 });
  };

  const handlePaddingSizeDecrement = () => {
    const fs = props.settings.values.get().padding ?? defaults.padding;
    props.settings.set({ padding: fs - 0.1 });
  };

  const handleFontColorChange = (
    ev: Event & { target: HTMLInputElement },
  ) => {
    const newColor = ev.target.value;
    props.settings.set({ textColor: newColor });
  };

  const handleOutlineColorChange = (
    ev: Event & { target: HTMLInputElement },
  ) => {
    const newColor = ev.target.value;
    props.settings.set({ outlineColor: newColor });
  };

  const handleFontChange = (ev: Event & { target: HTMLInputElement }) => {
    const newFont = ev.target.value;
    props.settings.set({ fontFamily: newFont });
  };

  const handleReset = () => {
    props.settings.reset();
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

  const forcedNativeSubs = props.settings.values.derive(v =>
    v.forceNative === true ? true : false
  );

  return (
    <div class={{ "subtitle-settings": true, "visible": props.visible }}>
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

        <div
          class={{ "settings-entry": true, "setting-hidden": forcedNativeSubs }}
        >
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
              x{props.settings.values.derive(v =>
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

        <div
          class={{ "settings-entry": true, "setting-hidden": forcedNativeSubs }}
        >
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
              x{props.settings.values.derive(v =>
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

        <div
          class={{ "settings-entry": true, "setting-hidden": forcedNativeSubs }}
        >
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
              {props.settings.values.derive(v =>
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

        <div
          class={{ "settings-entry": true, "setting-hidden": forcedNativeSubs }}
        >
          <span>
            Font Family:
          </span>
          <div>
            <input
              class="subsettinput"
              defaultValue={props.settings.values.derive(
                v => v.fontFamily ?? defaults.fontFamily,
              )}
              onchange={handleFontChange}
            />
          </div>
        </div>

        <div
          class={{ "settings-entry": true, "setting-hidden": forcedNativeSubs }}
        >
          <span>
            Color:
          </span>
          <div>
            <input
              class="subsettinput"
              defaultValue={props.settings.values.derive(
                v => v.textColor ?? defaults.textColor,
              )}
              onchange={handleFontColorChange}
            />
          </div>
        </div>

        <div
          class={{ "settings-entry": true, "setting-hidden": forcedNativeSubs }}
        >
          <span>
            Outline Color:
          </span>
          <div>
            <input
              class="subsettinput"
              defaultValue={props.settings.values.derive(
                v => v.outlineColor ?? defaults.outlineColor,
              )}
              onchange={handleOutlineColorChange}
            />
          </div>
        </div>

        <div class={"settings-entry"}>
          <span>Force native:</span>
          <input
            type="checkbox"
            class="subsettcheckbox"
            checked={forcedNativeSubs}
            onchange={handleForceNativeChange}
          />
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
