// Evaluation question configuration for both landing page and in-app flows

// ── Canonical key dictionary ──────────────────────────────────────────────────
// One vocabulary for the whole customer journey. Every question key — landing
// and in-app — must be a member of this dictionary, and the flag engine reads
// only these keys. This is what kills the historic drift (e.g. the former
// `applicant_named_executor` vs `named_executor_in_will` split). A unit test
// asserts every question key is a member here (the drift guard).
//
// The value is a short human description of what the key means; it has no
// runtime behaviour beyond documenting intent.
export const CANONICAL_KEYS = {
  // ── Jurisdiction / eligibility ──
  has_person_died: "Has someone died",
  death_in_england_wales: "Death occurred in England or Wales",
  deceased_domiciled_uk: "Deceased domiciled in the UK at death",
  deceased_lived_england_wales: "Deceased lived permanently in England or Wales",

  // ── Will / applicant role ──
  has_will: "A valid will exists",
  named_executor_in_will: "Applicant is named as an executor in the will",
  next_of_kin: "Applicant is spouse/civil partner/child/parent of the deceased",
  acting_under_poa: "Applicant acts under power of attorney for an executor",

  // ── Grant-needed axis (PS-3) — how assets are HELD, not their value ──
  owned_property: "Deceased owned property (house/flat/land)",
  property_ownership: "How the property was owned (sole/joint_tenants/tenants_in_common/not_sure)",
  nsandi_over_5k: "NS&I / Premium Bonds holdings over £5,000",
  holds_direct_shares: "Directly-held shares (not via a fund/ISA platform)",
  single_provider_over_50k: "Any single provider likely holding over £50,000",

  // ── Complexity screen (PS-4) ──
  estate_insolvent: "Estate may be insolvent (debts exceed assets)",
  estate_disputed: "Dispute or contested will",
  deceased_foreign_assets: "Deceased owned non-UK (foreign) assets",
  trust_involvement: "Deceased created or benefited from a trust",
  business_or_farm_assets: "Estate includes business or agricultural/farm assets",
  will_missing_or_invalid: "Will is missing, unsigned, or possibly invalid",

  // ── IHT axis — total VALUE lives here only ──
  estate_value_estimate: "Estimated total estate value band (IHT framing)",
  estate_excepted_from_iht: "Estate is excepted from Inheritance Tax",
  iht400_completed: "IHT400 has been completed and submitted to HMRC",
  gifts_last_7_years: "Deceased made gifts in the 7 years before death",
  married_civil_partnership: "Deceased was married/in a civil partnership at death",
  spouse_partner_deceased: "Spouse/civil partner had already died",
  spouse_nrb_fully_used: "Spouse's nil rate band was fully used",
  home_to_children_grandchildren: "Home left to children or grandchildren",
  deceased_lived_uk_property: "Deceased lived in a UK property they owned",

  // ── Deep-only detail (affects form content, not go/no-go) ──
  deceased_settled_land: "Deceased owned land held as settled land",
  deceased_other_names: "Deceased held assets under another name",
  family_adoptions: "Relatives adopted in/out of the family",
  will_date: "Date of the will",
  married_after_will: "Deceased married after making the will",
  will_codicils: "There are codicils to the will",
  foreign_wills: "Wills made outside England and Wales",
  all_executors_applying: "All named executors are applying",
  non_applying_executor_reasons: "Reason each non-applying executor is not applying",
  number_of_applicants: "How many people are applying",
  under18_beneficiaries: "A beneficiary under 18 receives a gift in the will",
} as const;

export type CanonicalKey = keyof typeof CANONICAL_KEYS;

export interface EvaluationQuestion {
  key: CanonicalKey;
  type: 'boolean' | 'number' | 'text' | 'select' | 'date' | 'object';
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf?: Record<string, any>;
    hideIf?: Record<string, any>;
  };
}

export interface EvaluationSection {
  id: string;
  title: string;
  description?: string;
  questions: EvaluationQuestion[];
}

