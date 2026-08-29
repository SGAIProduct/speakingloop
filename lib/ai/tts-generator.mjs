import { getCachedAudio, setCachedAudio } from "./audio-cache.mjs";

export async function generateTTSWithCache(input, synthesize) {
  const cached = getCachedAudio(input);
  if (cached) {
    return { ...cached, cached: true };
  }
  const result = await synthesize(input);
  return setCachedAudio(input, { ...result, cached: false });
}
