import { sig, Signal } from "@ncpa0cpl/vanilla-jsx";
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
import { useSubtrackController } from "./hooks/subtrack-controller";
import styles from "./player.styles.css";
import { mountStylesheet } from "./utilities/mount-stylesheet";
import { signalize } from "./utilities/signalize";

export type MaybeSignal<T> = T | Signal<T>;

export type VideoSource = {
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
  width?: MaybeSignal<number | undefined>;
  /**
   * Height of the video player.
   */
  height?: MaybeSignal<number | undefined>;
  /**
   * Whether the video should start playing as soon as it is ready.
   */
  autoplay?: MaybeSignal<boolean | undefined>;
  /**
   * Whether the video should be muted.
   */
  muted?: MaybeSignal<boolean | undefined>;
  /**
   * URL of the image to use as the poster.
   */
  poster?: MaybeSignal<string | undefined>;
  /**
   * The preload attribute for the video.
   */
  preload?: MaybeSignal<HTMLMediaElement["preload"] | undefined>;
  /**
   * Whether the video should be played in a loop.
   */
  loop?: MaybeSignal<boolean | undefined>;
  /**
   * URL(s) of the video to play. If provided multiple sources, the player
   * will allow the user to select the source.
   */
  sources?:
    | MaybeSignal<string | undefined>
    | MaybeSignal<Array<VideoSource> | undefined>;
  /**
   * Array of subtitle tracks to allow user to select.
   */
  subtitles?: MaybeSignal<Array<SubtitleTrack> | undefined>;
  /**
   * Time in milliseconds after which the controls should be hidden.
   */
  controlsTimeout?: MaybeSignal<number | undefined>;
  /**
   * URL of the video to use as the preview. Preview will be displayed above
   * the progress bar as the user hovers over it.
   */
  preview?: MaybeSignal<string | undefined>;
  /**
   * Determines how often the preview video timestamp should be updated as
   * the user hovers over the progress bar.
   */
  previewUpdateThrottle?: MaybeSignal<number | undefined>;
  /**
   * Width of the preview video.
   */
  previewWidth?: MaybeSignal<number | undefined>;
  /**
   * Height of the preview video.
   */
  previewHeight?: MaybeSignal<number | undefined>;
  /**
   * Whether the player volume should persist between reloads.
   */
  persistentVolume?: MaybeSignal<boolean | undefined>;
  /**
   * An interface that should expose a `ondismount` method that registers
   * a listener. NCPlayer will register teardown callbacks to this interface.
   */
  dismounter?: Dismounter;
};

export function NCPlayer({ dismounter, ...rawProps }: PlayerProps) {
  const props = signalize(rawProps);
  const {
    sources,
    subtitles,
    controlsTimeout,
    preview,
    previewUpdateThrottle,
    persistentVolume,
  } = props;
  const stylesheet = mountStylesheet(styles);
  dismounter?.ondismount(() => stylesheet.remove());

  const { isPLaying, progress, showControls, volume, handle } =
    usePlaybackControls(controlsTimeout, persistentVolume);

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
      ontimeupdate={handle.progress}
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

  const { handleSubTrackSelect } = useSubtrackController(
    videoElem,
    showControls,
    dismounter,
  );

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
      {videoElem}
      <div
        class="event-capturer"
        onclick={() => {
          if (videoElem.paused) {
            videoElem.play();
          } else {
            videoElem.pause();
          }
        }}
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
          onselect={handleSubTrackSelect}
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