// Landing page eligibility check - 6 simple questions
export const landingPageQuestions: EvaluationQuestion[] = [
  {
    key: 'has_person_died',
    type: 'boolean',
    title: 'Has someone passed away?',
    description: 'We can only help with probate applications for deceased persons.',
    required: true
  },
  {
    key: 'death_in_england_wales',
    type: 'boolean',
    title: 'Did the person die in England or Wales?',
    description: 'Our service covers probate applications in England and Wales only.',
    required: true,
    conditionalLogic: {
      showIf: { has_person_died: true }
    }
  },
  {
    key: 'has_will',
    type: 'boolean',
    title: 'Did the person leave a will?',
    description: 'This affects the type of probate application needed.',
    required: true,
    conditionalLogic: {
      showIf: { death_in_england_wales: true }
    }
  },
  {
    key: 'estate_value_estimate',
    type: 'select',
    title: 'What is the estimated value of the estate?',
    description: 'Include property, savings, investments, and personal belongings.',
    required: true,
    options: [
      'Under £5,000',
      '£5,000 - £325,000',
      'Over £325,000'
    ],
    conditionalLogic: {
      showIf: { has_will: [true, false] }
    }
  },
  {
    key: 'named_executor_in_will',
    type: 'boolean',
    title: 'Are you named as an executor in the will?',
    description: 'Only executors can apply for probate when there is a will.',
    required: true,
    conditionalLogic: {
      showIf: { has_will: true }
    }
  },
  {
    key: 'next_of_kin',
    type: 'boolean',
    title: 'Are you the spouse, civil partner, child, or parent of the deceased?',
    description: 'Priority order applies for administration applications.',
    required: true,
    conditionalLogic: {
      showIf: { has_will: false }
    }
  }
];

