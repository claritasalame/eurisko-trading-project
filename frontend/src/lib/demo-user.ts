import { createDemoSession } from "@/lib/api";

export const DEMO_USER_STORAGE_KEY = "eurisko-demo-user-id";

export async function getOrCreateDemoUserId(): Promise<string> {
  const storedUserId = window.localStorage.getItem(DEMO_USER_STORAGE_KEY);
  if (storedUserId) return storedUserId;

  const session = await createDemoSession();
  window.localStorage.setItem(DEMO_USER_STORAGE_KEY, session.user_id);
  return session.user_id;
}
