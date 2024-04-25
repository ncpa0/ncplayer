import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx";
import { SubtitleTrack } from "../player.component";

export type VideoTracksProps = {
  subtitles: ReadonlySignal<Array<SubtitleTrack> | undefined>;
};

export function VideoSubTracks(props: VideoTracksProps) {
  return props.subtitles.derive((s) => {
    if (Array.isArray(s)) {
      return (
        <>
          {s.map((t) => (
            <track
              id={t.id}
              src={t.src}
              srclang={t.srclang}
              label={t.label}
              default={t.default}
              kind="subtitles"
            >
            </track>
          ))}
        </>
      );
    }

    return null;
  });
}
