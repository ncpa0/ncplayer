import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { FullscreenButton } from "./components/fullscreen-button";
import { VideoSources } from "./components/sources";
import { StartButton } from "./components/start-button";
import { SubtitleSettingsBtn } from "./components/sub-settings";
import { VideoSubTracks } from "./components/sub-tracks";
import { TimeDisplay } from "./components/time-display";
import { VideoTrack } from "./components/video-track";
import { VolumeControl } from "./components/volume-control";
import { EventController } from "./composables/event-controller";
import { PlaybackControls } from "./composables/playback-controls";
import { NCPlayerPublicInterface } from "./composables/public-interface";
import { SubtitleController } from "./composables/subtitle-controller";
import {
  SUB_DEFAULTS,
  SubtitleSettingsController as SubSettingsController,
} from "./composables/subtitle-settings";
import { PlayerProps } from "./player.component";
import defaultStylesheet from "./player.styles.css";
import { signalize } from "./utilities/signalize";
import { stopEvent } from "./utilities/stop-event";

export class NCPlayerContext {
  private cleanups: Array<() => void> = [];

  subtitleSelectListener;
  globalEvent = new EventController(this);
  subSettings;
  subtitles;
  controls;
  pubInterface;
  props;

  video;
  element;

  constructor(props: PlayerProps) {
    const {
      on: { subtitleSelect, ...listeners } = {},
      defaultSubSettings = SUB_DEFAULTS,
      ...rawProps
    } = props;

    this.subtitleSelectListener = subtitleSelect ?? (() => {});

    this.props = signalize(rawProps);
    this.subSettings = new SubSettingsController(
      this,
      defaultSubSettings,
    );
    this.controls = new PlaybackControls(this);
    this.pubInterface = new NCPlayerPublicInterface(this);

    this.video = (
      <video
        class="main-player"
        controls={false}
        onplay={e => this.controls.handlePlay(e)}
        onpause={e => this.controls.handlePause(e)}
        ontimeupdate={e => this.controls.handleTimeUpdate(e)}
        onprogress={e => this.controls.handleProgress(e)}
        autoplay={this.props.autoplay}
        muted={this.props.muted}
        poster={this.props.poster}
        preload={this.props.preload}
        loop={this.props.loop}
        volume={this.controls.volume.signal}
        src={this.props.sources.derive((s) => {
          return typeof s === "string" ? s : undefined;
        })}
        width={sig.derive(
          this.props.width,
          this.controls.isFullscreen,
          (w, fs) => {
            if (!fs) {
              return w;
            }
          },
        )}
        height={sig.derive(
          this.props.height,
          this.controls.isFullscreen,
          (h, fs) => {
            if (!fs) {
              return h;
            }
          },
        )}
      >
        {VideoSources({ sources: this.props.sources })}
        {sig.and(
          sig.not(this.subSettings.enabled),
          VideoSubTracks({ subtitles: this.props.subtitles }),
        )}
      </video>
    ) as HTMLVideoElement;

    this.subtitles = new SubtitleController(this);
    const controlsElems = this.controlElements();
    this.element = (
      <div
        class={{
          ncplayer: true,
          fullscreen: this.controls.isFullscreen,
          "hide-cursor": sig.not(this.controls.showControls),
        }}
        onmousemove={e => this.controls.handleMouseMove(e)}
        onmouseleave={e => this.controls.handleMouseLeave()}
      >
        {this.props.styles.derive(s => {
          if (s === false) return <></>;
          if (typeof s === "string") {
            return <style>{s}</style>;
          }
          return <style>{defaultStylesheet}</style>;
        })}
        {this.video}
        <div
          class="event-capturer"
          draggable={false}
          ontouchstart={e => this.controls.capturer.handleCaptureTouchStart(e)}
          ontouchmove={e => this.controls.capturer.handleCaptureTouchMove(e)}
          ontouchend={e => this.controls.capturer.handleCaptureTouchEnd(e)}
          ontouchcancel={e => this.controls.capturer.handleCaptureTouchEnd(e)}
          onpointerup={e => this.controls.capturer.handleCapturePointerUp(e)}
          onwheel={e => this.controls.capturer.handleCaptureWheel(e)}
          oncontextmenu={stopEvent}
          tabIndex={1}
          role="button"
        />
        {this.subtitles.subtitlesElement}
        <div
          class={{
            controls: true,
            visible: this.controls.showControls,
            playing: this.controls.isPLaying,
          }}
        >
          {this.props.customControls.derive(customControls => {
            const elems = controlsElems.slice();
            if (customControls) {
              for (const customBtn of customControls) {
                elems.splice(
                  customBtn.index,
                  0,
                  <button
                    class={["ctl-btn", "custom-btn", customBtn.class]}
                    onclick={customBtn.onClick}
                  >
                    {customBtn.content}
                  </button>,
                );
              }
            }
            return elems;
          })}
        </div>
      </div>
    ) as HTMLDivElement;

    if (listeners) {
      for (
        const [event, listener] of Object.entries(listeners) as [
          keyof typeof listeners,
          (e: Event) => void,
        ][]
      ) {
        this.video.addEventListener(event, listener);
        this.cleanups.push(() => {
          this.video.removeEventListener(event, listener);
        });
      }
    }

    Object.defineProperty(this.element, "dispose", {
      value: () => this.dispose(),
    });

    Object.defineProperty(this.element, "controller", {
      value: this.pubInterface,
    });
  }

  dispose() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
    this.element.remove();
  }

  private controlElements() {
    return [
      <StartButton
        video={this.video}
        playing={this.controls.isPLaying}
      />,
      <VideoTrack
        video={this.video}
        progress={this.controls.progress}
        bufferProgress={this.controls.bufferProgress}
        preview={this.props.preview}
        previewWidth={this.props.previewWidth}
        previewHeight={this.props.previewHeight}
        previewUpdateThrottle={this.props.previewUpdateThrottle}
        globalEvents={this.globalEvent}
        onSeek={(newProgress) => {
          this.controls.seekProgress(newProgress);
        }}
        onWheel={e => this.controls.handleTrackWheel(e)}
        onMouseEnter={e => this.controls.handleTrackMouseEnter()}
        onMouseLeave={e => this.controls.handleTrackMouseLeave()}
      />,
      <TimeDisplay
        progress={this.controls.progress}
        isVisible={this.controls.showControls}
        videoElement={this.video}
      />,
      <VolumeControl
        volume={this.controls.volume.signal}
        onVolumeChange={(v) => this.controls.setVolume(v)}
        onVolumeToggle={() => this.controls.toggleMute()}
        globalEvents={this.globalEvent}
      />,
      this.subtitles.renderButton(),
      <SubtitleSettingsBtn
        visible={this.subSettings.showSettingsButton}
        settings={this.subSettings}
        globalEvents={this.globalEvent}
        defaults={this.subSettings.defaultSubSettings}
      />,
      <FullscreenButton
        isFullscreen={this.controls.isFullscreen}
        onPress={() => this.controls.toggleFullscreen()}
      />,
    ];
  }

  cleanup(cl: () => void) {
    this.cleanups.push(cl);
  }

  playerElement() {
    return this.element as HTMLDivElement & {
      /**
       * Disposes of the player, removing all event listeners and cleaning up
       * any resources.
       */
      dispose(): void;
      controller: NCPlayerPublicInterface;
    };
  }
}
