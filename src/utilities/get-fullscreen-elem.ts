export function getFullScreenElement() {
  return (document.fullscreenElement
    || (document as any).webkitIsFullScreen
    || (document as any).mozFullScreen
    || (document as any).msFullscreenElement) as HTMLElement;
}
