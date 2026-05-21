import { NCPlayerContext } from "../player";
import { PlayerEvents } from "../player.component";

export class NCPlayerPublicInterface {
  constructor(
    protected context: NCPlayerContext,
  ) {}

  isReady() {
    return !Number.isNaN(this.context.video.duration);
  }

  play() {
    this.context.video.play();
  }

  pause() {
    this.context.video.pause();
  }

  seek(t: number) {
    this.context.controls.seek(t);
  }

  setVolume(v: number) {
    this.context.controls.setVolume(v);
  }

  toggleFullscreen() {
    this.context.controls.toggleFullscreen();
  }

  toggleMute() {
    this.context.controls.toggleMute();
  }

  reset() {
    const videoElem = this.context.video;
    videoElem.pause();
    videoElem.currentTime = 0;
    this.context.controls.progress.dispatch(0);
    this.context.controls.bufferProgress.dispatch(0);
    this.context.controls.isPLaying.dispatch(false);
  }

  video() {
    return this.context.video;
  }

  on<E extends keyof PlayerEvents>(event: E, listener: PlayerEvents[E]) {
    const elem = this.context.video;
    elem.addEventListener(event as string, listener as EventListener);
    const remove = () =>
      elem.removeEventListener(event as string, listener as EventListener);

    this.context.cleanup(remove);

    return remove;
  }

  once<E extends keyof PlayerEvents>(event: E, listener: PlayerEvents[E]) {
    const elem = this.context.video;
    elem.addEventListener(event as string, listener as EventListener, {
      once: true,
    });
    const remove = () =>
      elem.removeEventListener(event as string, listener as EventListener);

    this.context.cleanup(remove);

    return remove;
  }

  selectSubtitleTrack(trackID: string | undefined) {
    this.context.subtitles.selectSubtitleTrack(trackID);
  }
}
