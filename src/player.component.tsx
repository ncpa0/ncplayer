import { MaybeReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { SUB_DEFAULTS } from "./composables/subtitle-settings";
import { NCPlayerContext } from "./player";
import defaultStylesheet from "./player.styles.css";

export { defaultStylesheet };

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
  subtitleSelect: (event: { selectedTrack: null | SubtitleTrack }) => void;
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
   * Whether the player subtitle settings should persist between reloads.
   */
  persistentSubSettings?: MaybeReadonlySignal<boolean | undefined>;
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
   * user presses the left or right arrow keys. (Default: 5 sec)
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
  /**
   * off - do not seek when scrolling
   * all - seek on a mouse wheel scroll anywhere within the player
   * track - seek on a mouse wheel scroll on the player's time track
   */
  scrollSeeking?: MaybeReadonlySignal<"off" | "all" | "track">;
  /**
   * The duration in seconds that the player should seek when the
   * user scrolls the mouse wheel. (Default: )
   */
  scrollSeekDuration?: MaybeReadonlySignal<number | undefined>;
  customSubtitleDisplay?: MaybeReadonlySignal<boolean | undefined>;
  defaultSubSettings?: Partial<typeof SUB_DEFAULTS>;
};

export function NCPlayer(
  props: PlayerProps,
) {
  const context = new NCPlayerContext(props);
  return context.playerElement();
}