// Detailed in-app evaluation flow - Five sections following the revised scope
export const detailedEvaluationSections: EvaluationSection[] = [
  {
    id: 'deceased_details',
    title: 'Section 1: About the Deceased',
    description: 'Basic information about the person who has passed away',
    questions: [
      {
        key: 'deceased_domiciled_uk',
        type: 'boolean',
        title: 'Was the deceased domiciled in the UK at death?',
        description: '"Domicile" means the country the person considered their permanent home, even if they died elsewhere.',
        required: true
      },
      {
        key: 'deceased_lived_england_wales',
        type: 'boolean',
        title: 'Did the deceased live permanently in England or Wales?',
        description: 'Did they live most of their life and plan to stay in England or Wales?',
        required: true
      },
      {
        key: 'deceased_foreign_assets',
        type: 'boolean',
        title: 'Did the deceased own non-UK (foreign) assets?',
        description: 'Did they own property, money, or investments outside the UK?',
        required: true
      },
      {
        key: 'deceased_settled_land',
        type: 'boolean',
        title: 'Did the deceased own land held as settled land?',
        description: 'Settled land is a legal term for certain types of land trusts (rare—leave blank if unsure).',
        required: true
      },
      {
        key: 'deceased_other_names',
        type: 'boolean',
        title: 'Did the deceased hold assets under another name?',
        description: 'Did the person have any bank accounts, property, or investments in any other names (including maiden names, aliases, or nicknames)?',
        required: true
      },
      {
        key: 'family_adoptions',
        type: 'boolean',
        title: 'Were any relatives adopted in/out of the family?',
        description: 'Was anyone adopted into or out of the deceased\'s family (could affect inheritance rules)?',
        required: true
      }
    ]
  },
  {
    id: 'tax_estate_threshold',
    title: 'Section 2: Tax & Estate Threshold',
    description: 'Information needed to determine inheritance tax requirements',
    questions: [
      {
        key: 'gifts_last_7_years',
        type: 'boolean',
        title: 'Did the deceased make gifts in the 7 years before death?',
        description: 'Did they give away money, property, or valuable items in the last 7 years of life?',
        required: true
      },
      {
        key: 'married_civil_partnership',
        type: 'boolean',
        title: 'Was the deceased married or in a civil partnership at death?',
        description: 'Were they married or in a civil partnership when they died?',
        required: true
      },
      {
        key: 'spouse_partner_deceased',
        type: 'boolean',
        title: 'Had their spouse/civil partner already died?',
        description: 'Had their spouse or partner died before them?',
        required: true,
        conditionalLogic: {
          showIf: { married_civil_partnership: true }
        }
      },
      {
        key: 'spouse_nrb_fully_used',
        type: 'boolean',
        title: 'Was the spouse\'s nil rate band fully used?',
        description: 'Did the spouse/partner use all their inheritance tax allowance, or is some available to transfer? (If unsure, select "Not sure.")',
        required: true,
        conditionalLogic: {
          showIf: { spouse_partner_deceased: true }
        }
      },
      {
        key: 'home_to_children_grandchildren',
        type: 'boolean',
        title: 'Did the deceased leave their home to children or grandchildren?',
        description: 'Was the family home left to children or grandchildren?',
        required: true
      },
      {
        key: 'deceased_lived_uk_property',
        type: 'boolean',
        title: 'Did the deceased live in a UK property they owned?',
        description: 'Did they live in a house or flat in the UK that they owned?',
        required: true
      },
      {
        key: 'trust_involvement',
        type: 'boolean',
        title: 'Did the deceased create or benefit from a trust?',
        description: 'Did they put assets into a trust or benefit from a trust at any point? (If unsure, select "No.")',
        required: true
      }
    ]
  },
  {
    id: 'will_executors',
    title: 'Section 3: Will & Executors',
    description: 'Information about the will and executors (shown only if there is a will)',
    questions: [
      {
        key: 'will_date',
        type: 'date',
        title: 'What is the date of the will?',
        description: 'Enter the date shown on the will.',
        required: true
      },
      {
        key: 'married_after_will',
        type: 'boolean',
        title: 'Did the deceased marry after making the will?',
        description: 'Did the deceased get married or register a civil partnership after their last will was made? (This may affect validity.)',
        required: true
      },
      {
        key: 'will_codicils',
        type: 'boolean',
        title: 'Are there codicils to the will?',
        description: 'Are there any official changes or addendums (codicils) attached to the will?',
        required: true
      },
      {
        key: 'foreign_wills',
        type: 'boolean',
        title: 'Were any wills made outside England and Wales?',
        description: 'Did the deceased make any wills in another country? (Copies may be needed.)',
        required: true
      },
      {
        key: 'all_executors_applying',
        type: 'boolean',
        title: 'Are all named executors applying?',
        description: 'Are all the executors listed in the will actually applying for probate?',
        required: true
      },
      {
        key: 'non_applying_executor_reasons',
        type: 'select',
        title: 'Why is each non-applying executor not applying?',
        description: 'Please state the reason for each executor not applying (choose from the list).',
        required: false,
        options: ['renunciation', 'deceased', 'cannot locate', 'lacks capacity', 'power reserved'],
        conditionalLogic: {
          showIf: { all_executors_applying: false }
        }
      }
    ]
  },
  {
    id: 'about_applicant',
    title: 'Section 4: About You (Applicant)',
    description: 'Information about the person applying for probate',
    questions: [
      {
        key: 'named_executor_in_will',
        type: 'boolean',
        title: 'Are you named as an executor in the will?',
        description: 'Are you personally named as an executor in the will?',
        required: true
      },
      {
        key: 'acting_under_poa',
        type: 'boolean',
        title: 'Are you acting under a power of attorney on behalf of an executor?',
        description: 'Are you applying as a legally appointed representative for a named executor?',
        required: true,
        conditionalLogic: {
          showIf: { named_executor_in_will: false }
        }
      },
      {
        key: 'number_of_applicants',
        type: 'number',
        title: 'How many people are applying?',
        description: 'How many people will be named as applicants on this probate application?',
        required: true,
        validation: {
          min: 1,
          max: 4
        }
      },
      {
        key: 'under18_beneficiaries',
        type: 'boolean',
        title: 'Is anyone under 18 receiving a gift in the will?',
        description: 'Will any beneficiaries under 18 receive money or property from the estate? (If yes, at least two applicants must apply.)',
        required: true
      }
    ]
  },
  {
    id: 'iht_readiness',
    title: 'Section 5: Inheritance Tax Readiness',
    description: 'Inheritance tax form completion status',
    questions: [
      {
        key: 'estate_excepted_from_iht',
        type: 'boolean',
        title: 'Is the estate excepted from Inheritance Tax?',
        description: 'The "inheritance tax threshold" (also known as the nil rate band) is usually £325,000. Most estates valued below this are excepted—meaning no inheritance tax is due and you don\'t need to complete the detailed tax forms (IHT400). You may also be excepted if: • All assets are left to a spouse, civil partner, or charity, • The estate\'s value is less than £1 million and everything over £325,000 goes to a spouse, civil partner, or charity, • Or, the deceased was a permanent resident of the UK and there are no complicated trusts or large gifts in the last 7 years. If you\'re unsure, you can check the government\'s official estate checker tool.',
        required: true
      },
      {
        key: 'iht400_completed',
        type: 'boolean',
        title: 'If not excepted, has an IHT400 been completed and submitted?',
        description: 'If the estate isn\'t excepted, has the Inheritance Tax form (IHT400) already been completed and sent to HMRC?',
        required: true,
        conditionalLogic: {
          showIf: { estate_excepted_from_iht: false }
        }
      }
    ]
  }
];

