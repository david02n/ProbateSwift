import { pgTable, text, serial, timestamp, boolean, integer, numeric, date, jsonb, primaryKey, uuid, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User model
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Keep legacy fields for backward compatibility with existing records.
  password: text("password"),
  lastLogin: timestamp("last_login"),
  isGuest: boolean("is_guest").default(false),
  firebaseUid: text("firebase_uid").unique(),
  photoURL: text("photo_url"),
});

// Intake model — the single canonical record for the whole customer journey.
// Replaces the former assessment_results + evaluation_responses split (PS-1).
//
// One row is created anonymously at the landing assessment (keyed by
// browserSessionId, with userId/caseId null). On signup it is *claimed*:
// userId/caseId are attached exactly once and are then immutable — never
// detached, never re-seeded (the claim-once invariant, enforced in storage).
export const intake = pgTable(
  "intake",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    browserSessionId: text("browser_session_id"), // anonymous identity, pre-auth
    userId: varchar("user_id").references(() => users.id), // nullable until claimed
    caseId: integer("case_id").references(() => probateCases.id), // nullable until claimed
    applicantRole: text("applicant_role").notNull().default("applicant"), // 'applicant' | 'helper'
    answers: jsonb("answers").$type<Record<string, any>>().notNull().default({}),
    derivedFlags: jsonb("derived_flags").$type<Record<string, any>>().notNull().default({}),
    email: text("email"), // optional resume/lead capture
    amberAcknowledgements: jsonb("amber_acknowledgements") // PS-5: { flagKey: { by, at } }
      .$type<Record<string, { by: string; at: string }>>()
      .notNull()
      .default({}),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_intake_browser_session").on(table.browserSessionId),
    index("IDX_intake_case").on(table.caseId),
  ],
);

// Relationships will be manually handled in queries

// Marketing leads model - anonymous early-access / notify-me captures from the
// relaunch landing page assessment (not tied to an authenticated user).
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  resultType: text("result_type"), // "good" | "complex" | "none" - assessment outcome at capture time
  assessmentData: jsonb("assessment_data").$type<Record<string, any>>(), // the answers that produced the result
  source: text("source").default("landing_assessment"), // where the capture happened
  createdAt: timestamp("created_at").defaultNow(),
});

