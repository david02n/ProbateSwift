import { describe, it, expect } from "vitest";
import {
  CANONICAL_KEYS,
  landingPageQuestions,
  detailedEvaluationSections,
  deriveFlags,
  deriveGrantNeeded,
  deriveSpecialist,
  deriveAssessmentOutcome,
  deriveReadiness,
  type CanonicalKey,
} from "@shared/evaluation-config";

const isCanonical = (key: string): key is CanonicalKey =>
  Object.prototype.hasOwnProperty.call(CANONICAL_KEYS, key);

describe("canonical key dictionary (drift guard)", () => {
  it("every landing-page question key is a member of CANONICAL_KEYS", () => {
    const offenders = landingPageQuestions.map((q) => q.key).filter((k) => !isCanonical(k));
    expect(offenders).toEqual([]);
  });

  it("every detailed-evaluation question key is a member of CANONICAL_KEYS", () => {
    const keys = detailedEvaluationSections.flatMap((s) => s.questions.map((q) => q.key));
    const offenders = keys.filter((k) => !isCanonical(k));
    expect(offenders).toEqual([]);
  });

  it("every relaunch-landing answer key is a member of CANONICAL_KEYS", async () => {
    const { questions } = await import("@/components/landing-relaunch/data");
    const keys = questions.flatMap((q) => q.options.flatMap((o) => Object.keys(o.set)));
    const offenders = keys.filter((k) => !isCanonical(k));
    expect(offenders).toEqual([]);
  });

  it("the dropped duplicate key applicant_named_executor is gone", () => {
    expect(isCanonical("applicant_named_executor")).toBe(false);
    const allKeys = [
      ...landingPageQuestions.map((q) => q.key),
      ...detailedEvaluationSections.flatMap((s) => s.questions.map((q) => q.key)),
    ];
    expect(allKeys).not.toContain("applicant_named_executor");
  });
});

describe("deriveFlags", () => {
  it("supports jurisdiction only when death in E&W and UK-domiciled", () => {
    expect(deriveFlags({ death_in_england_wales: true, deceased_domiciled_uk: true }).jurisdiction_supported).toBe(true);
    expect(deriveFlags({ death_in_england_wales: true, deceased_domiciled_uk: false }).jurisdiction_supported).toBe(false);
  });

  it("derives grant_of_probate when there is a will and the applicant is the named executor", () => {
    const flags = deriveFlags({ has_will: true, named_executor_in_will: true });
    expect(flags.probate_type).toBe("grant_of_probate");
  });

  it("derives letters_of_administration when there is a will but the applicant is not the executor", () => {
    const flags = deriveFlags({ has_will: true, named_executor_in_will: false });
    expect(flags.probate_type).toBe("letters_of_administration");
  });

  it("computes a partial flag map from a sparse (landing-stage) answer set", () => {
    const flags = deriveFlags({ has_will: false });
    expect(flags.has_will).toBe(false);
    expect(flags.probate_type).toBe("letters_of_administration");
  });

  it("splits structural blockers from the IHT timing warning (PS-5)", () => {
    const flags = deriveFlags({ number_of_applicants: 5, estate_excepted_from_iht: false });
    expect(flags.structural_blockers).toContain("Maximum of 4 applicants allowed");
    // IHT is a timing warning, never a structural blocker.
    expect(flags.structural_blockers.join(" ")).not.toMatch(/IHT/i);
    expect(flags.iht_timing_warning).toBeTruthy();
  });
});

describe("deriveGrantNeeded (PS-3)", () => {
  it("sole-name property → needed", () => {
    expect(deriveGrantNeeded({ owned_property: true, property_ownership: "sole" })).toBe("needed");
  });
  it("tenants-in-common property → needed", () => {
    expect(deriveGrantNeeded({ owned_property: true, property_ownership: "tenants_in_common" })).toBe("needed");
  });
  it("joint-tenant-only property → probably not needed (survivorship)", () => {
    expect(deriveGrantNeeded({ owned_property: true, property_ownership: "joint_tenants" })).toBe("probably_not_needed");
  });
  it("no property + small spread cash (low-threshold all 'no') → probably not needed", () => {
    expect(
      deriveGrantNeeded({
        owned_property: false,
        nsandi_over_5k: false,
        holds_direct_shares: false,
        single_provider_over_50k: false,
      }),
    ).toBe("probably_not_needed");
  });
  it("no property + NS&I/Premium Bonds > £5k → probably needed (the case the old logic missed)", () => {
    expect(deriveGrantNeeded({ owned_property: false, nsandi_over_5k: true })).toBe("probably_needed");
  });
  it("property ownership unclear → probably needed", () => {
    expect(deriveGrantNeeded({ owned_property: true, property_ownership: "not_sure" })).toBe("probably_needed");
  });
});

