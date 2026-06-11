// Content + logic for the relaunch landing assessment (Hero B — calm /
// grief-sensitive). PS-2/3/4: the questions now emit CANONICAL intake keys and
// the result is computed by the shared engine (deriveAssessmentOutcome), so the
// landing and the in-app evaluation speak one vocabulary.

import {
  deriveAssessmentOutcome,
  type AssessmentOutcome,
} from "@shared/evaluation-config";

export interface AssessmentOption {
  label: string;
  /** Canonical answer keys this option sets when chosen. */
  set: Record<string, any>;
}

export interface AssessmentQuestion {
  /** Stable id (also the progress key). */
  id: string;
  title: string;
  sub: string;
  options: AssessmentOption[];
  /** Optional predicate — the question is shown only when it returns true. */
  showIf?: (answers: Record<string, any>) => boolean;
}

export const questions: AssessmentQuestion[] = [
  {
    id: "has_will",
    title: "Did the person who died leave a valid will?",
    sub: "It names who deals with the estate. It’s fine if you’re not certain.",
    options: [
      { label: "Yes, there is a will", set: { has_will: true } },
      { label: "No, there is no will", set: { has_will: false } },
      { label: "I’m not sure", set: { has_will: false } },
    ],
  },
  {
    id: "named_executor_in_will",
    title: "Are you named as an executor in the will?",
    sub: "Only the named executor can sign and submit when there’s a will.",
    showIf: (a) => a.has_will === true,
    options: [
      { label: "Yes, I’m an executor", set: { named_executor_in_will: true } },
      { label: "No, someone else is", set: { named_executor_in_will: false } },
      {
        label: "I’m acting for the executor",
        set: { named_executor_in_will: false, acting_under_poa: true },
      },
    ],
  },
  {
    id: "next_of_kin",
    title: "Are you the closest living relative?",
    sub: "With no will, the closest relative usually applies — a spouse, child or parent.",
    showIf: (a) => a.has_will === false,
    options: [
      { label: "Yes, I’m the next of kin", set: { next_of_kin: true } },
      { label: "No, someone closer is", set: { next_of_kin: false } },
    ],
  },
  {
    id: "owned_property",
    title: "Did they own a home or other property?",
    sub: "How a property was owned changes whether probate is needed.",
    options: [
      {
        label: "Yes, in their name alone",
        set: { owned_property: true, property_ownership: "sole" },
      },
      {
        label: "Yes, jointly with someone",
        set: { owned_property: true, property_ownership: "joint_tenants" },
      },
      { label: "No property", set: { owned_property: false } },
    ],
  },
  {
    id: "low_threshold_assets",
    title: "Did they hold any of these?",
    sub: "These can need a grant even when there’s no property to transfer.",
    // Skip when there’s already grant-triggering (sole-name) property.
    showIf: (a) => a.property_ownership !== "sole",
    options: [
      {
        label: "National Savings (NS&I) or Premium Bonds over £5,000",
        set: { nsandi_over_5k: true, holds_direct_shares: false, single_provider_over_50k: false },
      },
      {
        label: "Shares they held directly",
        set: { holds_direct_shares: true, nsandi_over_5k: false, single_provider_over_50k: false },
      },
      {
        label: "Over £50,000 with one bank or provider",
        set: { single_provider_over_50k: true, nsandi_over_5k: false, holds_direct_shares: false },
      },
      {
        label: "None of these",
        set: { nsandi_over_5k: false, holds_direct_shares: false, single_provider_over_50k: false },
      },
    ],
  },
  {
    id: "complex",
    title: "Do any of these apply to the estate?",
    sub: "These usually need a solicitor. It’s completely fine if none do.",
    options: [
      { label: "A dispute or contested will", set: { estate_disputed: true } },
      { label: "A trust is involved", set: { trust_involvement: true } },
      { label: "There are assets overseas", set: { deceased_foreign_assets: true } },
      { label: "The estate may be insolvent", set: { estate_insolvent: true } },
      { label: "A business or farm is involved", set: { business_or_farm_assets: true } },
      { label: "None of these", set: {} },
    ],
  },
];

/** Questions visible given the current answers (applies showIf predicates). */
export function visibleQuestions(answers: Record<string, any>): AssessmentQuestion[] {
  return questions.filter((q) => !q.showIf || q.showIf(answers));
}

// ── Result display ────────────────────────────────────────────────────────────
// The shared engine returns route + specialistSeverity; the landing maps that to
// one of five display states (PS-2 three outcomes, split by PS-4 severity).
export type DisplayState =
  | "not_needed"
  | "proceed_clear"
  | "proceed_amber"
  | "proceed_red"
  | "ineligible";

export function computeOutcome(answers: Record<string, any>): AssessmentOutcome {
  return deriveAssessmentOutcome(answers);
}

export function displayStateFor(outcome: AssessmentOutcome): DisplayState {
  if (outcome.route === "not_needed") return "not_needed";
  if (outcome.route === "ineligible") return "ineligible";
  if (outcome.specialistSeverity === "red") return "proceed_red";
  if (outcome.specialistSeverity === "amber") return "proceed_amber";
  return "proceed_clear";
}

/** Coarse lead bucket kept for /api/leads (legacy "good|complex|none"). */
export function leadResultType(state: DisplayState): "good" | "complex" | "none" {
  if (state === "not_needed") return "none";
  if (state === "proceed_red") return "complex";
  return "good";
}

