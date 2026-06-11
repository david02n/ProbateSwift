// A stable per-browser identifier used to tie an anonymous landing-assessment
// intake row to the eventual signed-in user (the claim-once flow, PS-1).
// Persisted in localStorage so the same browser keeps the same id across the
// assessment → signup hop.

const KEY = "ps_browser_session_id";

export function getBrowserSessionId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `bs_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode etc.) — fall back to an ephemeral id.
    return `bs_ephemeral_${Math.random().toString(36).slice(2)}`;
  }
}

/** Read the stored id without creating one (returns null if none exists yet). */
export function peekBrowserSessionId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
