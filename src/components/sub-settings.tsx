import { ReadonlySignal, sig, Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import SubSettingsIcon from "../assets/cog.svg";
import { GlobalEventController } from "../hooks/global-events-controller";
import { SubtitleSettings } from "./subtitle-select";

const DEFAULTS = {
  fontSize: 3,
  outlineSize: 0.04,
};

export function getInitSubSettings(
  persistent: ReadonlySignal<boolean | undefined>,
): SubtitleSettings {
  if (persistent.get()) {
    const stored = localStorage.getItem("ncplayer-sub-settings");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
  }
  return {};
}

export function SubtitleSettingsBtn(
  props: {
    enabled: ReadonlySignal<boolean | undefined>;
    settings: Signal<SubtitleSettings>;
    globalEvents: GlobalEventController;
  },
) {
  const popoverVisible = sig(false);

  const handlePress = () => {
    popoverVisible.dispatch(v => !v);
  };

  const handleFontSizeIncrement = () => {
    const fs = props.settings.get().fontSize ?? DEFAULTS.fontSize;
    props.settings.dispatch(v => ({ ...v, fontSize: fs + 0.1 }));
  };

  const handleFontSizeDecrement = () => {
    const fs = props.settings.get().fontSize ?? DEFAULTS.fontSize;
    props.settings.dispatch(v => ({ ...v, fontSize: fs - 0.1 }));
  };

  const handleOutlineSizeIncrement = () => {
    const fs = props.settings.get().outlineSize ?? DEFAULTS.outlineSize;
    props.settings.dispatch(v => ({ ...v, outlineSize: fs + 0.01 }));
  };

  const handleOutlineSizeDecrement = () => {
    const fs = props.settings.get().outlineSize ?? DEFAULTS.outlineSize;
    props.settings.dispatch(v => ({ ...v, outlineSize: fs - 0.01 }));
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

  const handleReset = () => {
    props.settings.dispatch({});
  };

  props.globalEvents.on("click", (e) => {
    if (!popoverVisible.get()) {
      return;
    }

    // check if the click was outside the popover
    if (
      e.target instanceof HTMLElement
      && !e.target.closest(".subtitle-settings-modal")
    ) {
      popoverVisible.dispatch(false);
      e.stopPropagation();
      e.preventDefault();
    }
  });

  return (
    <div class={{ "subtitle-settings-modal": true, "visible": props.enabled }}>
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
                (v.fontSize ?? DEFAULTS.fontSize).toFixed(2)
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
                (v.outlineSize ?? DEFAULTS.outlineSize).toFixed(2)
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
            Color:
          </span>
          <div>
            <input
              class="subsettinput"
              defaultValue="#000000"
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
              defaultValue="#ffffff"
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
