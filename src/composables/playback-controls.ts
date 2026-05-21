import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { NCPlayerContext } from "../player";
import { callLimit } from "../utilities/call-limit";
import { getFullScreenElement } from "../utilities/get-fullscreen-elem";
import { clamp } from "../utilities/math";
import { EventCapturer } from "./event-capturer";
import { LocalSignal, LocalValue } from "./local-value";

const SCROLL_SEEK_DELAY = 250;

export class PlaybackControls {
  readonly volume;
  readonly bufferProgress = sig(0);
  readonly progress = sig(0);
  readonly isPLaying = sig(false);
  readonly showControls = sig(true);
  readonly isFullscreen = sig(false);
  lastTimeout: number | undefined;
  private readonly lastKnownVolumeBeforeMute = new LocalValue(
    "ncplayer-last-volume",
    1,
  );
  private trackMouseEnteredAt = -1;
  capturer;

  constructor(
    protected context: NCPlayerContext,
  ) {
    this.capturer = new EventCapturer(context);

    this.volume = new LocalSignal("ncplayer-volume", 1, {
      enabled: this.context.props.persistentVolume,
    });

    context.globalEvent.on(
      "webkitfullscreenchange",
      () => this.handleFullscreenToggle(),
      "document",
    );
    context.globalEvent.on(
      "mozfullscreenchange",
      () => this.handleFullscreenToggle(),
      "document",
    );
    context.globalEvent.on(
      "MSFullscreenChange",
      () => this.handleFullscreenToggle(),
      "document",
    );
    context.globalEvent.on(
      "fullscreenchange",
      () => this.handleFullscreenToggle(),
      "document",
    );
  }

  private handleFullscreenToggle() {
    if (getFullScreenElement() == null) {
      this.isFullscreen.dispatch(false);
    } else {
      this.isFullscreen.dispatch(true);
    }
  }

  toggleFullscreen() {
    if (this.isFullscreen.get()) {
      document.exitFullscreen();
    } else {
      this.context.element
        .requestFullscreen()
        .catch(() => {
          console.warn("Fullscreen request was denied.");
        });
    }
  }

  togglePlay() {
    const videoElem = this.context.video;
    if (videoElem.paused) {
      videoElem.play();
    } else {
      videoElem.pause();
    }
  }

  seek(t: number) {
    const videoElem = this.context.video;
    if (Number.isNaN(videoElem.duration)) {
      return;
    }

    const newCurrent = clamp(t, 0, videoElem.duration);
    const newProgress = newCurrent / videoElem.duration;

    videoElem.currentTime = newCurrent;
    this.progress.dispatch(newProgress);
  }

  seekProgress(p: number) {
    const videoElem = this.context.video;
    if (Number.isNaN(videoElem.duration)) {
      return;
    }

    const newCurrent = clamp(p * videoElem.duration, 0, videoElem.duration);

    videoElem.currentTime = newCurrent;
    this.progress.dispatch(p);
  }

  seekForward(t: number) {
    const videoElem = this.context.video;
    if (Number.isNaN(videoElem.duration)) {
      return;
    }

    this.seek(videoElem.currentTime + t);
  }

  seekBackward(t: number) {
    const videoElem = this.context.video;
    if (Number.isNaN(videoElem.duration)) {
      return;
    }

    this.seek(videoElem.currentTime - t);
  }

  setVolume(v: number) {
    v = clamp(v, 0, 1);
    this.volume.set(v);
  }

  toggleMute() {
    const videoElem = this.context.video;
    if (videoElem.volume === 0) {
      this.setVolume(this.lastKnownVolumeBeforeMute.get());
    } else {
      this.lastKnownVolumeBeforeMute.set(videoElem.volume);
      this.setVolume(0);
    }
  }

  startHideTimeout(e?: MouseEvent) {
    if (this.lastTimeout) {
      clearTimeout(this.lastTimeout);
    }

    if (
      !e || (e.target instanceof HTMLElement && !e.target.closest(".controls"))
    ) {
      this.lastTimeout = window.setTimeout(() => {
        if (this.isPLaying.get()) {
          this.showControls.dispatch(false);
        }
        this.lastTimeout = undefined;
      }, this.context.props.controlsTimeout?.get() ?? 1000);
    }
  }

  handleMouseMove(e: MouseEvent) {
    this.showControls.dispatch(true);
    this.startHideTimeout(e);
  }

  handlePlay(e: Event) {
    const elem = e.target as HTMLVideoElement;
    this.isPLaying.dispatch(true);
    this.progress.dispatch(elem.currentTime / elem.duration);
    this.startHideTimeout();
  }

  handlePause(e: Event) {
    const elem = e.target as HTMLVideoElement;
    this.isPLaying.dispatch(false);
    this.progress.dispatch(elem.currentTime / elem.duration);
    this.showControls.dispatch(true);
  }

  handleTimeUpdate(e: Event) {
    const elem = e.target as HTMLVideoElement;
    if (elem.duration) {
      this.progress.dispatch(elem.currentTime / elem.duration);
    }
  }

  handleProgress(e: Event & { target: HTMLVideoElement }) {
    const elem = e.target;
    if (elem.buffered.length > 0 && !Number.isNaN(elem.duration)) {
      // find buffered range that's closest to the current time
      let buffered = 0;
      for (let i = 0; i < elem.buffered.length; i++) {
        const buffStart = elem.buffered.start(i);
        const buffEnd = elem.buffered.end(i);
        if (
          (buffStart - 16) <= elem.currentTime
          && elem.currentTime <= buffEnd
        ) {
          buffered = buffEnd;
          break;
        }
      }
      this.bufferProgress.dispatch(buffered / elem.duration);
    }
  }

  handleMouseLeave() {
    if (this.isPLaying.get()) {
      this.showControls.dispatch(false);
    }
  }

  handleTrackMouseEnter() {
    if (this.context.props.scrollSeeking.get() === "track") {
      this.trackMouseEnteredAt = Date.now();
    }
  }

  handleTrackMouseLeave() {
    this.trackMouseEnteredAt = -1;
  }

  handleTrackWheel(e: WheelEvent) {
    if (this.context.props.scrollSeeking.get() === "track") {
      if (
        this.trackMouseEnteredAt > 0
        && Date.now() - this.trackMouseEnteredAt > SCROLL_SEEK_DELAY
      ) {
        e.preventDefault();
        if (e.deltaY > 0) {
          this.wheelScrollBackward();
        } else if (e.deltaY < 0) {
          this.wheelScrollForward();
        }
      }
    }
  }

  wheelScrollForward = callLimit(
    () => {
      this.seekForward(
        this.context.props.scrollSeekDuration.get() ?? 5,
      );
    },
    250,
  );

  wheelScrollBackward = callLimit(
    () => {
      this.seekBackward(
        this.context.props.scrollSeekDuration.get() ?? 5,
      );
    },
    250,
  );
}
