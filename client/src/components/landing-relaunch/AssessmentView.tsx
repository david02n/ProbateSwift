import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getBrowserSessionId } from "@/lib/browserSession";
import {
  visibleQuestions,
  computeOutcome,
  displayStateFor,
  leadResultType,
  resultCopy,
} from "./data";

interface AssessmentViewProps {
  onGoLanding: () => void;
  onHandoffToAuth: () => void;
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ onGoLanding, onHandoffToAuth }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conditional stepper: the visible set is recomputed from the current answers
  // so showIf branches (e.g. skip low-threshold assets when there's sole-name
  // property) are honoured.
  const visible = visibleQuestions(answers);
  const atResult = step >= visible.length;
  const currentQuestion = atResult ? null : visible[step];
  const progressPct =
    Math.round((Math.min(step, visible.length) / Math.max(visible.length, 1)) * 100) + "%";

  const outcome = computeOutcome(answers);
  const displayState = displayStateFor(outcome);
  const result = resultCopy[displayState];
  // The wrong-applicant route is a helper handoff, not a dead end.
  const applicantRole = displayState === "ineligible" ? "helper" : "applicant";

  function pick(option: { set: Record<string, any> }) {
    if (!currentQuestion) return;
    // Clear any keys this question can set before applying the chosen option,
    // so re-answering doesn't leave a stale value behind.
    const ownedKeys = new Set(currentQuestion.options.flatMap((o) => Object.keys(o.set)));
    setAnswers((prev) => {
      const next: Record<string, any> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!ownedKeys.has(k)) next[k] = v;
      }
      return { ...next, ...option.set };
    });
    setStep((s) => s + 1);
    try {
      window.scrollTo(0, 0);
    } catch {
      /* noop */
    }
  }

  function optionSelected(option: { set: Record<string, any> }) {
    const keys = Object.keys(option.set);
    if (keys.length === 0) return false;
    return keys.every((k) => answers[k] === option.set[k]);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setSent(false);
    setEmail("");
    setError(null);
    try {
      window.scrollTo(0, 0);
    } catch {
      /* noop */
    }
  }

  // When the user reaches the result, persist their canonical answers as an
  // anonymous intake row keyed by browserSessionId (claimed on signup, PS-1).
  // applicantRole is carried so the helper path survives the handoff (PS-2).
  useEffect(() => {
    if (!atResult) return;
    apiRequest("POST", "/api/intake/anon", {
      browserSessionId: getBrowserSessionId(),
      answers,
      applicantRole,
    }).catch(() => {
      /* best-effort; re-written on signup if this fails */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atResult]);

  function handoff() {
    // Make sure the latest role is saved before we leave for /auth.
    apiRequest("POST", "/api/intake/anon", {
      browserSessionId: getBrowserSessionId(),
      answers,
      applicantRole,
    }).catch(() => {});
    onHandoffToAuth();
  }

  async function submitEmail() {
    if (!email || email.indexOf("@") <= 0) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("POST", "/api/leads", {
        email,
        resultType: leadResultType(displayState),
        assessmentData: answers,
        source: "landing_assessment",
      });
      // Save the email onto the anonymous intake row for cross-device resume.
      apiRequest("POST", "/api/intake/anon", {
        browserSessionId: getBrowserSessionId(),
        answers,
        email,
        applicantRole,
      }).catch(() => {});
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen animate-ps-fade bg-[#F6F0E7]">
      {/* Header + progress track */}
      <header className="sticky top-0 z-20 border-b border-[#E3D9C9] bg-[#F6F0E7]/[0.92]">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-6 py-[14px]">
          <div className="inline-flex items-center gap-2.5">
            <img src="/assets/swift_navy.png" alt="" className="block h-[30px] w-[30px]" />
            <span className="text-[17px] font-extrabold text-[#082D48]">ProbateSwift</span>
          </div>
          <button
            onClick={onGoLanding}
            className="cursor-pointer rounded-full border border-[#C9BBA4] bg-transparent px-[18px] py-[9px] text-[14px] font-semibold text-[#5C6670] transition-colors hover:bg-[#EFE7DA]"
          >
            Save &amp; exit
          </button>
        </div>
        <div className="h-1 bg-[#E3D9C9]">
          <div
            className="h-full bg-[#082D48]"
            style={{ width: progressPct, transition: "width 0.4s ease" }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-6 pb-20 pt-14">
        {currentQuestion && (
          <div className="animate-ps-pop">
            <div className="mb-[14px] text-[14px] font-bold tracking-[0.04em] text-[#8A8278]">
              Question {step + 1} of {visible.length}
            </div>
            <h1 className="m-0 mb-2.5 text-[28px] font-extrabold leading-[1.14] tracking-[-0.02em] md:text-[34px]">
              {currentQuestion.title}
            </h1>
            <p className="m-0 mb-[30px] text-[17px] text-[#5C6670]">{currentQuestion.sub}</p>
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((opt) => {
                const selected = optionSelected(opt);
                return (
                  <button
                    key={opt.label}
                    onClick={() => pick(opt)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-[14px] rounded-[14px] border-[1.5px] px-[22px] py-5 text-left text-[18px] font-semibold text-[#1E2A33] transition-colors hover:border-[#082D48] hover:bg-[#FBF7EF] ${
                      selected
                        ? "border-[#082D48] bg-[#E4EAF0]"
                        : "border-[#E3D9C9] bg-white"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[20px] text-[#082D48]">{selected ? "✓" : "→"}</span>
                  </button>
                );
              })}
            </div>
            {step > 0 && (
              <button
                onClick={back}
                className="mt-7 cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[#8A8278]"
              >
                ← Back
              </button>
            )}
          </div>
        )}

        {atResult && (
          <div className="animate-ps-pop">
            <div
              className="mb-[22px] inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold"
              style={{ background: result.chip, color: result.accent }}
            >
              {result.badge}
            </div>
            <h1 className="m-0 mb-4 text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] md:text-[38px]">
              {result.heading}
            </h1>
            <p className="m-0 mb-8 text-[19px] leading-[1.6] text-[#5C6670]">{result.body}</p>

            <div className="rounded-[22px] border border-[#E3D9C9] bg-white p-[34px]">
              {result.mode === "handoff" ? (
                // Good-fit / amber / helper: hand off to the real sign-up flow.
                <div>
                  <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.04em] text-[#8A8278]">
                    {result.captionLabel}
                  </div>
                  <div className="mb-[18px] text-[17px] text-[#5C6670]">{result.note}</div>
                  <button
                    onClick={handoff}
                    className="inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-[12px] border-none bg-[#082D48] px-7 py-4 text-[17px] font-bold text-[#F6F0E7] transition-colors hover:bg-[#06223A]"
                  >
                    {result.ctaLabel} <span className="text-[19px]">→</span>
                  </button>
                </div>
              ) : sent ? (
                <div className="animate-ps-pop py-3 text-center">
                  <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full bg-[#E4EAF0] text-[28px] text-[#082D48]">
                    ✓
                  </div>
                  <div className="mb-2 text-[22px] font-extrabold">You’re on the list.</div>
                  <p className="m-0 text-[16px] text-[#5C6670]">
                    Thank you. We’ll be in touch, no spam, no card needed.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.04em] text-[#8A8278]">
                    {result.captionLabel}
                  </div>
                  <div className="mb-[18px] text-[17px] text-[#5C6670]">{result.note}</div>
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitEmail();
                      }}
                      placeholder="you@example.com"
                      type="email"
                      className="min-w-[220px] flex-1 rounded-[12px] border-[1.5px] border-[#E3D9C9] bg-[#FBF7EF] px-[18px] py-4 text-[17px] font-medium text-[#1E2A33] outline-none focus:border-[#082D48]"
                    />
                    <button
                      onClick={submitEmail}
                      disabled={submitting}
                      className="cursor-pointer whitespace-nowrap rounded-[12px] border-none bg-[#082D48] px-7 py-4 text-[17px] font-bold text-[#F6F0E7] transition-colors hover:bg-[#06223A] disabled:cursor-default disabled:opacity-70"
                    >
                      {submitting ? "Saving…" : result.ctaLabel}
                    </button>
                  </div>
                  {error && <div className="mt-3 text-[14px] text-[#B5613C]">{error}</div>}
                  {/* Red flag is advisory at this stage — let people continue if they wish. */}
                  {displayState === "proceed_red" && (
                    <button
                      onClick={handoff}
                      className="mt-5 cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[#082D48] underline"
                    >
                      Or continue with ProbateSwift anyway →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-[26px] flex flex-wrap items-center gap-[18px]">
              <button
                onClick={restart}
                className="cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[#8A8278]"
              >
                ← Start over
              </button>
              <button
                onClick={onGoLanding}
                className="cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[#082D48] underline"
              >
                Back to the homepage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentView;