// ── PS-4: two-tier specialist triage ─────────────────────────────────────────
export type SpecialistSeverity = "none" | "amber" | "red";

export interface SpecialistAssessment {
  specialistSuggested: boolean;
  specialistSeverity: SpecialistSeverity;
  specialistReasons: string[];
}

// The complexity-screen flags and their tier. red = stop-and-advise candidates;
// amber = soft "continue if you like". Deep-only detail (settled land, foreign
// wills, adoptions, marriage-after-will) is intentionally NOT here — it affects
// form content, not the go/no-go tier.
const SPECIALIST_FLAGS: { key: CanonicalKey; severity: "amber" | "red"; reason: string }[] = [
  { key: "estate_insolvent", severity: "red", reason: "The estate may be insolvent (debts could exceed assets)." },
  { key: "estate_disputed", severity: "red", reason: "There is a dispute or a contested will." },
  { key: "deceased_foreign_assets", severity: "amber", reason: "The estate includes assets held outside the UK." },
  { key: "trust_involvement", severity: "amber", reason: "A trust is involved in the estate." },
  { key: "business_or_farm_assets", severity: "amber", reason: "The estate includes business or agricultural assets." },
  { key: "will_missing_or_invalid", severity: "amber", reason: "The will may be missing, unsigned, or invalid." },
];

export function deriveSpecialist(answers: Record<string, any>): SpecialistAssessment {
  const reasons: string[] = [];
  let hasRed = false;
  let hasAmber = false;
  for (const flag of SPECIALIST_FLAGS) {
    if (answers[flag.key] === true) {
      reasons.push(flag.reason);
      if (flag.severity === "red") hasRed = true;
      else hasAmber = true;
    }
  }
  const specialistSeverity: SpecialistSeverity = hasRed ? "red" : hasAmber ? "amber" : "none";
  return {
    specialistSuggested: specialistSeverity !== "none",
    specialistSeverity,
    specialistReasons: reasons,
  };
}

/** The amber complexity-flag keys currently raised — used for per-flag dismissal (PS-5). */
export function amberFlagKeys(answers: Record<string, any>): CanonicalKey[] {
  return SPECIALIST_FLAGS.filter((f) => f.severity === "amber" && answers[f.key] === true).map(
    (f) => f.key,
  );
}

// ── PS-3: is a grant needed (driven by how assets are HELD, not their value) ──
export type GrantNeeded = "needed" | "probably_needed" | "probably_not_needed";

