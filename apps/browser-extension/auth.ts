export type SpeakingLookSession = {
  userId: string;
};

export function localSession(): SpeakingLookSession {
  return { userId: "local_user" };
}
