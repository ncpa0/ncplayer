export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function toPrecision(value: number, precision: number) {
  const pow = 10 ** precision;
  const int = Math.floor(value * pow);
  return Number(int) / pow;
}

export function changeWithStep(
  oldValue: number,
  newValue: number,
  step: number,
) {
  const diff = newValue - oldValue;
  const stepCount = Math.round(diff / step);

  return oldValue + stepCount * step;
}