export function deriveGrantNeeded(answers: Record<string, any>): GrantNeeded {
  // Property in sole name or tenants-in-common almost always needs a grant.
  const ownsTriggeringProperty =
    answers.owned_property === true &&
    (answers.property_ownership === "sole" || answers.property_ownership === "tenants_in_common");
  if (ownsTriggeringProperty) return "needed";

  const propertyUnclear =
    answers.owned_property === true && answers.property_ownership === "not_sure";

  // Low-threshold financial triggers: NS&I/Premium Bonds > £5k, directly-held
  // shares, or any single provider likely over its (~£50k) threshold.
  const lowThresholdTrigger =
    answers.nsandi_over_5k === true ||
    answers.holds_direct_shares === true ||
    answers.single_provider_over_50k === true;
  if (lowThresholdTrigger || propertyUnclear) return "probably_needed";

  // No grant-triggering property and no low-threshold trigger. If the
  // low-threshold questions were explicitly answered "no", lean to not needed.
  const lowThresholdAnswered =
    answers.nsandi_over_5k !== undefined &&
    answers.holds_direct_shares !== undefined &&
    answers.single_provider_over_50k !== undefined;
  if (lowThresholdAnswered) return "probably_not_needed";

  // Joint-tenant-only property (passes by survivorship) or no property, with the
  // low-threshold branch not asked → probably not needed.
  if (answers.owned_property === false || answers.property_ownership === "joint_tenants") {
    return "probably_not_needed";
  }
  return "probably_needed";
}

// ── PS-2: three-outcome assessment contract ──────────────────────────────────
export type AssessmentRoute = "not_needed" | "ineligible" | "proceed";

export interface AssessmentOutcome {
  route: AssessmentRoute;
  reason: string;
  probateType?: "grant_of_probate" | "letters_of_administration";
  specialistSuggested: boolean;
  specialistSeverity: SpecialistSeverity;
  specialistReasons: string[];
}

export function deriveAssessmentOutcome(answers: Record<string, any>): AssessmentOutcome {
  const specialist = deriveSpecialist(answers);
  const grant = deriveGrantNeeded(answers);

  const hasWill = answers.has_will === true;
  const probateType: "grant_of_probate" | "letters_of_administration" =
    hasWill && answers.named_executor_in_will === true
      ? "grant_of_probate"
      : "letters_of_administration";

  const base = {
    probateType,
    specialistSuggested: specialist.specialistSuggested,
    specialistSeverity: specialist.specialistSeverity,
    specialistReasons: specialist.specialistReasons,
  };

  // 1) Probate probably not needed → stop and explain.
  if (grant === "probably_not_needed") {
    return {
      ...base,
      route: "not_needed",
      probateType: undefined,
      reason:
        "From what you've told us, the estate can likely be settled without a grant of probate.",
    };
  }

  // 2) Wrong applicant → helper handoff (never a dead end). Only when we
  //    actually asked the entitlement question.
  const entitled = hasWill
    ? answers.named_executor_in_will === true || answers.acting_under_poa === true
    : answers.next_of_kin === true;
  const entitlementKnown = hasWill
    ? answers.named_executor_in_will !== undefined || answers.acting_under_poa !== undefined
    : answers.next_of_kin !== undefined;
  if (entitlementKnown && !entitled) {
    return {
      ...base,
      route: "ineligible",
      reason:
        "You can start the application, but only the person entitled to apply can sign and submit it. We'll help you hand it over when you're ready.",
    };
  }

  // 3) Proceed (the specialist flag is advisory here and never blocks proceed).
  return {
    ...base,
    route: "proceed",
    reason: "This looks like an estate we can help you with.",
  };
}

// ── PS-5: readiness gate router ───────────────────────────────────────────────
export type ReadinessRoute = "ready" | "handoff" | "specialist" | "fix_required";

export interface ReadinessContext {
  applicantRole?: "applicant" | "helper";
  applicantIsEntitled?: boolean;
  amberAcknowledged?: boolean;
  statementOfTruthSigned?: boolean;
  structuralRequirementsMet?: boolean;
}

export interface ReadinessAssessment {
  route: ReadinessRoute;
  canPay: boolean;
  canSubmit: boolean;
  structuralBlockers: string[];
  ihtTimingWarning: string | null;
  reasons: string[];
}

