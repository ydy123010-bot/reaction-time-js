export function formatMilliseconds(value) {
  return `${Math.round(value)} ms`;
}

export function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}
