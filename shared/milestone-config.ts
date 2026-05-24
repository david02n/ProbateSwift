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

  return tasks.sort((a, b) => a.priority - b.priority);
}