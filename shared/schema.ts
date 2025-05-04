import { pgTable, text, serial, timestamp, boolean, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isGuest: boolean("is_guest").default(false),
});

// Assessment results model
export const assessmentResults = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isProbateRequired: boolean("is_probate_required"),
  probateType: text("probate_type"), // "grant_of_probate", "letters_of_administration", etc.
  hasWill: boolean("has_will"),
  isInsolvent: boolean("is_insolvent"),
  hasDispute: boolean("has_dispute"),
  assessmentData: text("assessment_data"), // JSON string of all answers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Probate case model - this represents a single probate application
export const probateCases = pgTable("probate_cases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  assessmentId: integer("assessment_id").references(() => assessmentResults.id),
  referenceNumber: text("reference_number").unique(), // Unique reference for the case
  status: text("status").notNull().default("draft"), // draft, submitted, approved, etc.
  deceasedFirstName: text("deceased_first_name"),
  deceasedLastName: text("deceased_last_name"),
  deceasedDateOfBirth: date("deceased_dob"),
  deceasedDateOfDeath: date("deceased_dod"),
  estateValue: numeric("estate_value"), // Estimated total value of the estate
  ihtCompleted: boolean("iht_completed").default(false), // Inheritance tax form completed
  progress: integer("progress").default(0), // Progress percentage (0-100)
  estimatedCompletionDate: date("estimated_completion_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Executors model - people responsible for administering the estate
export const executors = pgTable("executors", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // Who created this executor
  isApplicant: boolean("is_applicant").default(false), // Whether this executor is the applicant
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postCode: text("post_code"),
  relationshipToDeceased: text("relationship"),
  isNotifying: boolean("is_notifying").default(false), // Whether this executor is notifying only
  status: text("status").default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationships will be manually handled in queries

// Estate assets model - properties, bank accounts, investments, etc.
export const estateAssets = pgTable("estate_assets", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => probateCases.id).notNull(),
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
  userId: integer("user_id").references(() => users.id).notNull(), // Who uploaded the document
  type: text("type").notNull(), // will, death_certificate, iht_form, etc.
  filename: text("filename").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"), // MIME type
  storagePath: text("storage_path").notNull(),
  status: text("status").default("processing"), // processing, verified, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relationships for documents
export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(probateCases, {
    fields: [documents.caseId],
    references: [probateCases.id],
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

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

// Define relationships for tasks
export const tasksRelations = relations(tasks, ({ one }) => ({
  case: one(probateCases, {
    fields: [tasks.caseId],
    references: [probateCases.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    email: true,
    password: true,
    firstName: true,
    lastName: true,
    isGuest: true,
  })
  .extend({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export const insertAssessmentResultSchema = createInsertSchema(assessmentResults)
  .pick({
    userId: true,
    isProbateRequired: true,
    probateType: true,
    hasWill: true,
    isInsolvent: true,
    hasDispute: true,
    assessmentData: true,
  });

export const insertProbateCaseSchema = createInsertSchema(probateCases)
  .pick({
    userId: true,
    assessmentId: true,
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
    isApplicant: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    address: true,
    city: true,
    postCode: true,
    relationshipToDeceased: true,
    isNotifying: true,
    status: true,
  });

export const insertEstateAssetSchema = createInsertSchema(estateAssets)
  .pick({
    caseId: true,
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
export type User = typeof users.$inferSelect;

export type InsertAssessmentResult = z.infer<typeof insertAssessmentResultSchema>;
export type AssessmentResult = typeof assessmentResults.$inferSelect;

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
