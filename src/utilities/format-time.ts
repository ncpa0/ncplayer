export function formatTime(time: number): string {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  if (hours > 0) {
    const newTime = `${hours.toString().padStart(2, "0")}:${
      minutes.toString().padStart(2, "0")
    }:${seconds.toString().padStart(2, "0")}`;
    return newTime;
  } else {
    const newTime = `${minutes.toString().toString().padStart(2, "0")}:${
      seconds.toString().padStart(2, "0")
    }`;
    return newTime;
  }
}
