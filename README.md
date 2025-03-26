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
player.controller.play();
player.controller.pause();
player.controller.seek(60);
player.controller.setVolume(0.5);
player.controller.toggleFullscreen();
player.controller.toggleMute();
player.controller.reset();
player.controller.video(); // returns the inner video element

// destroy the player and unbind all event listeners
player.dispose();
```

### UI Elements size

The size of all UI elements of the NCPlayer can be controlled by setting the CSS `font-size` of the root element (`.ncplayer`). Font size however does not affect the width or height of the player itself. To control the dimensions of the player doing so via either the `width` and `height` props or CSS rules on the inner `<video>` tag is recommended (ex. `.ncplayer video.main-player { width: 16em; }`.)

### Properties

All properties, except for `dismounter`, can be provided to the NCPlayer as either a value of the supported type, or a signal containing a value of that same type. (ex. `width` can be either a `number` or a `Signal<number>`)

| Property Name         | Type                   | Description                                                                                                                                                                                                                                     | Default Value                                                                                                   |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| sources               | `string \| Array<VideoSource>` | URL(s) of the video to play. If provided multiple sources, the player will allow the user to select the source. |
| preview               | `string`               | URL of the video to use as the preview. Preview will be displayed above the progress bar as the user hovers over it.                                                                                                                            | `undefined`                                                                                                     |
| subtitles             | `Array<SubtitleTrack>` | Array of subtitle tracks to allow user to select. See [SubtitleTrack definition here](#subtitletrack).                                                                                                                                          | `[]`                                                                                                            |
| width                 | `number`               | Width of the player when not in the fullscreen mode.                                                                                                                                                                                            | `undefined`                                                                                                     |
| height                | `number`               | Height of the player when not in the fullscreen mode.                                                                                                                                                                                           | `undefined`                                                                                                     |
| previewWidth          | `number`               | Width of the preview video.                                                                                                                                                                                                                     | `320`                                                                                                           |
| previewHeight         | `number`               | Height of the preview video.                                                                                                                                                                                                                    | `undefined`                                                                                                     |
| previewUpdateThrottle | `number`               | Determines how often the preview video timestamp should be updated as the user hovers over the progress bar.                                                                                                                                    | `250` (ms)                                                                                                      |
| controlsTimeout       | `number`               | Time in milliseconds after which the controls should be hidden.                                                                                                                                                                                 | `1000` (ms)                                                                                                     |
| swipeControlRange     | `number`               | Maximum time range (in ms) it's possible to seek forward or backward by swiping on a mobile device.                                                                                                                                             | `60_000` (ms)                                                                                                   |
| persistentVolume      | `boolean`              | Whether the player volume should persist between reloads.                                                                                                                                                                                       | `false`                                                                                                         |
| autoplay              | `boolean`              | Whether the video should start playing as soon as it is ready. (same as the native `<video>` property)                                                                                                                                          | `false`                                                                                                         |
| muted                 | `boolean`              | Whether the video should be muted. (same as the native `<video>` property)                                                                                                                                                                      | `false`                                                                                                         |
| poster                | `string`               | URL of the image to use as the poster. (same as the native `<video>` property)                                                                                                                                                                  | `undefined`                                                                                                     |
| preload               | `string`               | Whether the video should be preloaded. Possible values are `none`, `metadata` and `auto`. (same as the native `<video>` property)                                                                                                               | `undefined`                                                                                                     |
| loop                  | `boolean`              | Whether the video should loop. (same as the native `<video>` property)                                                                                                                                                                          | `false`                                                                                                         |
| styles                | `false \| string`      | When set to `false`, no styles will be added to the DOM, resulting in the unstyled player. (you will need to add styles yourself). When given a string, that string will be inserted into the DOM as a style tag instead of the default styles. | `undefined`                                                                                                     |
| keySeekDuration       | `number`               | The duration in seconds that the player should seek when the user presses the left or right arrow keys.                                                                                                                                         | `5`                                                                                                             |
| globalKeyListener     | `boolean`              | By default player will listen to all key events that don't have an interactable target. If set to false only events with a target within the player will be listened to.                                                                        | `true`                                                                                                          |

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
```
