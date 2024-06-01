import { MaybeReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { FullscreenButton } from "./components/fullscreen-button";
import { VideoSources } from "./components/sources";
import { StartButton } from "./components/start-button";
import { VideoSubTracks } from "./components/sub-tracks";
import { SubtitleSelect } from "./components/subtitle-select";
import { TimeDisplay } from "./components/time-display";
import { VideoTrack } from "./components/video-track";
import { VolumeControl } from "./components/volume-control";
import { useFullscreenController } from "./hooks/fullscreen-controller";
import { usePlaybackControls } from "./hooks/playback-controls";
import defaultStylesheet from "./player.styles.css";
import { signalize } from "./utilities/signalize";
import { stopEvent } from "./utilities/stop-event";

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
   * An interface that should expose a `ondismount` method that registers
   * a listener. NCPlayer will register teardown callbacks to this interface.
   */
  dismounter?: Dismounter;
};

export function NCPlayer({ dismounter, ...rawProps }: PlayerProps) {
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
  } = props;

  const {
    isPLaying,
    progress,
    bufferProgress,
    showControls,
    volume,
    handle,
    capturer,
  } = usePlaybackControls(
    () => videoElem,
    controlsTimeout,
    persistentVolume,
    swipeControlRange,
  );

  const { isFullscreen, handleFullscreenBtnClick } = useFullscreenController(
    () => ncplayerElem,
    dismounter,
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

  const ncplayerElem = (
    <div
      class={{
        ncplayer: true,
        fullscreen: isFullscreen,
        "hide-cursor": showControls.derive((show) => !show),
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
      />
      <div
        class={{
          controls: true,
          visible: showControls,
          playing: isPLaying,
        }}
      >
        <StartButton
          video={videoElem}
          playing={isPLaying}
        />
        <VideoTrack
          video={videoElem}
          progress={progress}
          bufferProgress={bufferProgress}
          preview={preview}
          previewWidth={props.previewWidth}
          previewHeight={props.previewHeight}
          previewUpdateThrottle={previewUpdateThrottle}
          dismounter={dismounter}
          onSeek={(newProgress) => {
            if (Number.isNaN(videoElem.duration)) {
              return;
            }

            const newTime = videoElem.duration * newProgress;
            videoElem.currentTime = newTime;
            progress.dispatch(newProgress);
          }}
        />
        <TimeDisplay
          progress={progress}
          isVisible={showControls}
          videoElement={videoElem}
        />
        <VolumeControl
          volume={volume}
          onVolumeChange={handle.volumeChange}
        />
        <SubtitleSelect
          subtitles={subtitles}
          showControls={showControls}
          videoElem={videoElem}
          dismounter={dismounter}
        />
        <FullscreenButton
          isFullscreen={isFullscreen}
          onPress={handleFullscreenBtnClick}
        />
      </div>
    </div>
  ) as HTMLDivElement;

  return ncplayerElem;
}
