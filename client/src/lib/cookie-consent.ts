export const COOKIE_CONSENT_NAME = "probateswift_cookie_consent";
export const COOKIE_SETTINGS_EVENT = "probateswift:open-cookie-settings";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieConsentChoice = "accepted" | "rejected";

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_NAME}=`));

  if (!match) {
    return null;
  }

  const value = decodeURIComponent(match.split("=")[1] ?? "");
  return value === "accepted" || value === "rejected" ? value : null;
}

export function writeCookieConsent(value: CookieConsentChoice) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function openCookieSettings() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
}