export interface ResultCopy {
  badge: string;
  heading: string;
  body: string;
  accent: string;
  chip: string;
  // "handoff" routes into the real /auth flow; "capture" shows the email form
  // (posts to /api/leads).
  mode: "handoff" | "capture";
  captionLabel: string;
  note: string;
  ctaLabel: string;
}

export const resultCopy: Record<DisplayState, ResultCopy> = {
  proceed_clear: {
    badge: "You look like a good fit",
    heading: "Good news, this is exactly what we’re built for.",
    body:
      "Based on your answers, this is the kind of straightforward estate ProbateSwift handles. We can guide you through probate and complete your forms, including the inheritance tax forms, for one flat fee of £295. You only pay when you’re ready to submit.",
    accent: "#082D48",
    chip: "#E4EAF0",
    mode: "handoff",
    captionLabel: "Create your free account",
    note: "Set up your account to start. It’s free to use, and you only pay £295 when you’re ready to submit.",
    ctaLabel: "Get started free",
  },
  proceed_amber: {
    badge: "Worth a quick check",
    heading: "We can help, with one thing to keep an eye on.",
    body:
      "Your answers point to a detail that sometimes needs extra care, like a trust, overseas assets or a business. It usually doesn’t stop you proceeding, and we’ll flag it clearly as you go. You can carry on with us, or pause for advice, it’s your call.",
    accent: "#9A6B1E",
    chip: "#F3E8D2",
    mode: "handoff",
    captionLabel: "Continue if you’d like",
    note: "It’s free to use and you only pay £295 when you’re ready to submit. We’ll point out anything worth a closer look.",
    ctaLabel: "Continue with ProbateSwift",
  },
  proceed_red: {
    badge: "A solicitor is the safer route",
    heading: "This estate looks like it needs a solicitor.",
    body:
      "Your answers point to something more serious, like a dispute or possible insolvency. We’d rather be honest now than get it wrong. For cases like this a solicitor is the safer route, and we can introduce you to one. You can still start with us if you prefer.",
    accent: "#B5613C",
    chip: "#F2E2D8",
    mode: "capture",
    captionLabel: "Talk to a specialist",
    note: "Leave your email and we’ll connect you with a probate solicitor suited to your situation.",
    ctaLabel: "Get specialist help",
  },
  ineligible: {
    badge: "You can still get this moving",
    heading: "You can start it, someone else signs it.",
    body:
      "It looks like you may not be the person entitled to sign the final application, but that’s not a dead end. You can gather everything and prepare the application as a helper, then hand it to the entitled person to sign and submit. Most families find this far easier than starting cold.",
    accent: "#082D48",
    chip: "#E4EAF0",
    mode: "handoff",
    captionLabel: "Start as a helper",
    note: "Set up a free account to begin. You can do all the work; only the entitled applicant signs and submits.",
    ctaLabel: "Start as a helper",
  },
  not_needed: {
    badge: "You may not need probate",
    heading: "You might not need probate at all.",
    body:
      "When an estate is small and there’s no property to transfer, many banks and institutions will release funds without the official probate document. It’s worth checking the limit with each one first. If that changes, we’re here, and the assessment stays free.",
    accent: "#082D48",
    chip: "#E4EAF0",
    mode: "capture",
    captionLabel: "Want a hand checking?",
    note: "Leave your email and we’ll send a short guide on releasing funds without probate.",
    ctaLabel: "Send me the guide",
  },
};

export interface FaqItem {
  q: string;
  a: string;
}

export const faqData: FaqItem[] = [
  {
    q: "When is probate actually required?",
    a: "Probate is usually needed when the estate (everything the person owned) includes a home in their sole name, or when a bank or institution holds more than its own limit (often between £5,000 and £50,000). If everything was owned together and passes straight to the other person, you may not need probate at all. The free assessment tells you which side of the line you’re on.",
  },
  {
    q: "What are the bank and institution limits?",
    a: "Each bank sets its own limit for releasing money without the official probate document, typically somewhere between £5,000 and £50,000. Below the limit they often release the money on sight of a death certificate; above it they ask for the document. It’s worth asking each one directly, and we help you keep track of who needs what.",
  },
  {
    q: "What about property or accounts owned together?",
    a: "Things owned together usually pass straight to the other owner and stay outside probate. Things owned in separate shares, or in the person’s sole name, normally form part of the estate. We ask about this in the assessment because it changes the answer a lot.",
  },
  {
    q: "Who’s allowed to deal with the estate?",
    a: "If there’s a valid will, the person named in it to sort things out (the executor) applies for the official document. If there’s no will, the closest relative applies for permission to deal with the estate. Some things, like bankruptcy or lacking mental capacity, can affect who’s allowed. We guide you through who should apply in your situation.",
  },
  {
    q: "Which inheritance tax forms will apply to me?",
    a: "Most estates under £325,000 (or up to £650,000 if a husband or wife died first without using their tax-free allowance) only need the shorter tax form. Larger estates need the longer form and its extra pages. We work out which one applies from your figures and complete the right forms either way, included in the £295.",
  },
  {
    q: "What happens if my estate turns out to be too complex?",
    a: "We’ll tell you, clearly and early, and we won’t charge you. ProbateSwift is built for straightforward estates. If your answers point to a dispute, a trust, overseas assets or insolvency, we’ll recommend a solicitor rather than take you somewhere we can’t safely help.",
  },
  {
    q: "Do I have to pay anything to start?",
    a: "No. The assessment is free and there’s no card needed to begin. You can fill everything in and see your completed forms before paying. The £295 is due only when you’re ready to submit your application.",
  },
];
