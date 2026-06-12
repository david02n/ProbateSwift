export interface Milestone {
  id: string;
  name: string;
  description: string;
  requiredSections: string[]; // Which evaluation sections must be completed
  unlockedTasks: string[]; // Which task categories get unlocked
  unlockedTabs: string[]; // Which dashboard tabs become available
  priority: number; // Order of milestone progression
}

export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  milestone: string; // Which milestone unlocks this category
  tasks: string[];
}

// Milestone progression system - like game levels
export const MILESTONES: Milestone[] = [
  {
    id: "basic_assessment",
    name: "Initial Assessment Complete",
    description: "You've completed the basic probate assessment - great start!",
    requiredSections: ["applicant_details"],
    unlockedTasks: ["people_management"],
    unlockedTabs: ["people", "assets", "liabilities", "documents", "tasks", "evaluation"],
    priority: 1
  },
  {
    id: "people_identified",
    name: "People & Roles Defined", 
    description: "You've identified key people and their roles in the probate process",
    requiredSections: ["applicant_details", "deceased_details"],
    unlockedTasks: ["people_management", "deceased_forms"],
    unlockedTabs: ["people", "assets", "liabilities", "documents", "tasks", "evaluation"],
    priority: 2
  },
  {
    id: "estate_scope_defined",
    name: "Estate Scope Understood",
    description: "You understand the estate value and complexity - well done!",
    requiredSections: ["applicant_details", "deceased_details", "estate_overview"],
    unlockedTasks: ["people_management", "deceased_forms", "asset_gathering"],
    unlockedTabs: ["people", "assets", "liabilities", "documents", "tasks", "evaluation"],
    priority: 3
  },
  {
    id: "full_evaluation_complete",
    name: "Comprehensive Assessment Complete",
    description: "Outstanding! You've completed the full evaluation and have all the insights needed",
    requiredSections: ["applicant_details", "deceased_details", "estate_overview", "legal_requirements"],
    unlockedTasks: ["people_management", "deceased_forms", "asset_gathering", "liability_tracking", "document_collection", "legal_forms"],
    unlockedTabs: ["people", "assets", "liabilities", "documents", "tasks", "evaluation"],
    priority: 4
  }
];

export const TASK_CATEGORIES: TaskCategory[] = [
  {
    id: "people_management",
    name: "People & Executors",
    description: "Manage executors, beneficiaries, and deceased person details",
    milestone: "basic_assessment",
    tasks: [
      "Add deceased person details",
      "Complete deceased form fields", 
      "Add co-executors",
      "Identify beneficiaries"
    ]
  },
  {
    id: "deceased_forms",
    name: "Deceased Information",
    description: "Complete detailed deceased person information required for probate",
    milestone: "people_identified", 
    tasks: [
      "Complete deceased personal details",
      "Record marriage/civil partnership details",
      "Document any name changes",
      "Record foreign assets (if any)",
      "Complete adoption history (if applicable)"
    ]
  },
  {
    id: "asset_gathering",
    name: "Estate Assets",
    description: "Identify and value all estate assets",
    milestone: "estate_scope_defined",
    tasks: [
      "List property assets",
      "Record bank accounts", 
      "Document investments",
      "Value personal possessions",
      "Calculate total estate value"
    ]
  },
  {
    id: "liability_tracking", 
    name: "Estate Liabilities",
    description: "Record all debts and liabilities",
    milestone: "full_evaluation_complete",
    tasks: [
      "List outstanding debts",
      "Record funeral expenses",
      "Document tax liabilities",
      "Calculate net estate value"
    ]
  },
  {
    id: "document_collection",
    name: "Document Collection",
    description: "Gather all required legal documents",
    milestone: "full_evaluation_complete", 
    tasks: [
      "Obtain death certificate",
      "Locate will (if exists)",
      "Gather asset documentation",
      "Collect identity documents"
    ]
  },
  {
    id: "legal_forms",
    name: "Legal Forms & Submission",
    description: "Complete and submit probate application",
    milestone: "full_evaluation_complete",
    tasks: [
      "Complete PA1P/PA1A form",
      "Complete IHT forms",
      "Submit probate application", 
      "Pay probate fees"
    ]
  }
];

// Helper functions for milestone logic
export function getMilestoneProgress(completedSections: string[]): Milestone[] {
  return MILESTONES.filter(milestone => 
    milestone.requiredSections.every(section => 
      completedSections.includes(section)
    )
  ).sort((a, b) => a.priority - b.priority);
}

