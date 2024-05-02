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
```

### Properties

All properties, except for `dismounter`, can be provided to the NCPlayer as either a value of the supported type, or a signal containing a value of that same type. (ex. `width` can be either a `number` or a `Signal<number>`)

| Property Name         | Type                   | Description                                                                                                                                                                                                                                     | Default Value |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| source                | `string`               | URL(s) of the video to play. If provided multiple sources, the player will allow the user to select the source.                                                                                                                                 | `undefined`   |
| preview               | `string`               | URL of the video to use as the preview. Preview will be displayed above the progress bar as the user hovers over it.                                                                                                                            | `undefined`   |
| subtitles             | `Array<SubtitleTrack>` | Array of subtitle tracks to allow user to select. See [SubtitleTrack definition here](#subtitletrack).                                                                                                                                          | `[]`          |
| width                 | `number`               | Width of the player when not in the fullscreen mode.                                                                                                                                                                                            | `undefined`   |
| height                | `number`               | Height of the player when not in the fullscreen mode.                                                                                                                                                                                           | `undefined`   |
| previewWidth          | `number`               | Width of the preview video.                                                                                                                                                                                                                     | `320`         |
| previewHeight         | `number`               | Height of the preview video.                                                                                                                                                                                                                    | `undefined`   |
| previewUpdateThrottle | `number`               | Determines how often the preview video timestamp should be updated as the user hovers over the progress bar.                                                                                                                                    | `250` (ms)    |
| controlsTimeout       | `number`               | Time in milliseconds after which the controls should be hidden.                                                                                                                                                                                 | `1000` (ms)   |
| swipeControlRange     | `number`               | Maximum time range (in ms) it's possible to seek forward or backward by swiping on a mobile device.                                                                                                                                             | `60_000` (ms) |
| persistentVolume      | `boolean`              | Whether the player volume should persist between reloads.                                                                                                                                                                                       | `false`       |
| autoplay              | `boolean`              | Whether the video should start playing as soon as it is ready. (same as the native `<video>` property)                                                                                                                                          | `false`       |
| muted                 | `boolean`              | Whether the video should be muted. (same as the native `<video>` property)                                                                                                                                                                      | `false`       |
| poster                | `string`               | URL of the image to use as the poster. (same as the native `<video>` property)                                                                                                                                                                  | `undefined`   |
| preload               | `string`               | Whether the video should be preloaded. Possible values are `none`, `metadata` and `auto`. (same as the native `<video>` property)                                                                                                               | `undefined`   |
| loop                  | `boolean`              | Whether the video should loop. (same as the native `<video>` property)                                                                                                                                                                          | `false`       |
| styles                | `false \| string`      | When set to `false`, no styles will be added to the DOM, resulting in the unstyled player. (you will need to add styles yourself). When given a string, that string will be inserted into the DOM as a style tag instead of the default styles. | `undefined`   |
| dismounter            | `Dismounter`           | An interface that should expose a `ondismount` method that registers a listener. NCPlayer will register teardown callbacks to this interface. See [Dismounter definition here](#dismounter).                                                    | `undefined`   |

#### SubtitleTrack

```ts
type SubtitleTrack = {
  id: string;
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
};
```

#### Dismounter

```ts
type Dismounter = {
  ondismount(fn: Function): void;
};
```
