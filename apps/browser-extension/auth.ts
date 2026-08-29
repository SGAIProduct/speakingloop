export type SpeakLoopSession = {
  userId: string;
};

export function localSession(): SpeakLoopSession {
  return { userId: "local_user" };
}
