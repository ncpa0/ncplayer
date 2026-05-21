import throttle from "lodash.throttle";
import { NCPlayerContext } from "../player";
import { clamp } from "../utilities/math";

const INTERACTABLE_TAGS = ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "OPTION"];

export class EventCapturer {
  swipeStartCurrentTime = 0;
  swipeStartTs = 0;
  lastPointerUpTs = 0;
  isSwiping = false;
  initX = 0;

  constructor(
    protected context: NCPlayerContext,
  ) {
    context.globalEvent.on(
      "keydown",
      e => this.handleKeyDown(e as KeyboardEvent),
      "document",
    );
  }

  get controls() {
    return this.context.controls;
  }

  handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (this.context.props.globalKeyListener.get() === false) {
      if (!target.closest(".ncplayer")) {
        return;
      }
    } else {
      if (INTERACTABLE_TAGS.includes(target.tagName)) {
        return;
      }
    }

    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    switch (e.key) {
      case "ArrowLeft": {
        this.controls.showControls.dispatch(true);
        this.controls.startHideTimeout();
        this.controls.seekBackward(
          this.context.props.keySeekDuration.get() ?? 5,
        );
        break;
      }
      case "ArrowRight": {
        this.controls.showControls.dispatch(true);
        this.controls.startHideTimeout();
        this.controls.seekForward(
          this.context.props.keySeekDuration.get() ?? 5,
        );
        break;
      }
      case "m": {
        this.controls.showControls.dispatch(true);
        this.controls.startHideTimeout();
        this.controls.toggleMute();
        break;
      }
      case "f": {
        this.controls.showControls.dispatch(true);
        this.controls.startHideTimeout();
        this.controls.toggleFullscreen();
        break;
      }
      case " ":
      case "k":
        this.controls.togglePlay();
        break;
    }
  }

  handleCapturePointerUp(e: PointerEvent) {
    const now = Date.now();
    if (now - this.lastPointerUpTs < 200) {
      this.controls.toggleFullscreen();
    }
    this.lastPointerUpTs = now;

    if (this.isSwiping) {
      return;
    }

    const isRmb = e.button === 2;
    if (!isRmb) {
      this.controls.togglePlay();
    }
  }

  handleCaptureTouchStart(e: TouchEvent) {
    this.isSwiping = true;
    this.swipeStartTs = Date.now();
    this.swipeStartCurrentTime = this.context.video.currentTime;

    const target = e.target as HTMLElement;
    const targetRect = target.getBoundingClientRect();
    if (e.touches.length === 0) {
      this.initX = targetRect.width / 2;
    } else {
      this.initX = e.touches[0]!.clientX - targetRect.left;
    }

    this.controls.showControls.dispatch(true);
    clearTimeout(this.controls.lastTimeout);
  }

  handleCaptureTouchEnd(e: TouchEvent) {
    this.isSwiping = false;

    if (Date.now() - this.swipeStartTs < 200) {
      this.controls.togglePlay();
    }

    this.controls.startHideTimeout();
  }

  handleCaptureTouchMove = throttle(
    (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 0) {
        return;
      }

      // calculate pointer x position relative to the target
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const touchX = e.touches[0]!.clientX - rect.left;
      const relToInit = touchX - this.initX;
      const relToInitMax = rect.width - 32 - this.initX;
      const relToInitMin = -this.initX;

      const percentToMove = relToInit >= 0
        ? relToInit / relToInitMax
        : -1 * relToInit / relToInitMin;

      // calculate new time based on touching position
      const videoElem = this.context.video;
      const timeRange =
        (this.context.props.swipeControlRange.get() ?? 60 * 1000) / 1000;
      const minT = Math.max(0, this.swipeStartCurrentTime - timeRange);
      const maxT = Math.min(
        videoElem.duration,
        this.swipeStartCurrentTime + timeRange,
      );
      const deltaT = percentToMove * timeRange;
      const newTime = clamp(deltaT + this.swipeStartCurrentTime, minT, maxT);

      videoElem.currentTime = newTime;
      this.controls.progress.dispatch(newTime / videoElem.duration);
    },
    50,
    { leading: true, trailing: true },
  );

  handleCaptureWheel(e: WheelEvent) {
    if (this.context.props.scrollSeeking.get() === "all") {
      e.preventDefault();
      if (e.deltaY > 0) {
        this.controls.wheelScrollBackward();
      } else if (e.deltaY < 0) {
        this.controls.wheelScrollForward();
      }
    }
  }
}
