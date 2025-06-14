import { MaybeReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { FullscreenButton } from "./components/fullscreen-button";
import { VideoSources } from "./components/sources";
import { StartButton } from "./components/start-button";
import { VideoSubTracks } from "./components/sub-tracks";
import { SubtitleSelect } from "./components/subtitle-select";
import { TimeDisplay } from "./components/time-display";
import { VideoTrack } from "./components/video-track";
import { VolumeControl } from "./components/volume-control";
import { useGlobalEventController } from "./hooks/global-events-controller";
import { usePlaybackControls } from "./hooks/playback-controls";
import defaultStylesheet from "./player.styles.css";
import { signalize } from "./utilities/signalize";
import { stopEvent } from "./utilities/stop-event";

export { defaultStylesheet };

export interface PlayerController {
  play(): void;
  pause(): void;
  seek(second: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  toggleFullscreen(): void;
  reset(): void;
  video(): HTMLVideoElement;
  isReady(): boolean;
  on<E extends keyof PlayerEvents>(
    event: E,
    listener: PlayerEvents[E],
  ): () => void;
  once<E extends keyof PlayerEvents>(
    event: E,
    listener: PlayerEvents[E],
  ): () => void;
}

export type PlayerEvents = {
  audioprocess: (event: VideoEvent<AudioProcessingEvent>) => void;
  canplay: (event: VideoEvent) => void;
  canplaythrough: (event: VideoEvent) => void;
  complete: (event: VideoEvent) => void;
  durationchange: (event: VideoEvent) => void;
  emptied: (event: VideoEvent) => void;
  ended: (event: VideoEvent) => void;
  error: (event: VideoEvent) => void;
  loadeddata: (event: VideoEvent) => void;
  loadedmetadata: (event: VideoEvent) => void;
  loadstart: (event: VideoEvent) => void;
  pause: (event: VideoEvent) => void;
  play: (event: VideoEvent) => void;
  playing: (event: VideoEvent) => void;
  progress: (event: VideoEvent) => void;
  ratechange: (event: VideoEvent) => void;
  seeked: (event: VideoEvent) => void;
  seeking: (event: VideoEvent) => void;
  stalled: (event: VideoEvent) => void;
  suspend: (event: VideoEvent) => void;
  timeupdate: (event: VideoEvent) => void;
  volumechange: (event: VideoEvent) => void;
  waiting: (event: VideoEvent) => void;
  waitingforkey: (event: VideoEvent) => void;
  abort: (event: VideoEvent) => void;
  encrypted: (event: VideoEvent<MediaEncryptedEvent>) => void;
  enterpictureinpicture: (event: VideoEvent<PictureInPictureEvent>) => void;
  leavepictureinpicture: (event: VideoEvent<PictureInPictureEvent>) => void;
  resize: (event: VideoEvent) => void;
};

export type ControllerRef = { current: PlayerController } | {
  current?: PlayerController | null;
};

export type VideoSource = {
  id?: string;
  src: string;
  type: string;
  label: string;
};

export type SubtitleTrack = {
  id: string;
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
};

export type Dismounter = {
  ondismount(fn: Function): void;
};

export type VideoEvent<Base = Event> = Base & {
  target: HTMLVideoElement;
};

export type CustomControlButton = {
  index: number;
  content: string | Element;
  class?: string;
  onClick?: () => void;
};

export type PlayerProps = {
  /**
   * Width of the video player.
   */
  width?: MaybeReadonlySignal<number | undefined>;
  /**
   * Height of the video player.
   */
  height?: MaybeReadonlySignal<number | undefined>;
  /**
   * Whether the video should start playing as soon as it is ready.
   */
  autoplay?: MaybeReadonlySignal<boolean | undefined>;
  /**
   * Whether the video should be muted.
   */
  muted?: MaybeReadonlySignal<boolean | undefined>;
  /**
   * URL of the image to use as the poster.
   */
  poster?: MaybeReadonlySignal<string | undefined>;
  /**
   * The preload attribute for the video.
   */
  preload?: MaybeReadonlySignal<HTMLMediaElement["preload"] | undefined>;
  /**
   * Whether the video should be played in a loop.
   */
  loop?: MaybeReadonlySignal<boolean | undefined>;
  /**
   * URL(s) of the video to play. If provided multiple sources, the player
   * will allow the user to select the source.
   */
  sources?:
    | MaybeReadonlySignal<string | undefined>
    | MaybeReadonlySignal<Array<VideoSource> | undefined>
    | MaybeReadonlySignal<string | Array<VideoSource> | undefined>;
  /**
   * Array of subtitle tracks to allow user to select.
   */
  subtitles?: MaybeReadonlySignal<Array<SubtitleTrack> | undefined>;
  /**
   * Time in milliseconds after which the controls should be hidden.
   */
  controlsTimeout?: MaybeReadonlySignal<number | undefined>;
  /**
   * URL of the video to use as the preview. Preview will be displayed above
   * the progress bar as the user hovers over it.
   */
  preview?: MaybeReadonlySignal<string | undefined>;
  /**
   * Determines how often the preview video timestamp should be updated as
   * the user hovers over the progress bar.
   */
  previewUpdateThrottle?: MaybeReadonlySignal<number | undefined>;
  /**
   * Width of the preview video.
   */
  previewWidth?: MaybeReadonlySignal<number | undefined>;
  /**
   * Height of the preview video.
   */
  previewHeight?: MaybeReadonlySignal<number | undefined>;
  /**
   * Whether the player volume should persist between reloads.
   */
  persistentVolume?: MaybeReadonlySignal<boolean | undefined>;
  /**
   * When set to `false`, no styles will be added to the DOM, resulting
   * in the unstyled player. (you will need to add styles yourself)
   *
   * When given a string, that string will be inserted into the DOM as a
   * style tag instead of the default styles.
   */
  styles?: MaybeReadonlySignal<string | boolean | undefined>;
  /**
   * Maximum time range (in ms) it's possible to seek forward or backward by
   * swiping on a mobile device.
   */
  swipeControlRange?: MaybeReadonlySignal<number | undefined>;
  /**
   * By default player will listen to all key events that don't have
   * an interactable target. If set to false only events with a
   * target within the player will be listened to.
   */
  globalKeyListener?: MaybeReadonlySignal<boolean | undefined>;
  /**
   * The duration in seconds that the player should seek when the
   * user presses the left or right arrow keys.
   */
  keySeekDuration?: MaybeReadonlySignal<number | undefined>;
  /**
   * Custom control elements that will be displayed on the bottom bar.
   * Each custom element will be inserted into the bar at the specified index,
   * initial indexes of the default control elements are:
   * - 0: Play/Pause button
   * - 1: Progress track
   * - 2: Time display
   * - 3: Volume Controll
   * - 4: Subtitle selection
   * - 5: Fullscreen button
   *
   * Note that inserting an element will shift all the following elements index
   * by one (ex. after adding elem at index 4, `Subtitle selection` moves to
   * index 5, and `Fullscreen button` to index 6.)
   */
  customControls?: MaybeReadonlySignal<CustomControlButton[] | undefined>;
  on?: Partial<PlayerEvents>;
};

export function NCPlayer(
  { on: listeners, ...rawProps }: PlayerProps,
) {
  const cleanups: Array<Function> = [];
  const props = signalize(rawProps);
  const {
    styles,
    sources,
    subtitles,
    controlsTimeout,
    preview,
    previewUpdateThrottle,
    persistentVolume,
    swipeControlRange,
    globalKeyListener,
    keySeekDuration,
    customControls,
  } = props;

  const globalEvents = useGlobalEventController(cleanups);

  const {
    isFullscreen,
    isPLaying,
    progress,
    bufferProgress,
    showControls,
    volume,
    handle,
    capturer,
    controls,
    publicController,
  } = usePlaybackControls(
    () => videoElem,
    () => ncplayerElem,
    globalEvents,
    controlsTimeout,
    persistentVolume,
    swipeControlRange,
    globalKeyListener,
    keySeekDuration,
  );

  const videoElem = (
    <video
      class="main-player"
      controls={false}
      onplay={handle.play}
      onpause={handle.pause}
      ontimeupdate={handle.timeUpdate}
      onprogress={handle.progress}
      autoplay={props.autoplay}
      muted={props.muted}
      poster={props.poster}
      preload={props.preload}
      loop={props.loop}
      volume={volume}
      src={sources.derive((s) => {
        return typeof s === "string" ? s : undefined;
      })}
      width={sig.derive(props.width, isFullscreen, (w, fs) => {
        if (!fs) {
          return w;
        }
      })}
      height={sig.derive(props.height, isFullscreen, (h, fs) => {
        if (!fs) {
          return h;
        }
      })}
    >
      {VideoSources({ sources })}
      {VideoSubTracks({ subtitles })}
    </video>
  ) as HTMLVideoElement;

  const controlsElems = [
    <StartButton
      video={videoElem}
      playing={isPLaying}
    />,
    <VideoTrack
      video={videoElem}
      progress={progress}
      bufferProgress={bufferProgress}
      preview={preview}
      previewWidth={props.previewWidth}
      previewHeight={props.previewHeight}
      previewUpdateThrottle={previewUpdateThrottle}
      globalEvents={globalEvents}
      onSeek={(newProgress) => {
        controls.seekProgress(newProgress);
      }}
    />,
    <TimeDisplay
      progress={progress}
      isVisible={showControls}
      videoElement={videoElem}
    />,
    <VolumeControl
      volume={volume}
      onVolumeChange={(v) => controls.setVolume(v)}
      onVolumeToggle={() => controls.toggleMute()}
      globalEvents={globalEvents}
    />,
    <SubtitleSelect
      subtitles={subtitles}
      showControls={showControls}
      videoElem={videoElem}
      globalEvents={globalEvents}
      addCleanup={c => cleanups.push(c)}
    />,
    <FullscreenButton
      isFullscreen={isFullscreen}
      onPress={() => controls.toggleFullscreen()}
    />,
  ];

  const ncplayerElem = (
    <div
      class={{
        ncplayer: true,
        fullscreen: isFullscreen,
        "hide-cursor": sig.not(showControls),
      }}
      onmousemove={handle.mouseMove}
      onmouseleave={handle.mouseLeave}
    >
      {styles.derive(s => {
        if (s === false) return <></>;
        if (typeof s === "string") {
          return <style>{s}</style>;
        }
        return <style>{defaultStylesheet}</style>;
      })}
      {videoElem}
      <div
        class="event-capturer"
        draggable={false}
        ontouchstart={capturer.touchstart}
        ontouchmove={capturer.touchmove}
        ontouchend={capturer.touchend}
        ontouchcancel={capturer.touchend}
        onpointerup={capturer.pointerUp}
        oncontextmenu={stopEvent}
        tabIndex={1}
        role="button"
      />
      <div
        class={{
          controls: true,
          visible: showControls,
          playing: isPLaying,
        }}
      >
        {customControls.derive(customControls => {
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
      videoElem.addEventListener(event, listener);
      cleanups.push(() => {
        videoElem.removeEventListener(event, listener);
      });
    }
  }

  function dispose() {
    for (const cleanup of cleanups) {
      cleanup();
    }
    ncplayerElem.remove();
  }

  Object.defineProperty(ncplayerElem, "dispose", {
    value: dispose,
  });

  Object.defineProperty(ncplayerElem, "controller", {
    value: publicController,
  });

  return ncplayerElem as HTMLDivElement & {
    /**
     * Disposes of the player, removing all event listeners and cleaning up
     * any resources.
     */
    dispose(): void;
    controller: PlayerController;
  };
}