// Probate case model - this represents a single probate application
export const probateCases = pgTable("probate_cases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  referenceNumber: text("reference_number").unique(), // Unique reference for the case
  status: text("status").notNull().default("draft"), // draft, submitted, approved, etc.
  deceasedFirstName: text("deceased_first_name"),
  deceasedLastName: text("deceased_last_name"),
  deceasedDateOfBirth: date("deceased_dob"),
  deceasedDateOfDeath: date("deceased_dod"),
  deceasedId: integer("deceased_id"), // Reference to the deceased person record
  estateValue: numeric("estate_value"), // Estimated total value of the estate
  ihtCompleted: boolean("iht_completed").default(false), // Inheritance tax form completed
  progress: integer("progress").default(0), // Progress percentage (0-100)
  estimatedCompletionDate: date("estimated_completion_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// People model - anyone involved in the probate process (executors, applicants, attorneys, etc.)
export const executors = pgTable("people", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Who created this person
  title: text("title"), // e.g. Mr, Mrs, Dr
  firstName: text("first_name").notNull(), // Maps to first_names
  middleNames: text("middle_names"), // Maps to middle_names
  lastName: text("last_name").notNull(), // Maps to last_name
  isNameDifferentInWill: boolean("is_name_different_in_will").default(false), // Whether their name is different in the will
  altNameInWill: text("alt_name_will"), // Maps to alt_name_will
  addressLine1: text("address_line1"), // Maps to address_line1
  addressLine2: text("address_line2"), // Maps to address_line2
  city: text("city"), // Maps to city (town or city)
  county: text("county"), // Maps to county
  postCode: text("post_code"), // Maps to postcode
  phoneHome: text("phone_home"), // Maps to phone_home
  phoneMobile: text("phone_mobile"), // Maps to phone_mobile
  email: text("email"), // Maps to email
  relationshipToDeceased: text("relationship"), // Maps to relationship
  isExecutor: boolean("is_executor").default(false), // Whether this person is an executor
  isApplicant: boolean("is_applicant").default(false), // Whether this person is the applicant
  isNotifying: boolean("is_notifying").default(false), // Whether this person is notifying only
  personPosition: integer("person_position"), // Internal position (1-4)
  status: text("status").default("profile_incomplete"), // completed, profile_incomplete, questionnaire_not_started
  needsMoreInfo: boolean("needs_more_info").default(false), // Flag for incomplete records
  documentId: integer("document_id"), // Reference to the document that created this person (e.g., death certificate)
  // Legacy fields maintained for compatibility
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Estate assets model - properties, bank accounts, investments, etc.
export const estateAssets = pgTable("estate_assets", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
  documentId: integer("document_id").references(() => documents.id), // Reference to the source document
  type: text("type").notNull(), // property, bank_account, investment, vehicle, etc.
  description: text("description").notNull(),
  value: numeric("value"),
  address: text("address"), // For properties
  accountNumber: text("account_number"), // For accounts/investments
  institution: text("institution"), // Bank/investment firm
  ownership: text("ownership").default("sole"), // sole, joint
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Estate liabilities model - debts, mortgages, loans, etc.
export const estateLiabilities = pgTable("estate_liabilities", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
  documentId: integer("document_id").references(() => documents.id), // Reference to the source document
  type: text("type").notNull(), // mortgage, loan, credit_card, utility, tax, funeral_expenses
  description: text("description").notNull(),
  amount: numeric("amount"),
  creditor: text("creditor"),
  accountNumber: text("account_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Documents model - uploaded files like will, death certificate, etc.
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Who uploaded the document
  type: text("type").notNull(), // will, death_certificate, iht_form, etc.
  filename: text("filename").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"), // MIME type
  storagePath: text("storage_path").notNull(),
  status: text("status").default("processing"), // processing, verified, rejected
  notes: text("notes"),
  metadata: jsonb("metadata").$type<{ includedInEstate?: boolean, estateItemType?: string, estateItemId?: number }>(), // For storing additional document info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Tasks model - probate process steps and tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("not_started"), // not_started, in_progress, completed, blocked
  type: text("type").notNull(), // document_upload, form_completion, information_gathering, etc.
  order: integer("order").notNull(), // For sequencing tasks
  isRequired: boolean("is_required").default(true),
  requiredDocumentTypes: text("required_document_types"), // JSON string of document types needed
  dependencies: text("dependencies"), // JSON string of task IDs that must be completed first
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Referral events (PS-5) — a logged warm-handoff to a partner solicitor.
// Created only after explicit user consent on a red specialist flag; carries a
// structured case summary for attribution (the opp-guided-triage revenue path).
export const referralEvents = pgTable("referral_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
  summary: jsonb("summary").$type<Record<string, any>>(),
  consentedAt: timestamp("consented_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    profileImageUrl: true,
  })
  .extend({
    email: z.string().email("Please enter a valid email address").optional(),
    profileImageUrl: z.string().optional(),
  });

export const upsertUserSchema = createInsertSchema(users)
  .pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    profileImageUrl: true,
  });

export const insertIntakeSchema = createInsertSchema(intake)
  .pick({
    browserSessionId: true,
    userId: true,
    caseId: true,
    applicantRole: true,
    answers: true,
    derivedFlags: true,
    email: true,
    amberAcknowledgements: true,
    completedAt: true,
  });

export const insertLeadSchema = createInsertSchema(leads)
  .pick({
    email: true,
    resultType: true,
    assessmentData: true,
    source: true,
  })
  .extend({
    email: z.string().email(),
  });

export const insertReferralEventSchema = createInsertSchema(referralEvents)
  .pick({
    caseId: true,
    userId: true,
    reasons: true,
    summary: true,
    consentedAt: true,
  });

export const insertProbateCaseSchema = createInsertSchema(probateCases)
  .pick({
    userId: true,
    deceasedFirstName: true,
    deceasedLastName: true,
    deceasedDateOfBirth: true,
    deceasedDateOfDeath: true,
    estateValue: true,
    ihtCompleted: true,
  });

export const insertExecutorSchema = createInsertSchema(executors)
  .pick({
    caseId: true,
    userId: true,
    title: true,
    firstName: true,
    middleNames: true,
    lastName: true,
    isNameDifferentInWill: true,
    altNameInWill: true,
    addressLine1: true,
    addressLine2: true,
    city: true,
    county: true,
    postCode: true,
    phoneHome: true,
    phoneMobile: true,
    email: true,
    relationshipToDeceased: true,
    isExecutor: true,
    isApplicant: true,
    isNotifying: true,
    personPosition: true,
    status: true,
    needsMoreInfo: true,
    documentId: true,
    // Legacy fields included for compatibility
    address: true,
    phone: true,
  });

export const insertEstateAssetSchema = createInsertSchema(estateAssets)
  .pick({
    caseId: true,
    documentId: true,
    type: true,
    description: true,
    value: true,
    address: true,
    accountNumber: true,
    institution: true,
    ownership: true,
    notes: true,
  });

export const insertEstateLiabilitySchema = createInsertSchema(estateLiabilities)
  .pick({
    caseId: true,
    documentId: true,
    type: true,
    description: true,
    amount: true,
    creditor: true,
    accountNumber: true,
    notes: true,
  });

export const insertDocumentSchema = createInsertSchema(documents)
  .pick({
    caseId: true,
    userId: true,
    type: true,
    filename: true,
    fileSize: true,
    fileType: true,
    storagePath: true,
    status: true,
    notes: true,
    metadata: true,
  });

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    caseId: true,
    title: true,
    description: true,
    status: true,
    type: true,
    order: true,
    isRequired: true,
    requiredDocumentTypes: true,
    dependencies: true,
  });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertIntake = z.infer<typeof insertIntakeSchema>;
export type Intake = typeof intake.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertReferralEvent = z.infer<typeof insertReferralEventSchema>;
export type ReferralEvent = typeof referralEvents.$inferSelect;

export type InsertProbateCase = z.infer<typeof insertProbateCaseSchema>;
export type ProbateCase = typeof probateCases.$inferSelect;

export type InsertExecutor = z.infer<typeof insertExecutorSchema>;
export type Executor = typeof executors.$inferSelect;

export type InsertEstateAsset = z.infer<typeof insertEstateAssetSchema>;
export type EstateAsset = typeof estateAssets.$inferSelect;

export type InsertEstateLiability = z.infer<typeof insertEstateLiabilitySchema>;
export type EstateLiability = typeof estateLiabilities.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Deceased Form Fields - stores detailed information about the deceased person
export const deceasedFormFields = pgTable("deceased_form_fields", {
  personId: integer("person_id").primaryKey().references(() => executors.id), // Foreign key to people table with role = deceased
  dateOfBirth: date("date_of_birth"), // Required
  dateOfDeath: date("date_of_death"), // Required
  wasKnownByOtherNames: boolean("was_known_by_other_names"), // Required
  otherNamesHeldAssets: jsonb("other_names_held_assets").$type<{ fullName: string }[]>(), // Array of names, required if wasKnownByOtherNames is true
  domicileInEnglandOrWales: boolean("domicile_in_england_or_wales"), // Required
  maritalStatus: text("marital_status"), // ENUM: never_married, widowed, married, divorced, separated
  marriedDate: date("married_date"), // Required if maritalStatus = married
  divorcedDate: date("divorced_date"), // Required if maritalStatus = divorced
  divorceCourt: text("divorce_court"), // Required if maritalStatus = divorced
  separatedDate: date("separated_date"), // Required if maritalStatus = separated
  separationCourt: text("separation_court"), // Required if maritalStatus = separated
  hadForeignAssets: boolean("had_foreign_assets"), // Required
  foreignAssetValueGbp: numeric("foreign_asset_value_gbp"), // Required if hadForeignAssets = true
  landWasSettled: boolean("land_was_settled"), // Required
  executorsApplying: boolean("executors_applying"), // Required, can be prepopulated from people[]
  hasAdoptionHistory: boolean("has_adoption_history"), // Required
  adoptedRelatives: jsonb("adopted_relatives").$type<{ name: string, relationship: string, adoptedInOrOut: string }[]>(), // Required if hasAdoptionHistory = true
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Deceased Form Fields types
export const insertDeceasedFormFieldsSchema = createInsertSchema(deceasedFormFields)
  .pick({
    personId: true,
    dateOfBirth: true,
    dateOfDeath: true,
    wasKnownByOtherNames: true,
    otherNamesHeldAssets: true,
    domicileInEnglandOrWales: true,
    maritalStatus: true,
    marriedDate: true,
    divorcedDate: true,
    divorceCourt: true,
    separatedDate: true,
    separationCourt: true,
    hadForeignAssets: true,
    foreignAssetValueGbp: true,
    landWasSettled: true,
    executorsApplying: true,
    hasAdoptionHistory: true,
    adoptedRelatives: true
  });

export type InsertDeceasedFormFields = z.infer<typeof insertDeceasedFormFieldsSchema>;
export type DeceasedFormFields = typeof deceasedFormFields.$inferSelect;