// Pay vs submit split (PS-5): anyone may pay; only the entitled applicant may
// submit. Only a jurisdiction block or a sticky red flag stop payment; amber
// flags stop payment only until acknowledged; IHT is a timing warning, never a
// payment block.
export function deriveReadiness(
  flags: Record<string, any>,
  ctx: ReadinessContext = {},
): ReadinessAssessment {
  const severity: SpecialistSeverity = flags.specialist_severity ?? "none";
  const applicationBlocked = flags.application_blocked === true;
  const structuralBlockers: string[] = flags.structural_blockers ?? [];
  const ihtTimingWarning: string | null = flags.iht_timing_warning ?? null;

  const amberAcknowledged = ctx.amberAcknowledged === true;
  const applicantIsEntitled = ctx.applicantIsEntitled ?? ctx.applicantRole !== "helper";
  const structuralRequirementsMet =
    ctx.structuralRequirementsMet ?? structuralBlockers.length === 0;
  const statementOfTruthSigned = ctx.statementOfTruthSigned === true;

  // Payment opens only once jurisdiction is positively confirmed (E&W + UK
  // domicile, answered in the detailed evaluation) — so the £295 CTA never
  // appears off the back of the short landing assessment alone.
  const canPay =
    !applicationBlocked &&
    flags.jurisdiction_supported === true &&
    severity !== "red" &&
    (severity !== "amber" || amberAcknowledged);

  const canSubmit =
    canPay && applicantIsEntitled && statementOfTruthSigned && structuralRequirementsMet;

  const reasons: string[] = [];
  let route: ReadinessRoute;
  if (applicationBlocked) {
    route = "specialist";
    reasons.push(flags.blocker_reason ?? "This estate falls outside our jurisdiction.");
  } else if (severity === "red") {
    route = "specialist";
    reasons.push(...(flags.specialist_reasons ?? []));
  } else if (structuralBlockers.length > 0) {
    route = "fix_required";
    reasons.push(...structuralBlockers);
  } else if (!applicantIsEntitled) {
    route = "handoff";
    reasons.push("Only the person entitled to apply can sign and submit the application.");
  } else {
    route = "ready";
  }

  return { route, canPay, canSubmit, structuralBlockers, ihtTimingWarning, reasons };
}

