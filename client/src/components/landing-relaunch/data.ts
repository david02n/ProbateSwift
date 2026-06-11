// Content for the relaunch landing page (Hero B — calm / grief-sensitive).
// Copy is the approved launch copy from the design handoff. The assessment
// questions, result logic and FAQ are reproduced verbatim from the spec.

export type ResultType = "good" | "complex" | "none";

export interface AssessmentOption {
  label: string;
  v: string;
}

export interface AssessmentQuestion {
  id: "will" | "value" | "property" | "accounts" | "complex";
  title: string;
  sub: string;
  options: AssessmentOption[];
}

export const questions: AssessmentQuestion[] = [
  {
    id: "will",
    title: "Did the person who died leave a valid will?",
    sub: "It names who deals with the estate. It’s fine if you’re not certain.",
    options: [
      { label: "Yes, there is a will", v: "yes" },
      { label: "No, there is no will", v: "no" },
      { label: "I’m not sure", v: "unsure" },
    ],
  },
  {
    id: "value",
    title: "Roughly, what is the estate worth in total?",
    sub: "Property, savings, investments and belongings, before any debts.",
    options: [
      { label: "Under £5,000", v: "under5k" },
      { label: "£5,000 to £325,000", v: "mid" },
      { label: "£325,000 to £2 million", v: "high" },
      { label: "Over £2 million", v: "over2m" },
    ],
  },
  {
    id: "property",
    title: "Did they own a home or other property?",
    sub: "How a property was owned changes whether probate is needed.",
    options: [
      { label: "Yes, in their name alone", v: "sole" },
      { label: "Yes, jointly with someone", v: "joint" },
      { label: "No property", v: "none" },
    ],
  },
  {
    id: "accounts",
    title: "How many bank or investment accounts were there?",
    sub: "A rough count is absolutely fine.",
    options: [
      { label: "1 to 3", v: "few" },
      { label: "4 to 8", v: "some" },
      { label: "More than 8", v: "many" },
    ],
  },
  {
    id: "complex",
    title: "Do any of these apply to the estate?",
    sub: "These usually need a solicitor. It’s completely fine if none do.",
    options: [
      { label: "A dispute or contested will", v: "dispute" },
      { label: "Trusts are involved", v: "trust" },
      { label: "There are assets overseas", v: "overseas" },
      { label: "The estate may be insolvent", v: "insolvent" },
      { label: "None of these", v: "none" },
    ],
  },
];

export function computeResult(answers: Record<string, string>): ResultType {
  if (answers.complex && answers.complex !== "none") return "complex";
  if (answers.value === "over2m") return "complex";
  if (answers.value === "under5k" && answers.property === "none") return "none";
  return "good";
}

export interface ResultCopy {
  badge: string;
  heading: string;
  body: string;
  accent: string;
  chip: string;
  // "handoff" results route into the real /auth flow; "capture" results show
  // the email capture form (which posts to /api/leads).
  mode: "handoff" | "capture";
  captionLabel: string;
  note: string;
  ctaLabel: string;
}

export const resultCopy: Record<ResultType, ResultCopy> = {
  good: {
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
  complex: {
    badge: "Worth a closer look",
    heading: "This estate may need a solicitor.",
    body:
      "Your answers point to something more complex, like a dispute, a trust, overseas assets or a very large estate. We’d rather tell you honestly now than get it wrong. For cases like this, a solicitor is the safer route. If you’d like, we’ll let you know as we expand to cover more situations.",
    accent: "#B5613C",
    chip: "#F2E2D8",
    mode: "capture",
    captionLabel: "Get notified as we expand",
    note: "No obligation. We’ll only email you if we can genuinely help with a case like yours.",
    ctaLabel: "Keep me posted",
  },
  none: {
    badge: "You may not need probate",
    heading: "You might not need probate at all.",
    body:
      "When an estate is small and there’s no property to transfer, many banks and institutions will release funds without a grant of probate. It’s worth checking the threshold with each one first. If that changes, we’re here, and the assessment stays free.",
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
    a: "Probate is usually needed when the estate includes property held in the deceased’s sole name, or when a bank or institution holds more than its own threshold (often between £5,000 and £50,000). If everything was jointly owned and passes automatically to the survivor, you may not need probate at all. The free assessment tells you which side of the line you’re on.",
  },
  {
    q: "What are the bank and institution thresholds?",
    a: "Each bank sets its own limit for releasing funds without a grant of probate, typically somewhere between £5,000 and £50,000. Below the limit they often release the money on sight of a death certificate; above it they ask for the grant. It’s worth asking each institution directly, and we help you keep track of who needs what.",
  },
  {
    q: "What about jointly owned property or accounts?",
    a: "Assets held as joint tenants usually pass automatically to the surviving owner by survivorship and fall outside probate. Assets held as tenants in common, or in the deceased’s sole name, normally form part of the estate. We ask about this in the assessment because it changes the answer significantly.",
  },
  {
    q: "Who can apply, an executor or an administrator?",
    a: "If there’s a valid will, the executor named in it applies for a grant of probate. If there’s no will, the closest relative applies for letters of administration. Certain things, like bankruptcy or lacking mental capacity, can affect who is eligible. We guide you through who should apply in your situation.",
  },
  {
    q: "Which inheritance tax forms will apply to me?",
    a: "Most estates under the £325,000 threshold (or up to £650,000 with a transferred allowance) use the lighter excepted-estate reporting. Larger or more involved estates need the full IHT400 and its schedules. We work out which route applies from your figures and complete the right forms either way, included in the £295.",
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
