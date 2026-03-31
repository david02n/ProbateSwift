import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  COOKIE_SETTINGS_EVENT,
  type CookieConsentChoice,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsentChoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());

    const handleOpenSettings = () => {
      setSettingsOpen(true);
    };

    window.addEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings);
  }, []);

  const saveChoice = (choice: CookieConsentChoice) => {
    writeCookieConsent(choice);
    setConsent(choice);
    setSettingsOpen(false);
  };

  return (
    <>
      {!consent && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-slate-900">Cookie settings</p>
              <p className="text-sm text-slate-600">
                We use strictly necessary cookies for security, sign-in, and storing your
                cookie preference. Analytics and other non-essential tracking stay off for now.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                Manage preferences
              </Button>
              <Button variant="outline" onClick={() => saveChoice("rejected")}>
                Reject
              </Button>
              <Button onClick={() => saveChoice("accepted")}>Accept</Button>
            </div>
          </div>
        </div>
      )}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie settings</DialogTitle>
            <DialogDescription>
              ProbateSwift currently uses only strictly necessary cookies for security,
              authentication, and storing your cookie preference. Analytics and other
              non-essential cookies remain disabled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Strictly necessary cookies</p>
              <p>Always on. Used for security, authentication, and your saved cookie setting.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium text-slate-900">Analytics and performance cookies</p>
              <p>Disabled for this release until they are wired behind explicit consent.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => saveChoice("rejected")}>
              Reject non-essential cookies
            </Button>
            <Button onClick={() => saveChoice("accepted")}>Accept necessary setup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