describe("deriveSpecialist (PS-4)", () => {
  it("insolvent → red", () => {
    expect(deriveSpecialist({ estate_insolvent: true }).specialistSeverity).toBe("red");
  });
  it("disputed → red", () => {
    expect(deriveSpecialist({ estate_disputed: true }).specialistSeverity).toBe("red");
  });
  it("foreign assets / trust / business → amber", () => {
    expect(deriveSpecialist({ deceased_foreign_assets: true }).specialistSeverity).toBe("amber");
    expect(deriveSpecialist({ trust_involvement: true }).specialistSeverity).toBe("amber");
    expect(deriveSpecialist({ business_or_farm_assets: true }).specialistSeverity).toBe("amber");
  });
  it("nothing → none", () => {
    const s = deriveSpecialist({});
    expect(s.specialistSeverity).toBe("none");
    expect(s.specialistSuggested).toBe(false);
  });
  it("red wins over amber when both present", () => {
    const s = deriveSpecialist({ estate_insolvent: true, trust_involvement: true });
    expect(s.specialistSeverity).toBe("red");
    expect(s.specialistReasons.length).toBe(2);
  });
});

describe("deriveAssessmentOutcome (PS-2)", () => {
  it("every assessment resolves to exactly one route", () => {
    const outcome = deriveAssessmentOutcome({ owned_property: true, property_ownership: "sole", has_will: true, named_executor_in_will: true });
    expect(["not_needed", "ineligible", "proceed"]).toContain(outcome.route);
  });
  it("probate probably not needed → not_needed", () => {
    expect(deriveAssessmentOutcome({ owned_property: true, property_ownership: "joint_tenants" }).route).toBe("not_needed");
  });
  it("wrong applicant is not dead-ended → ineligible (helper path)", () => {
    const outcome = deriveAssessmentOutcome({
      owned_property: true,
      property_ownership: "sole",
      has_will: true,
      named_executor_in_will: false,
    });
    expect(outcome.route).toBe("ineligible");
  });
  it("good fit → proceed with grant_of_probate", () => {
    const outcome = deriveAssessmentOutcome({
      owned_property: true,
      property_ownership: "sole",
      has_will: true,
      named_executor_in_will: true,
    });
    expect(outcome.route).toBe("proceed");
    expect(outcome.probateType).toBe("grant_of_probate");
  });
  it("advisory specialist flag never blocks proceed", () => {
    const outcome = deriveAssessmentOutcome({
      owned_property: true,
      property_ownership: "sole",
      has_will: true,
      named_executor_in_will: true,
      deceased_foreign_assets: true,
    });
    expect(outcome.route).toBe("proceed");
    expect(outcome.specialistSeverity).toBe("amber");
    expect(outcome.specialistSuggested).toBe(true);
  });
});

