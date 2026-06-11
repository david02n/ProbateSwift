import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import LandingView from "@/components/landing-relaunch/LandingView";
import AssessmentView from "@/components/landing-relaunch/AssessmentView";
import SecurityView from "@/components/landing-relaunch/SecurityView";

type Screen = "landing" | "assessment" | "security";

/**
 * ProbateSwift relaunch landing page (Hero B — calm / grief-sensitive).
 *
 * A self-contained, client-side three-view experience per the design handoff:
 * landing → free 5-question assessment → result, plus a security page. View
 * switching resets scroll to the top with no full page reloads. Good-fit
 * assessment results hand off to the real /auth flow; complex / no-probate
 * results capture an email via POST /api/leads.
 */
const RelaunchLanding: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [, navigate] = useLocation();

  const go = (next: Screen) => {
    setScreen(next);
    try {
      window.scrollTo(0, 0);
    } catch {
      /* noop */
    }
  };

  // The relaunch site uses Hanken Grotesk regardless of the surrounding app font.
  useEffect(() => {
    document.body.classList.add("font-hanken");
    return () => document.body.classList.remove("font-hanken");
  }, []);

  return (
    <div className="font-hanken min-h-screen bg-[#F6F0E7] text-[#1E2A33] antialiased">
      {screen === "landing" && (
        <LandingView
          onStartAssessment={() => go("assessment")}
          onGoSecurity={() => go("security")}
        />
      )}
      {screen === "assessment" && (
        <AssessmentView
          onGoLanding={() => go("landing")}
          onHandoffToAuth={() => navigate("/auth")}
        />
      )}
      {screen === "security" && (
        <SecurityView
          onGoLanding={() => go("landing")}
          onStartAssessment={() => go("assessment")}
        />
      )}
    </div>
  );
};

export default RelaunchLanding;
