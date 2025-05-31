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
    name: "Basic Assessment Complete",
    description: "Complete initial probate assessment to understand your requirements",
    requiredSections: ["applicant_details"],
    unlockedTasks: ["people_management"],
    unlockedTabs: ["people"],
    priority: 1
  },
  {
    id: "people_identified",
    name: "People & Roles Identified", 
    description: "Complete deceased and executor information",
    requiredSections: ["applicant_details", "deceased_details"],
    unlockedTasks: ["people_management", "deceased_forms"],
    unlockedTabs: ["people"],
    priority: 2
  },
  {
    id: "estate_scope_defined",
    name: "Estate Scope Defined",
    description: "Understand estate value and complexity",
    requiredSections: ["applicant_details", "deceased_details", "estate_overview"],
    unlockedTasks: ["people_management", "deceased_forms", "asset_gathering"],
    unlockedTabs: ["people", "assets"],
    priority: 3
  },
  {
    id: "full_evaluation_complete",
    name: "Full Evaluation Complete",
    description: "All evaluation sections completed - full probate workflow unlocked",
    requiredSections: ["applicant_details", "deceased_details", "estate_overview", "legal_requirements"],
    unlockedTasks: ["people_management", "deceased_forms", "asset_gathering", "liability_tracking", "document_collection", "legal_forms"],
    unlockedTabs: ["people", "assets", "liabilities", "documents", "tasks"],
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
  const unlockedMilestones = getMilestoneProgress(completedSections);
  const allUnlockedTabs = unlockedMilestones.flatMap(m => m.unlockedTabs);
  return [...new Set(allUnlockedTabs)]; // Remove duplicates
}

export function getNextMilestone(completedSections: string[]): Milestone | null {
  const completedMilestones = getMilestoneProgress(completedSections);
  const nextMilestone = MILESTONES.find(milestone => 
    !completedMilestones.some(completed => completed.id === milestone.id)
  );
  
  return nextMilestone || null;
}