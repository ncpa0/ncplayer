# ncplayer

### Usage

```ts
import { NCPlayer, sig } from "ncplayer";

const source = sig("./video.mp4");
const previewSource = sig("./preview.mp4");
const poster = sig("./poster.jpg");

// each prop can be either a raw value or a signal
const player = NCPlayer({
  source: source,
  preview: previewSource,
  poster: poster,
  preload: "metadata",
  width: 640,
  height: 360,
});

document.body.appendChild(player);

function changeSource() {
  source.dispatch("./video2.mp4");
  previewSource.dispatch("./preview2.mp4");
  poster.dispatch("./poster2.jpg");
}

// controll the player
player.controller.isReady();
player.controller.play();
player.controller.pause();
player.controller.seek(60);
player.controller.setVolume(0.5);
player.controller.toggleFullscreen();
player.controller.toggleMute();
player.controller.reset();
player.controller.video(); // returns the inner video element
player.controller.on("play", e => {});
player.controller.once("timeupdate", e => {});
player.controller.selectSubtitleTrack("sub-track-id");

// destroy the player and unbind all event listeners
player.dispose();
```

### UI Elements size

The size of all UI elements of the NCPlayer can be controlled by setting the CSS `font-size` of the root element (`.ncplayer`). Font size however does not affect the width or height of the player itself. To control the dimensions of the player doing so via either the `width` and `height` props or CSS rules on the inner `<video>` tag is recommended (ex. `.ncplayer video.main-player { width: 16em; }`.)

### Properties

Most properties can be provided to the NCPlayer as either a value of the supported type, or a signal containing a value of that same type. (ex. `width` can be either a `number` or a `Signal<number>`)

| Property Name         | Type                           | Description                                                                                                                                                                                                                                     | Default Value                                                                                                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| sources               | `string \| Array<VideoSource>` | URL(s) of the video to play. If provided multiple sources, the player will allow the user to select the source.                                                                                                                                 |                                                                                                                                            |
| preview               | `string`                       | URL of the video to use as the preview. Preview will be displayed above the progress bar as the user hovers over it.                                                                                                                            | `undefined`                                                                                                                                |
| subtitles             | `Array<SubtitleTrack>`         | Array of subtitle tracks to allow user to select. See [SubtitleTrack definition here](#subtitletrack).                                                                                                                                          | `[]`                                                                                                                                       |
| width                 | `number`                       | Width of the player when not in the fullscreen mode.                                                                                                                                                                                            | `undefined`                                                                                                                                |
| height                | `number`                       | Height of the player when not in the fullscreen mode.                                                                                                                                                                                           | `undefined`                                                                                                                                |
| previewWidth          | `number`                       | Width of the preview video.                                                                                                                                                                                                                     | `320`                                                                                                                                      |
| previewHeight         | `number`                       | Height of the preview video.                                                                                                                                                                                                                    | `undefined`                                                                                                                                |
| previewUpdateThrottle | `number`                       | Determines how often the preview video timestamp should be updated as the user hovers over the progress bar.                                                                                                                                    | `250` (ms)                                                                                                                                 |
| controlsTimeout       | `number`                       | Time in milliseconds after which the controls should be hidden.                                                                                                                                                                                 | `1000` (ms)                                                                                                                                |
| swipeControlRange     | `number`                       | Maximum time range (in ms) it's possible to seek forward or backward by swiping on a mobile device.                                                                                                                                             | `60_000` (ms)                                                                                                                              |
| persistentVolume      | `boolean`                      | Whether the player volume should persist between reloads.                                                                                                                                                                                       | `false`                                                                                                                                    |
| persistentSubSettings | `boolean`                      | Whether the player subtitle settings should persist between reloads.                                                                                                                                                                            | `false`                                                                                                                                    |
| autoplay              | `boolean`                      | Whether the video should start playing as soon as it is ready. (same as the native `<video>` property)                                                                                                                                          | `false`                                                                                                                                    |
| muted                 | `boolean`                      | Whether the video should be muted. (same as the native `<video>` property)                                                                                                                                                                      | `false`                                                                                                                                    |
| poster                | `string`                       | URL of the image to use as the poster. (same as the native `<video>` property)                                                                                                                                                                  | `undefined`                                                                                                                                |
| preload               | `string`                       | Whether the video should be preloaded. Possible values are `none`, `metadata` and `auto`. (same as the native `<video>` property)                                                                                                               | `undefined`                                                                                                                                |
| loop                  | `boolean`                      | Whether the video should loop. (same as the native `<video>` property)                                                                                                                                                                          | `false`                                                                                                                                    |
| styles                | `false \| string`              | When set to `false`, no styles will be added to the DOM, resulting in the unstyled player. (you will need to add styles yourself). When given a string, that string will be inserted into the DOM as a style tag instead of the default styles. | `undefined`                                                                                                                                |
| keySeekDuration       | `number`                       | The duration in seconds that the player should seek when the user presses the left or right arrow keys.                                                                                                                                         | `5`                                                                                                                                        |
| globalKeyListener     | `boolean`                      | By default player will listen to all key events that don't have an interactable target. If set to false only events with a target within the player will be listened to.                                                                        | `true`                                                                                                                                     |
| customControls        | `CustomControlButton[]`        | Custom control elements that will be displayed on the bottom bar. Each custom element will be inserted into the bar at the specified index.                                                                                                     | `undefined`                                                                                                                                |
| on                    | `PlayerEvents`                 | Dictionary of event listeners to add to the player on mount.                                                                                                                                                                                    | `undefined`                                                                                                                                |
| scrollSeeking         | `"off" \| "all" \| "track"`    | Enable or not seeking via mouse wheel scrolling. `all` wil seek on any scroll anywhere inside the player, `track` will only seek when scrolling with mouse over the timeline track.                                                             | `undefined`                                                                                                                                |
| scrollSeekDuration    | `number`                       | The duration in seconds that the player should seek when the user scrolls the mouse wheel.                                                                                                                                                      | `5`                                                                                                                                        |
| customSubtitleDisplay | `boolean`                      | When enabled NCPlayer will display subtitles using it's own custom implementation instead of the native browser one. Allowing for modifying the subs font, color, size etc. etc.                                                                | `false`                                                                                                                                    |
| defaultSubSettings    | `SubtitleSettings`             | Only applicable when `customSubtitleDisplay` is true. The default settings the player will use.                                                                                                                                                 | `{ fontFamily: "Verdana", fontSize: 3, outlineColor: "#ffffff", outlineSize: 0.06, padding: 1, textColor: "#000000", forceNative: false }` |

```ts
type VideoSource = {
  id?: string;
  src: string;
  type: string;
  label: string;
};

type SubtitleTrack = {
  id: string;
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
};

type SubtitleSettings = {
  fontFamily?: string;
  fontSize?: number;
  forceNative?: boolean;
  outlineColor?: string;
  outlineSize?: number;
  padding?: number;
  textColor?: string;
};

type CustomControlButton = {
  index: number;
  content: string | Element;
  class?: string;
  onClick?: () => void;
};

type PlayerEvents = {
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
```