// Single logic engine for deriving flags from answers (PS-1).
// Replaces the former deriveEvaluationFlags + deriveLandingPageResult pair.
// Reads only canonical keys (see CANONICAL_KEYS) and computes whatever the
// present keys allow: a landing-stage answer set yields a partial flag map; a
// full evaluation yields the complete one.
export function deriveFlags(answers: Record<string, any>): Record<string, any> {
  const flags: Record<string, any> = {};

  // ── Jurisdiction ─────────────────────────────────────────────────────────
  // jurisdiction_supported is a *positive* confirmation (E&W + UK domicile) — used
  // to gate payment/submission. It is deliberately NOT the inverse of "blocked":
  // an unanswered question is "not yet confirmed", not "out of scope".
  //
  // The England-&-Wales signal has two canonical keys for the same concept: the
  // landing-page `death_in_england_wales` and the detailed-evaluation
  // `deceased_lived_england_wales`. Accept either, so a case confirmed in the
  // in-app evaluation isn't treated as unconfirmed (which previously blocked it).
  const englandWalesYes =
    answers.death_in_england_wales === true ||
    answers.deceased_lived_england_wales === true;
  const englandWalesNo =
    answers.death_in_england_wales === false ||
    answers.deceased_lived_england_wales === false;

  flags.jurisdiction_supported =
    englandWalesYes && answers.deceased_domiciled_uk === true;
  // Only an explicit out-of-scope answer excludes the case (→ refer to solicitor).
  flags.jurisdiction_excluded =
    englandWalesNo || answers.deceased_domiciled_uk === false;

  // ── Will / probate type ───────────────────────────────────────────────────
  flags.has_will = answers.has_will === true;

  const applicantIsExecutor = answers.named_executor_in_will === true;

  flags.probate_type = flags.has_will
    ? applicantIsExecutor
      ? "grant_of_probate"
      : "letters_of_administration"
    : "letters_of_administration";

  // ── Complexity / specialist flags ─────────────────────────────────────────
  flags.has_foreign_assets    = answers.deceased_foreign_assets === true;
  flags.has_settled_land      = answers.deceased_settled_land === true;
  flags.has_trust_involvement = answers.trust_involvement === true;
  flags.family_adoptions      = answers.family_adoptions === true;
  flags.foreign_wills         = answers.foreign_wills === true;
  flags.married_after_will    = answers.married_after_will === true;
  flags.acting_under_poa      = answers.acting_under_poa === true;

  // ── IHT / estate threshold ────────────────────────────────────────────────
  const estateValueBand  = answers.estate_value_estimate as string | undefined;
  const isHighValueBand  = estateValueBand === "Over £325,000";
  const hasGifts         = answers.gifts_last_7_years === true;
  const hasTrusts        = answers.trust_involvement === true;
  const hasForeignAssets = answers.deceased_foreign_assets === true;

  // estate_excepted_from_iht is the definitive answer from Section 5;
  // fall back to the landing-page value band when Section 5 hasn't been answered yet.
  const estateExcepted =
    answers.estate_excepted_from_iht === true ||
    estateValueBand === "Under £5,000";

  flags.estate_likely_excepted =
    estateExcepted && !hasGifts && !hasTrusts && !hasForeignAssets && !isHighValueBand;

  flags.iht400_required =
    !flags.estate_likely_excepted && answers.iht400_completed !== true;

  // ── Document requirements ─────────────────────────────────────────────────
  flags.needs_renunciation_form = false;
  if (answers.all_executors_applying === false) {
    const reasons: unknown = answers.non_applying_executor_reasons ?? [];
    flags.needs_renunciation_form = Array.isArray(reasons)
      ? reasons.includes("renunciation")
      : reasons === "renunciation";
  }

  flags.needs_translation  = answers.foreign_wills === true;
  flags.needs_alias_details = answers.deceased_other_names === true;

  // ── PA1P sections required ────────────────────────────────────────────────
  const hasUnder18Beneficiaries = answers.under18_beneficiaries === true;
  flags.pa1p_sections = {
    section_a: true, // always required
    section_b: true,
    section_c: true,
    section_d: hasUnder18Beneficiaries,
    section_e: answers.all_executors_applying === false,
    section_f: answers.deceased_other_names === true,
    section_g: answers.family_adoptions === true,
  };

  // ── Specialist advice needed ───────────────────────────────────────────────
  // Legacy union (includes deep-only detail) — kept for in-app task generation.
  flags.needs_specialist_advice = [
    flags.has_foreign_assets,
    flags.has_settled_land,
    flags.has_trust_involvement,
    flags.family_adoptions,
    flags.foreign_wills,
    flags.married_after_will,
  ].some(Boolean);

  // Two-tier triage (PS-4) — complexity-screen flags only, with severity.
  const specialist = deriveSpecialist(answers);
  flags.specialist_suggested = specialist.specialistSuggested;
  flags.specialist_severity  = specialist.specialistSeverity;
  flags.specialist_reasons   = specialist.specialistReasons;

  // Grant needed on asset holding (PS-3).
  flags.grant_needed = deriveGrantNeeded(answers);

  // ── Application blockers ──────────────────────────────────────────────────
  // Block only on an EXPLICIT out-of-jurisdiction answer — never merely because
  // the short landing assessment didn't collect it (that previously referred
  // every happy-path case to a solicitor and paused payment).
  flags.application_blocked = flags.jurisdiction_excluded === true;
  flags.blocker_reason = flags.application_blocked
    ? "Probate not handled for this jurisdiction"
    : null;

  // ── Readiness ─────────────────────────────────────────────────────────────
  const numApplicants = Number(answers.number_of_applicants ?? 1);

  // Structural blockers invalidate the form itself → they gate generation (a
  // paid, un-fileable form would mean a refund). IHT is NOT here: the product
  // fills the IHT400, so the real IHT constraint is HMRC sequencing — surfaced
  // as a timing warning, not a block (PS-5; reconciles dec-iht-form-strategy).
  const structuralBlockers: string[] = [];
  if (numApplicants > 4) {
    structuralBlockers.push("Maximum of 4 applicants allowed");
  }
  if (hasUnder18Beneficiaries && numApplicants < 2) {
    structuralBlockers.push("At least 2 applicants required when under-18 beneficiaries receive gifts");
  }
  flags.structural_blockers = structuralBlockers;

  flags.iht_timing_warning = flags.iht400_required
    ? "Once your IHT400 is submitted, HMRC must process it before the probate application can be filed."
    : null;

  flags.application_ready =
    !flags.application_blocked &&
    structuralBlockers.length === 0 &&
    flags.specialist_severity !== "red";

  return flags;
}