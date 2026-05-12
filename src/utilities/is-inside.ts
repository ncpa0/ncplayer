export function isInside(target: EventTarget | null, selector: string) {
  if (target instanceof HTMLElement) {
    const parent = target.closest(selector);
    return !!parent;
  }
  if (target instanceof SVGElement) {
    const parent = target.closest(selector);
    return !!parent;
  }
  return false;
}
