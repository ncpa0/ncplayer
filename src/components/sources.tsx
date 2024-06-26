import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { VideoSource } from "../player.component";

export type VideoSourceProps = {
  sources: ReadonlySignal<string | Array<VideoSource> | undefined>;
};

export function VideoSources(props: VideoSourceProps) {
  return props.sources.derive((s) => {
    if (Array.isArray(s)) {
      return s.map((t) => <source id={t.id} src={t.src} type={t.type} />);
    }
    return null;
  });
}