describe("deriveReadiness (PS-5)", () => {
  // A supported-jurisdiction base so application_blocked is false.
  const JURISDICTION = { death_in_england_wales: true, deceased_domiciled_uk: true };
  const baseFlags = () => deriveFlags({ ...JURISDICTION, has_will: true, named_executor_in_will: true });

  it("red flag → specialist route, payment blocked", () => {
    const flags = deriveFlags({ ...JURISDICTION, has_will: true, named_executor_in_will: true, estate_insolvent: true });
    const r = deriveReadiness(flags, { applicantIsEntitled: true });
    expect(r.route).toBe("specialist");
    expect(r.canPay).toBe(false);
  });
  it("amber blocks payment until acknowledged", () => {
    const flags = deriveFlags({ ...JURISDICTION, has_will: true, named_executor_in_will: true, trust_involvement: true });
    expect(deriveReadiness(flags, { applicantIsEntitled: true, amberAcknowledged: false }).canPay).toBe(false);
    expect(deriveReadiness(flags, { applicantIsEntitled: true, amberAcknowledged: true }).canPay).toBe(true);
  });
  it("structural blocker → fix_required, but payment still allowed (severity none)", () => {
    const flags = deriveFlags({ ...JURISDICTION, has_will: true, named_executor_in_will: true, number_of_applicants: 5 });
    const r = deriveReadiness(flags, { applicantIsEntitled: true });
    expect(r.route).toBe("fix_required");
    expect(r.canPay).toBe(true);
    expect(r.canSubmit).toBe(false);
  });
  it("helper can pay but cannot submit", () => {
    const r = deriveReadiness(baseFlags(), { applicantRole: "helper", statementOfTruthSigned: true });
    expect(r.route).toBe("handoff");
    expect(r.canPay).toBe(true);
    expect(r.canSubmit).toBe(false);
  });
  it("entitled + signed + no blockers → ready and submittable", () => {
    const r = deriveReadiness(baseFlags(), {
      applicantIsEntitled: true,
      statementOfTruthSigned: true,
      structuralRequirementsMet: true,
    });
    expect(r.route).toBe("ready");
    expect(r.canSubmit).toBe(true);
  });
  it("IHT timing warning does not block payment", () => {
    const flags = deriveFlags({ ...JURISDICTION, has_will: true, named_executor_in_will: true, estate_excepted_from_iht: false });
    const r = deriveReadiness(flags, { applicantIsEntitled: true });
    expect(r.ihtTimingWarning).toBeTruthy();
    expect(r.canPay).toBe(true);
  });
});

// Regression: a happy-path case whose short landing assessment never asked the
// jurisdiction questions must NOT be referred to a solicitor or have payment
// paused — but must also not be payable until jurisdiction is confirmed.
describe("jurisdiction gating (does not refer happy-path cases)", () => {
  it("does NOT block when the jurisdiction questions are unanswered", () => {
    const flags = deriveFlags({ has_will: true, named_executor_in_will: true });
    expect(flags.application_blocked).toBe(false);
    expect(flags.jurisdiction_supported).toBe(false); // unconfirmed, not excluded
  });

  it("blocks only on an explicit out-of-jurisdiction answer", () => {
    expect(deriveFlags({ death_in_england_wales: false }).application_blocked).toBe(true);
    expect(deriveFlags({ deceased_domiciled_uk: false }).application_blocked).toBe(true);
  });

  it("readiness: unanswered jurisdiction is not a specialist referral and is not yet payable", () => {
    const r = deriveReadiness(deriveFlags({ has_will: true, named_executor_in_will: true }), {});
    expect(r.route).not.toBe("specialist");
    expect(r.canPay).toBe(false);
  });

  it("readiness: explicit out-of-jurisdiction IS a specialist referral", () => {
    const r = deriveReadiness(deriveFlags({ death_in_england_wales: false }), {});
    expect(r.route).toBe("specialist");
    expect(r.canPay).toBe(false);
  });

  it("readiness: confirmed jurisdiction (no other flags) can pay", () => {
    const flags = deriveFlags({
      death_in_england_wales: true,
      deceased_domiciled_uk: true,
      has_will: true,
      named_executor_in_will: true,
    });
    expect(deriveReadiness(flags, { applicantIsEntitled: true }).canPay).toBe(true);
  });

  it("confirms jurisdiction from the DETAILED-evaluation keys, not just the landing key", () => {
    // The in-app evaluation asks deceased_lived_england_wales (+ deceased_domiciled_uk),
    // never death_in_england_wales. Answering those must confirm jurisdiction.
    const flags = deriveFlags({
      deceased_lived_england_wales: true,
      deceased_domiciled_uk: true,
      has_will: true,
      named_executor_in_will: true,
    });
    expect(flags.jurisdiction_supported).toBe(true);
    expect(flags.application_blocked).toBe(false);
    expect(deriveReadiness(flags, { applicantIsEntitled: true }).canPay).toBe(true);
  });

  it("excludes when the deceased explicitly did NOT live in England or Wales", () => {
    expect(deriveFlags({ deceased_lived_england_wales: false }).application_blocked).toBe(true);
  });
});
