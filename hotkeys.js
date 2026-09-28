export function isFpsShortcut(event = {}) {
  return event.code === "F3" && !event.repeat;
}