export function getUnlockedTasks(completedSections: string[]): TaskCategory[] {
  const unlockedMilestones = getMilestoneProgress(completedSections);
  const unlockedMilestoneIds = unlockedMilestones.map(m => m.id);
  
  return TASK_CATEGORIES.filter(category =>
    unlockedMilestoneIds.includes(category.milestone)
  );
}

export function getUnlockedTabs(completedSections: string[]): string[] {
  // Always return all tabs - don't restrict access, just use for progress tracking
  return ["people", "assets", "liabilities", "documents", "tasks", "evaluation"];
}

export function getNextMilestone(completedSections: string[]): Milestone | null {
  const completedMilestones = getMilestoneProgress(completedSections);
  const nextMilestone = MILESTONES.find(milestone =>
    !completedMilestones.some(completed => completed.id === milestone.id)
  );

  return nextMilestone || null;
}

// ── Personalised task list ────────────────────────────────────────────────────
// Generated from evaluation derivedFlags — these are the specific legal steps
// *this* user needs to take, as opposed to the generic milestone stages above.

export interface PersonalisedTask {
  id: string;
  title: string;
  description: string;
  category: "documents" | "forms" | "people" | "legal" | "advice";
  /** Dashboard tab to navigate to when the user clicks the task */
  tab?: string;
  priority: number; // lower = higher priority
}

export function generatePersonalisedTasks(
  flags: Record<string, any> | null | undefined
): PersonalisedTask[] {
  if (!flags) return [];

  const tasks: PersonalisedTask[] = [];

  // ── Jurisdiction / eligibility ───────────────────────────────────────────
  if (flags.application_blocked) {
    tasks.push({
      id: "blocked_specialist",
      title: "Consult a probate specialist",
      description: flags.blocker_reason
        ? `Your application requires specialist guidance: ${flags.blocker_reason}`
        : "Your situation falls outside our standard process — please seek legal advice.",
      category: "advice",
      priority: 0,
    });
    // Return early — no point listing steps they can't yet take
    return tasks;
  }

  // ── Application type ─────────────────────────────────────────────────────
  if (flags.probate_type === "grant_of_probate") {
    tasks.push({
      id: "pa1p_form",
      title: "Complete PA1P probate application form",
      description: "As executor of the estate you will apply for a Grant of Probate using form PA1P.",
      category: "forms",
      tab: "documents",
      priority: 20,
    });
  } else if (flags.probate_type === "letters_of_administration") {
    tasks.push({
      id: "pa1a_form",
      title: "Complete PA1A letters of administration form",
      description: "With no will, you will apply for Letters of Administration using form PA1A.",
      category: "forms",
      tab: "documents",
      priority: 20,
    });
  }

  // ── Will ─────────────────────────────────────────────────────────────────
  if (flags.has_will) {
    tasks.push({
      id: "upload_will",
      title: "Upload the original will",
      description: "The original signed will (and any codicils) must be submitted with the probate application.",
      category: "documents",
      tab: "documents",
      priority: 10,
    });
  }

  if (flags.needs_renunciation_form) {
    tasks.push({
      id: "renunciation",
      title: "Obtain executor renunciation forms",
      description: "One or more named executors are not applying. They must each sign a deed of renunciation (PA15).",
      category: "forms",
      priority: 15,
    });
  }

  if (flags.needs_translation) {
    tasks.push({
      id: "translations",
      title: "Arrange certified translations",
      description: "Foreign-language documents must be accompanied by certified English translations.",
      category: "documents",
      priority: 12,
    });
  }

  // ── Inheritance tax ──────────────────────────────────────────────────────
  if (flags.iht400_required) {
    tasks.push({
      id: "iht400",
      title: "Complete IHT400 inheritance tax form",
      description: "The estate exceeds the excepted estate threshold. Submit IHT400 to HMRC before the probate application.",
      category: "forms",
      priority: 18,
    });
    tasks.push({
      id: "iht400_submit",
      title: "Pay any inheritance tax due to HMRC",
      description: "Inheritance tax must be paid (or a payment arrangement agreed) before probate will be granted.",
      category: "legal",
      priority: 19,
    });
  } else if (flags.estate_likely_excepted) {
    tasks.push({
      id: "excepted_estate",
      title: "Complete excepted estate declaration",
      description: "The estate appears to fall below the IHT threshold. Complete the excepted estate form (IHT205 or Estate Return) to confirm.",
      category: "forms",
      priority: 18,
    });
  }

  // ── Alias / name ─────────────────────────────────────────────────────────
  if (flags.needs_alias_details) {
    tasks.push({
      id: "alias_evidence",
      title: "Provide alias name evidence",
      description: "The deceased held assets under a different name. Prepare evidence (e.g. marriage certificate, deed poll) to explain the alias.",
      category: "documents",
      tab: "documents",
      priority: 11,
    });
  }

  // ── People / executors ───────────────────────────────────────────────────
  tasks.push({
    id: "death_certificate",
    title: "Obtain the official death certificate",
    description: "You will need at least one certified copy of the death certificate. Banks and institutions often require originals.",
    category: "documents",
    tab: "documents",
    priority: 5,
  });

  tasks.push({
    id: "add_deceased_details",
    title: "Add full deceased person details",
    description: "Enter the deceased person's full legal name, date of birth, date of death, and last address into the system.",
    category: "people",
    tab: "people",
    priority: 6,
  });

  // ── Specialist advice ────────────────────────────────────────────────────
  if (flags.needs_specialist_advice) {
    tasks.push({
      id: "specialist_advice",
      title: "Consult a probate solicitor",
      description: "Your situation includes factors (foreign assets, trusts, or adoption) that may require specialist legal advice.",
      category: "advice",
      priority: 1,
    });
  }

  // ── Submission ───────────────────────────────────────────────────────────
  tasks.push({
    id: "swear_oath",
    title: "Swear the oath / make a statement of truth",
    description: "You will need to attend a solicitor or probate registry to swear the oath or sign a statement of truth before submitting.",
    category: "legal",
    priority: 25,
  });

  tasks.push({
    id: "submit_application",
    title: "Submit the probate application",
    description: "Send the completed application, will (if applicable), IHT forms, and fee to the Probate Registry.",
    category: "legal",
    priority: 30,
  });

  // ── Grant & administration (phases 6–7) ──────────────────────────────────
  tasks.push({
    id: "order_office_copies",
    title: "Order sealed office copies of the grant",
    description: "Once the grant is issued, order extra sealed copies (about £1.50 each) — one for each bank or asset holder you need to deal with.",
    category: "legal",
    priority: 40,
  });

  tasks.push({
    id: "collect_assets",
    title: "Collect in the estate's money and assets",
    description: "Send a sealed copy of the grant to each bank and institution to release funds, and sell or transfer property as needed.",
    category: "legal",
    priority: 41,
  });

  tasks.push({
    id: "gazette_notice",
    title: "Place a creditors' notice (Gazette + local paper)",
    description: "Protect yourself as executor by advertising for unknown creditors. There is a two-month window before you can safely distribute.",
    category: "legal",
    priority: 42,
  });

  tasks.push({
    id: "estate_accounts",
    title: "Prepare the estate accounts",
    description: "Record everything that came in and went out, settle debts and any tax, and show what each beneficiary will receive.",
    category: "legal",
    priority: 43,
  });

  tasks.push({
    id: "distribute_estate",
    title: "Distribute the estate to the beneficiaries",
    description: "Once debts, tax and the creditor window are cleared, pay out what's due. Hold the final distribution until about six months after the grant.",
    category: "people",
    priority: 44,
  });

  return tasks.sort((a, b) => a.priority - b.priority);
}

