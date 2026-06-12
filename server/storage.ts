import {
  users,
  sessions,
  intake,
  probateCases,
  executors,
  estateAssets,
  estateLiabilities,
  documents,
  tasks,
  deceasedFormFields,
  type User,
  type UpsertUser,
  type Intake,
  type InsertIntake,
  leads,
  type Lead,
  type InsertLead,
  referralEvents,
  type ReferralEvent,
  type InsertReferralEvent,
  payments,
  type Payment,
  type InsertPayment,
  caseTasks,
  type CaseTask,
  type InsertCaseTask,
  type ProbateCase,
  type InsertProbateCase,
  type Executor,
  type InsertExecutor,
  type EstateAsset,
  type InsertEstateAsset,
  type EstateLiability,
  type InsertEstateLiability,
  type Document,
  type InsertDocument,
  type Task,
  type InsertTask,
  type DeceasedFormFields,
  type InsertDeceasedFormFields
} from "@shared/schema";
import { db, hasDatabase } from "./db";
import { eq, and, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  createLead(lead: InsertLead): Promise<Lead>;

  getProbateCase(id: number): Promise<ProbateCase | undefined>;
  getProbateCasesByUserId(userId: string): Promise<ProbateCase[]>;
  createProbateCase(caseData: InsertProbateCase): Promise<ProbateCase>;
  updateProbateCase(id: number, caseData: Partial<InsertProbateCase>): Promise<ProbateCase | undefined>;

  getExecutor(id: number): Promise<Executor | undefined>;
  getExecutorsByCaseId(caseId: number): Promise<Executor[]>;
  getPeopleByCaseId(caseId: number): Promise<Executor[]>;
  createExecutor(executorData: InsertExecutor): Promise<Executor>;
  updateExecutor(id: number, executorData: Partial<InsertExecutor>): Promise<Executor | undefined>;
  deleteExecutor(id: number): Promise<void>;

  getEstateAsset(id: number): Promise<EstateAsset | undefined>;
  getEstateAssetsByCaseId(caseId: number): Promise<EstateAsset[]>;
  createEstateAsset(assetData: InsertEstateAsset): Promise<EstateAsset>;
  updateEstateAsset(id: number, assetData: Partial<InsertEstateAsset>): Promise<EstateAsset | undefined>;
  deleteEstateAsset(id: number): Promise<void>;

  getEstateLiability(id: number): Promise<EstateLiability | undefined>;
  getEstateLiabilitiesByCaseId(caseId: number): Promise<EstateLiability[]>;
  createEstateLiability(liabilityData: InsertEstateLiability): Promise<EstateLiability>;
  updateEstateLiability(id: number, liabilityData: Partial<InsertEstateLiability>): Promise<EstateLiability | undefined>;
  deleteEstateLiability(id: number): Promise<void>;

  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByCaseId(caseId: number): Promise<Document[]>;
  getDocumentsByType(caseId: number, type: string): Promise<Document[]>;
  createDocument(documentData: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined>;

  getTask(id: number): Promise<Task | undefined>;
  getTasksByCaseId(caseId: number): Promise<Task[]>;
  createTask(taskData: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined>;

  getDeceasedFormFields(personId: number): Promise<DeceasedFormFields | undefined>;
  createDeceasedFormFields(data: InsertDeceasedFormFields): Promise<DeceasedFormFields>;
  updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined>;
  isDeceasedFormFieldsComplete(personId: number): Promise<boolean>;
  getDeceasedFormFieldsCompletionStatus(personId: number): Promise<{ complete: boolean; missingFields: string[] }>;

  // Intake (PS-1) — single canonical record; replaces assessment + evaluation stores.
  getIntakeByCaseId(caseId: number): Promise<Intake | undefined>;
  getIntakeByBrowserSession(browserSessionId: string): Promise<Intake | undefined>;
  createIntake(data: InsertIntake): Promise<Intake>;
  updateIntake(id: string, data: Partial<InsertIntake>): Promise<Intake | undefined>;
  /** Claim-once: attach userId/caseId to an anonymous row, only if currently unclaimed. */
  claimIntake(browserSessionId: string, userId: string, caseId: number): Promise<Intake | undefined>;

  // Referral events (PS-5)
  createReferralEvent(data: InsertReferralEvent): Promise<ReferralEvent>;
  getReferralEventsByCaseId(caseId: number): Promise<ReferralEvent[]>;

  // Payments (Phase C) — £295 flat fee, charged at submission.
  createPayment(data: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  getPaymentsByCaseId(caseId: number): Promise<Payment[]>;
  getPaymentByCheckoutSessionId(sessionId: string): Promise<Payment | undefined>;

  // Case task state (Phase B) — guided task list overlay.
  getCaseTasksByCaseId(caseId: number): Promise<CaseTask[]>;
  upsertCaseTask(caseId: number, taskKey: string, data: Partial<InsertCaseTask>): Promise<CaseTask>;
}

class MemoryStorage implements IStorage {
  private users = new Map<string, User>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      password: null,
      lastLogin: null,
      isGuest: false,
      firebaseUid: null,
      photoURL: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async createLead(): Promise<Lead> { throw new Error("Database is not configured"); }
  async getProbateCase(): Promise<ProbateCase | undefined> { return undefined; }
  async getProbateCasesByUserId(): Promise<ProbateCase[]> { return []; }
  async createProbateCase(): Promise<ProbateCase> { throw new Error("Database is not configured"); }
  async updateProbateCase(): Promise<ProbateCase | undefined> { throw new Error("Database is not configured"); }
  async getExecutor(): Promise<Executor | undefined> { return undefined; }
  async getExecutorsByCaseId(): Promise<Executor[]> { return []; }
  async getPeopleByCaseId(): Promise<Executor[]> { return []; }
  async createExecutor(): Promise<Executor> { throw new Error("Database is not configured"); }
  async updateExecutor(): Promise<Executor | undefined> { throw new Error("Database is not configured"); }
  async deleteExecutor(): Promise<void> { throw new Error("Database is not configured"); }
  async getEstateAsset(): Promise<EstateAsset | undefined> { return undefined; }
  async getEstateAssetsByCaseId(): Promise<EstateAsset[]> { return []; }
  async createEstateAsset(): Promise<EstateAsset> { throw new Error("Database is not configured"); }
  async updateEstateAsset(): Promise<EstateAsset | undefined> { throw new Error("Database is not configured"); }
  async deleteEstateAsset(): Promise<void> { throw new Error("Database is not configured"); }
  async getEstateLiability(): Promise<EstateLiability | undefined> { return undefined; }
  async getEstateLiabilitiesByCaseId(): Promise<EstateLiability[]> { return []; }
  async createEstateLiability(): Promise<EstateLiability> { throw new Error("Database is not configured"); }
  async updateEstateLiability(): Promise<EstateLiability | undefined> { throw new Error("Database is not configured"); }
  async deleteEstateLiability(): Promise<void> { throw new Error("Database is not configured"); }
  async getDocument(): Promise<Document | undefined> { return undefined; }
  async getDocumentsByCaseId(): Promise<Document[]> { return []; }
  async getDocumentsByType(): Promise<Document[]> { return []; }
  async createDocument(): Promise<Document> { throw new Error("Database is not configured"); }
  async updateDocument(): Promise<Document | undefined> { throw new Error("Database is not configured"); }
  async getTask(): Promise<Task | undefined> { return undefined; }
  async getTasksByCaseId(): Promise<Task[]> { return []; }
  async createTask(): Promise<Task> { throw new Error("Database is not configured"); }
  async updateTask(): Promise<Task | undefined> { throw new Error("Database is not configured"); }
  async getDeceasedFormFields(): Promise<DeceasedFormFields | undefined> { return undefined; }
  async createDeceasedFormFields(): Promise<DeceasedFormFields> { throw new Error("Database is not configured"); }
  async updateDeceasedFormFields(): Promise<DeceasedFormFields | undefined> { throw new Error("Database is not configured"); }
  async isDeceasedFormFieldsComplete(): Promise<boolean> { return false; }
  async getDeceasedFormFieldsCompletionStatus(): Promise<{ complete: boolean; missingFields: string[] }> {
    return { complete: false, missingFields: ["Database is not configured"] };
  }
  async getIntakeByCaseId(): Promise<Intake | undefined> { return undefined; }
  async getIntakeByBrowserSession(): Promise<Intake | undefined> { return undefined; }
  async createIntake(): Promise<Intake> { throw new Error("Database is not configured"); }
  async updateIntake(): Promise<Intake | undefined> { throw new Error("Database is not configured"); }
  async claimIntake(): Promise<Intake | undefined> { throw new Error("Database is not configured"); }
  async createReferralEvent(): Promise<ReferralEvent> { throw new Error("Database is not configured"); }
  async getReferralEventsByCaseId(): Promise<ReferralEvent[]> { return []; }
  async createPayment(): Promise<Payment> { throw new Error("Database is not configured"); }
  async updatePayment(): Promise<Payment | undefined> { throw new Error("Database is not configured"); }
  async getPaymentsByCaseId(): Promise<Payment[]> { return []; }
  async getPaymentByCheckoutSessionId(): Promise<Payment | undefined> { return undefined; }
  async getCaseTasksByCaseId(): Promise<CaseTask[]> { return []; }
  async upsertCaseTask(): Promise<CaseTask> { throw new Error("Database is not configured"); }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!db) {
      throw new Error("Database is not configured");
    }
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [result] = await db!
      .insert(leads)
      .values(lead)
      .returning();
    return result;
  }

  // Probate Case methods
  async getProbateCase(id: number): Promise<ProbateCase | undefined> {
    const [probateCase] = await db!.select().from(probateCases).where(eq(probateCases.id, id));
    return probateCase;
  }

  async getProbateCasesByUserId(userId: string): Promise<ProbateCase[]> {
    return await db!.select().from(probateCases).where(eq(probateCases.userId, userId));
  }

  async createProbateCase(caseData: InsertProbateCase): Promise<ProbateCase> {
    const [probateCase] = await db!
      .insert(probateCases)
      .values(caseData)
      .returning();
    return probateCase;
  }

  async updateProbateCase(id: number, caseData: Partial<InsertProbateCase>): Promise<ProbateCase | undefined> {
    const [probateCase] = await db!
      .update(probateCases)
      .set({ ...caseData, updatedAt: new Date() })
      .where(eq(probateCases.id, id))
      .returning();
    return probateCase;
  }

  // People/Executor methods
  async getExecutor(id: number): Promise<Executor | undefined> {
    const [executor] = await db!.select().from(executors).where(eq(executors.id, id));
    return executor;
  }

  async getExecutorsByCaseId(caseId: number): Promise<Executor[]> {
    return await db!.select().from(executors).where(eq(executors.caseId, caseId));
  }

  async getPeopleByCaseId(caseId: number): Promise<Executor[]> {
    return await db!.select().from(executors).where(eq(executors.caseId, caseId));
  }

  async createExecutor(executorData: InsertExecutor): Promise<Executor> {
    const [executor] = await db!
      .insert(executors)
      .values(executorData)
      .returning();
    return executor;
  }

  async updateExecutor(id: number, executorData: Partial<InsertExecutor>): Promise<Executor | undefined> {
    const [executor] = await db!
      .update(executors)
      .set({ ...executorData, updatedAt: new Date() })
      .where(eq(executors.id, id))
      .returning();
    return executor;
  }

  async deleteExecutor(id: number): Promise<void> {
    await db!.delete(executors).where(eq(executors.id, id));
  }

  // Estate Asset methods
  async getEstateAsset(id: number): Promise<EstateAsset | undefined> {
    const [asset] = await db!.select().from(estateAssets).where(eq(estateAssets.id, id));
    return asset;
  }

  async getEstateAssetsByCaseId(caseId: number): Promise<EstateAsset[]> {
    return await db!.select().from(estateAssets).where(eq(estateAssets.caseId, caseId));
  }

  async createEstateAsset(assetData: InsertEstateAsset): Promise<EstateAsset> {
    const [asset] = await db!
      .insert(estateAssets)
      .values(assetData)
      .returning();
    return asset;
  }

  async updateEstateAsset(id: number, assetData: Partial<InsertEstateAsset>): Promise<EstateAsset | undefined> {
    const [asset] = await db!
      .update(estateAssets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(estateAssets.id, id))
      .returning();
    return asset;
  }

  async deleteEstateAsset(id: number): Promise<void> {
    await db!.delete(estateAssets).where(eq(estateAssets.id, id));
  }

  // Estate Liability methods
  async getEstateLiability(id: number): Promise<EstateLiability | undefined> {
    const [liability] = await db!.select().from(estateLiabilities).where(eq(estateLiabilities.id, id));
    return liability;
  }

  async getEstateLiabilitiesByCaseId(caseId: number): Promise<EstateLiability[]> {
    return await db!.select().from(estateLiabilities).where(eq(estateLiabilities.caseId, caseId));
  }

  async createEstateLiability(liabilityData: InsertEstateLiability): Promise<EstateLiability> {
    const [liability] = await db!
      .insert(estateLiabilities)
      .values(liabilityData)
      .returning();
    return liability;
  }

  async updateEstateLiability(id: number, liabilityData: Partial<InsertEstateLiability>): Promise<EstateLiability | undefined> {
    const [liability] = await db!
      .update(estateLiabilities)
      .set({ ...liabilityData, updatedAt: new Date() })
      .where(eq(estateLiabilities.id, id))
      .returning();
    return liability;
  }

  async deleteEstateLiability(id: number): Promise<void> {
    await db!.delete(estateLiabilities).where(eq(estateLiabilities.id, id));
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db!.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByCaseId(caseId: number): Promise<Document[]> {
    return await db!.select().from(documents).where(eq(documents.caseId, caseId));
  }

  async getDocumentsByType(caseId: number, type: string): Promise<Document[]> {
    return await db!.select().from(documents).where(eq(documents.caseId, caseId)).where(eq(documents.type, type));
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db!
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db!
      .update(documents)
      .set({ ...documentData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db!.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByCaseId(caseId: number): Promise<Task[]> {
    return await db!.select().from(tasks).where(eq(tasks.caseId, caseId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db!
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db!
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Deceased Form Fields methods
  async getDeceasedFormFields(personId: number): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db!.select().from(deceasedFormFields).where(eq(deceasedFormFields.personId, personId));
    return fields;
  }

  async createDeceasedFormFields(data: InsertDeceasedFormFields): Promise<DeceasedFormFields> {
    const [fields] = await db!
      .insert(deceasedFormFields)
      .values(data)
      .returning();
    return fields;
  }

  async updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db!
      .update(deceasedFormFields)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deceasedFormFields.personId, personId))
      .returning();
    return fields;
  }

  async isDeceasedFormFieldsComplete(personId: number): Promise<boolean> {
    const fields = await this.getDeceasedFormFields(personId);
    if (!fields) return false;
    
    // Check required fields
    const requiredFields = [
      'dateOfBirth', 'dateOfDeath', 'wasKnownByOtherNames', 
      'domicileInEnglandOrWales', 'maritalStatus', 'hadForeignAssets',
      'landWasSettled', 'executorsApplying', 'hasAdoptionHistory'
    ];
    
    return requiredFields.every(field => fields[field] !== null && fields[field] !== undefined);
  }

  async getDeceasedFormFieldsCompletionStatus(personId: number): Promise<{ complete: boolean; missingFields: string[] }> {
    const fields = await this.getDeceasedFormFields(personId);
    if (!fields) {
      return { complete: false, missingFields: ['All fields'] };
    }
    
    const requiredFields = [
      'dateOfBirth', 'dateOfDeath', 'wasKnownByOtherNames', 
      'domicileInEnglandOrWales', 'maritalStatus', 'hadForeignAssets',
      'landWasSettled', 'executorsApplying', 'hasAdoptionHistory'
    ];
    
    const missingFields = requiredFields.filter(field => 
      fields[field] === null || fields[field] === undefined
    );
    
    return { complete: missingFields.length === 0, missingFields };
  }

  // Intake methods (PS-1) — single canonical record.
  async getIntakeByCaseId(caseId: number): Promise<Intake | undefined> {
    const [row] = await db!.select().from(intake).where(eq(intake.caseId, caseId));
    return row;
  }

  async getIntakeByBrowserSession(browserSessionId: string): Promise<Intake | undefined> {
    const [row] = await db!
      .select()
      .from(intake)
      .where(eq(intake.browserSessionId, browserSessionId));
    return row;
  }

  async createIntake(data: InsertIntake): Promise<Intake> {
    const [row] = await db!.insert(intake).values(data).returning();
    return row;
  }

  async updateIntake(id: string, data: Partial<InsertIntake>): Promise<Intake | undefined> {
    const [row] = await db!
      .update(intake)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(intake.id, id))
      .returning();
    return row;
  }

  // Claim-once invariant: only attach ownership to a row that is still anonymous
  // (userId IS NULL). Once claimed the WHERE no longer matches, so a second claim
  // is a no-op (returns undefined) — userId/caseId are never overwritten.
  async claimIntake(
    browserSessionId: string,
    userId: string,
    caseId: number,
  ): Promise<Intake | undefined> {
    const [row] = await db!
      .update(intake)
      .set({ userId, caseId, updatedAt: new Date() })
      .where(and(eq(intake.browserSessionId, browserSessionId), isNull(intake.userId)))
      .returning();
    return row;
  }

  // Referral events (PS-5)
  async createReferralEvent(data: InsertReferralEvent): Promise<ReferralEvent> {
    // Cast at the drizzle boundary: drizzle-zod infers the jsonb `reasons`/`summary`
    // columns with a structurally-different array type than drizzle's .values()
    // expects (the same friction the documents/deceased inserts hit in this repo).
    const [row] = await db!
      .insert(referralEvents)
      .values(data as unknown as typeof referralEvents.$inferInsert)
      .returning();
    return row;
  }

  async getReferralEventsByCaseId(caseId: number): Promise<ReferralEvent[]> {
    return await db!.select().from(referralEvents).where(eq(referralEvents.caseId, caseId));
  }

  // Payment methods (Phase C)
  async createPayment(data: InsertPayment): Promise<Payment> {
    const [row] = await db!.insert(payments).values(data).returning();
    return row;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [row] = await db!
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return row;
  }

  async getPaymentsByCaseId(caseId: number): Promise<Payment[]> {
    return await db!.select().from(payments).where(eq(payments.caseId, caseId));
  }

  async getPaymentByCheckoutSessionId(sessionId: string): Promise<Payment | undefined> {
    const [row] = await db!
      .select()
      .from(payments)
      .where(eq(payments.stripeCheckoutSessionId, sessionId));
    return row;
  }

  // Case task state (Phase B)
  async getCaseTasksByCaseId(caseId: number): Promise<CaseTask[]> {
    return await db!.select().from(caseTasks).where(eq(caseTasks.caseId, caseId));
  }

  async upsertCaseTask(
    caseId: number,
    taskKey: string,
    data: Partial<InsertCaseTask>,
  ): Promise<CaseTask> {
    const [existing] = await db!
      .select()
      .from(caseTasks)
      .where(and(eq(caseTasks.caseId, caseId), eq(caseTasks.taskKey, taskKey)));

    if (existing) {
      const [row] = await db!
        .update(caseTasks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(caseTasks.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await db!
      .insert(caseTasks)
      .values({ caseId, taskKey, ...data })
      .returning();
    return row;
  }
}

export const storage = hasDatabase ? new DatabaseStorage() : new MemoryStorage();
