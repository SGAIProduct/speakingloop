import { createHash } from "node:crypto";

const cache = new Map();

export function audioCacheKey({ text, voice, accent, provider, model }) {
  return createHash("sha256")
    .update(JSON.stringify({ text, voice, accent, provider, model }))
    .digest("hex");
}

export function getCachedAudio(input) {
  return cache.get(audioCacheKey(input));
}

export function setCachedAudio(input, value) {
  cache.set(audioCacheKey(input), value);
  return value;
}