// ── Guided 7-phase journey (sol-guided-tasklist-ux, dec-lifecycle-scope) ────────
// The branchy, ~9–18 month journey rendered as one list that feels linear. The
// catalog above is grouped into seven phases; per-task state is overlaid from
// the caseTasks store so "your move" / "awaiting reply" momentum survives reloads.

export interface Phase {
  number: number;
  id: string;
  name: string;
  description: string;
}

export const PHASES: Phase[] = [
  { number: 1, id: "qualify",      name: "Qualify",                 description: "Confirm probate is needed and that you're the right person to apply." },
  { number: 2, id: "value",        name: "Value the estate",        description: "Find out what everything was worth on the date of death." },
  { number: 3, id: "iht_prepare",  name: "Prepare the IHT return",  description: "Work out the inheritance tax position and complete the right forms." },
  { number: 4, id: "iht_pay",      name: "Pay & submit IHT",        description: "Pay anything due and send the inheritance tax return to HMRC." },
  { number: 5, id: "apply",        name: "Apply for probate",       description: "Complete and send the probate application to the registry." },
  { number: 6, id: "grant",        name: "Grant issued",            description: "The grant arrives — order sealed copies for the institutions." },
  { number: 7, id: "administer",   name: "Administer & distribute", description: "Collect the assets, settle debts, and pay the beneficiaries." },
];

// Which phase each catalog task belongs to, and whether it's safe to start early
// (parallel-prep: no dependency on outstanding values or the grant).
const TASK_META: Record<string, { phase: number; parallelPrep?: boolean }> = {
  blocked_specialist:   { phase: 1 },
  specialist_advice:    { phase: 1 },
  death_certificate:    { phase: 2 },
  add_deceased_details: { phase: 2 },
  upload_will:          { phase: 2, parallelPrep: true },
  alias_evidence:       { phase: 2, parallelPrep: true },
  translations:         { phase: 2, parallelPrep: true },
  excepted_estate:      { phase: 3 },
  iht400:               { phase: 3 },
  iht400_submit:        { phase: 4 },
  renunciation:         { phase: 5, parallelPrep: true },
  pa1p_form:            { phase: 5 },
  pa1a_form:            { phase: 5 },
  swear_oath:           { phase: 5 },
  submit_application:   { phase: 5 },
  order_office_copies:  { phase: 6 },
  collect_assets:       { phase: 7 },
  gazette_notice:       { phase: 7 },
  estate_accounts:      { phase: 7 },
  distribute_estate:    { phase: 7 },
};
const DEFAULT_TASK_PHASE = 2;

export type TaskStatus = "your_move" | "awaiting" | "done" | "skipped";

/** Persisted per-task overlay state, keyed by task id. */
export interface TaskState {
  status: TaskStatus;
  awaitingSince?: string | null;
  note?: string | null;
}

export interface GuidedTask extends PersonalisedTask {
  phase: number;
  parallelPrep: boolean;
  status: TaskStatus;
  awaitingSince?: string | null;
}

export interface GuidedPhase extends Phase {
  state: "done" | "now" | "upcoming";
  doneCount: number;
  total: number;
}

export interface GuidedView {
  phases: GuidedPhase[];
  currentPhase: number;
  currentPhaseTasks: GuidedTask[];
  nextStep: GuidedTask | null;
  parallelPrep: GuidedTask[];
  percentComplete: number;
}

/**
 * Resolve the branchy catalog + saved task state into one guided, linear-feeling
 * view: which phase you're in, the single next step, what's parked awaiting a
 * reply, and head-start tasks you can do while you wait.
 */
export function computeGuidedView(
  flags: Record<string, any> | null | undefined,
  states: Record<string, TaskState> = {},
): GuidedView {
  const enriched: GuidedTask[] = generatePersonalisedTasks(flags).map((t) => {
    const meta = TASK_META[t.id];
    const st = states[t.id];
    return {
      ...t,
      phase: meta?.phase ?? DEFAULT_TASK_PHASE,
      parallelPrep: meta?.parallelPrep ?? false,
      status: st?.status ?? "your_move",
      awaitingSince: st?.awaitingSince ?? null,
    };
  });

  const counts = (n: number) => {
    const inPhase = enriched.filter((t) => t.phase === n && t.status !== "skipped");
    const done = inPhase.filter((t) => t.status === "done").length;
    return { done, total: inPhase.length };
  };

  // Current phase = the first phase that still has unfinished tasks. Empty phases
  // (e.g. IHT phases for an excepted estate) are treated as already cleared.
  let currentPhase = PHASES.length;
  for (const p of PHASES) {
    const { done, total } = counts(p.number);
    if (total > 0 && done < total) {
      currentPhase = p.number;
      break;
    }
  }

  const phases: GuidedPhase[] = PHASES.map((p) => {
    const { done, total } = counts(p.number);
    const state: GuidedPhase["state"] =
      p.number < currentPhase ? "done" : p.number === currentPhase ? "now" : "upcoming";
    return { ...p, state, doneCount: done, total };
  });

  const currentPhaseTasks = enriched
    .filter((t) => t.phase === currentPhase && t.status !== "skipped")
    .sort((a, b) => a.priority - b.priority);

  // The one elevated next step: the highest-priority actionable, non-parked task
  // in the current phase, preferring critical-path over parallel-prep.
  const actionable = currentPhaseTasks.filter((t) => t.status === "your_move");
  const nextStep =
    actionable.find((t) => !t.parallelPrep) ?? actionable[0] ?? null;

  // Head-start tasks: parallel-prep items from the current or later phases that
  // aren't done — surfaced so the screen is never a blank "wait".
  const parallelPrep = enriched
    .filter((t) => t.parallelPrep && t.status === "your_move" && t.id !== nextStep?.id)
    .sort((a, b) => a.phase - b.phase || a.priority - b.priority);

  // Phase-weighted progress: whole completed phases + fraction of the current one.
  const cur = counts(currentPhase);
  const completedPhases = currentPhase - 1;
  const fraction = cur.total > 0 ? cur.done / cur.total : 0;
  const percentComplete = Math.min(
    100,
    Math.round(((completedPhases + fraction) / PHASES.length) * 100),
  );

  return { phases, currentPhase, currentPhaseTasks, nextStep, parallelPrep, percentComplete };
}