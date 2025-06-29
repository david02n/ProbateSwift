import {
  users,
  sessions,
  assessmentResults,
  probateCases,
  executors,
  estateAssets,
  estateLiabilities,
  documents,
  tasks,
  deceasedFormFields,
  evaluationResponses,
  type User,
  type UpsertUser,
  type AssessmentResult,
  type InsertAssessmentResult,
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
  type InsertDeceasedFormFields,
  type EvaluationResponse,
  type InsertEvaluationResponse
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getAssessmentResult(id: number): Promise<AssessmentResult | undefined>;
  getAssessmentResultsByUserId(userId: string): Promise<AssessmentResult[]>;
  createAssessmentResult(assessment: InsertAssessmentResult): Promise<AssessmentResult>;
  updateAssessmentResult(id: number, assessment: Partial<InsertAssessmentResult>): Promise<AssessmentResult | undefined>;

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

  getEvaluationResponse(caseId: number): Promise<EvaluationResponse | undefined>;
  createEvaluationResponse(data: InsertEvaluationResponse): Promise<EvaluationResponse>;
  updateEvaluationResponse(caseId: number, data: Partial<InsertEvaluationResponse>): Promise<EvaluationResponse | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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

  async getAssessmentResult(id: number): Promise<AssessmentResult | undefined> {
    const [result] = await db.select().from(assessmentResults).where(eq(assessmentResults.id, id));
    return result;
  }

  async getAssessmentResultsByUserId(userId: string): Promise<AssessmentResult[]> {
    return await db.select().from(assessmentResults).where(eq(assessmentResults.userId, userId));
  }

  async createAssessmentResult(assessment: InsertAssessmentResult): Promise<AssessmentResult> {
    const [result] = await db
      .insert(assessmentResults)
      .values(assessment)
      .returning();
    return result;
  }

  async updateAssessmentResult(id: number, assessment: Partial<InsertAssessmentResult>): Promise<AssessmentResult | undefined> {
    const [result] = await db
      .update(assessmentResults)
      .set({ ...assessment, updatedAt: new Date() })
      .where(eq(assessmentResults.id, id))
      .returning();
    return result;
  }

  // Probate Case methods
  async getProbateCase(id: number): Promise<ProbateCase | undefined> {
    const [probateCase] = await db.select().from(probateCases).where(eq(probateCases.id, id));
    return probateCase;
  }

  async getProbateCasesByUserId(userId: string): Promise<ProbateCase[]> {
    return await db.select().from(probateCases).where(eq(probateCases.userId, userId));
  }

  async createProbateCase(caseData: InsertProbateCase): Promise<ProbateCase> {
    const [probateCase] = await db
      .insert(probateCases)
      .values(caseData)
      .returning();
    return probateCase;
  }

  async updateProbateCase(id: number, caseData: Partial<InsertProbateCase>): Promise<ProbateCase | undefined> {
    const [probateCase] = await db
      .update(probateCases)
      .set({ ...caseData, updatedAt: new Date() })
      .where(eq(probateCases.id, id))
      .returning();
    return probateCase;
  }

  // People/Executor methods
  async getExecutor(id: number): Promise<Executor | undefined> {
    const [executor] = await db.select().from(executors).where(eq(executors.id, id));
    return executor;
  }

  async getExecutorsByCaseId(caseId: number): Promise<Executor[]> {
    return await db.select().from(executors).where(eq(executors.caseId, caseId));
  }

  async getPeopleByCaseId(caseId: number): Promise<Executor[]> {
    return await db.select().from(executors).where(eq(executors.caseId, caseId));
  }

  async createExecutor(executorData: InsertExecutor): Promise<Executor> {
    const [executor] = await db
      .insert(executors)
      .values(executorData)
      .returning();
    return executor;
  }

  async updateExecutor(id: number, executorData: Partial<InsertExecutor>): Promise<Executor | undefined> {
    const [executor] = await db
      .update(executors)
      .set({ ...executorData, updatedAt: new Date() })
      .where(eq(executors.id, id))
      .returning();
    return executor;
  }

  async deleteExecutor(id: number): Promise<void> {
    await db.delete(executors).where(eq(executors.id, id));
  }

  // Estate Asset methods
  async getEstateAsset(id: number): Promise<EstateAsset | undefined> {
    const [asset] = await db.select().from(estateAssets).where(eq(estateAssets.id, id));
    return asset;
  }

  async getEstateAssetsByCaseId(caseId: number): Promise<EstateAsset[]> {
    return await db.select().from(estateAssets).where(eq(estateAssets.caseId, caseId));
  }

  async createEstateAsset(assetData: InsertEstateAsset): Promise<EstateAsset> {
    const [asset] = await db
      .insert(estateAssets)
      .values(assetData)
      .returning();
    return asset;
  }

  async updateEstateAsset(id: number, assetData: Partial<InsertEstateAsset>): Promise<EstateAsset | undefined> {
    const [asset] = await db
      .update(estateAssets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(estateAssets.id, id))
      .returning();
    return asset;
  }

  async deleteEstateAsset(id: number): Promise<void> {
    await db.delete(estateAssets).where(eq(estateAssets.id, id));
  }

  // Estate Liability methods
  async getEstateLiability(id: number): Promise<EstateLiability | undefined> {
    const [liability] = await db.select().from(estateLiabilities).where(eq(estateLiabilities.id, id));
    return liability;
  }

  async getEstateLiabilitiesByCaseId(caseId: number): Promise<EstateLiability[]> {
    return await db.select().from(estateLiabilities).where(eq(estateLiabilities.caseId, caseId));
  }

  async createEstateLiability(liabilityData: InsertEstateLiability): Promise<EstateLiability> {
    const [liability] = await db
      .insert(estateLiabilities)
      .values(liabilityData)
      .returning();
    return liability;
  }

  async updateEstateLiability(id: number, liabilityData: Partial<InsertEstateLiability>): Promise<EstateLiability | undefined> {
    const [liability] = await db
      .update(estateLiabilities)
      .set({ ...liabilityData, updatedAt: new Date() })
      .where(eq(estateLiabilities.id, id))
      .returning();
    return liability;
  }

  async deleteEstateLiability(id: number): Promise<void> {
    await db.delete(estateLiabilities).where(eq(estateLiabilities.id, id));
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByCaseId(caseId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.caseId, caseId));
  }

  async getDocumentsByType(caseId: number, type: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.caseId, caseId)).where(eq(documents.type, type));
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...documentData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByCaseId(caseId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.caseId, caseId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Deceased Form Fields methods
  async getDeceasedFormFields(personId: number): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db.select().from(deceasedFormFields).where(eq(deceasedFormFields.personId, personId));
    return fields;
  }

  async createDeceasedFormFields(data: InsertDeceasedFormFields): Promise<DeceasedFormFields> {
    const [fields] = await db
      .insert(deceasedFormFields)
      .values(data)
      .returning();
    return fields;
  }

  async updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db
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

  // Evaluation Response methods
  async getEvaluationResponse(caseId: number): Promise<EvaluationResponse | undefined> {
    const [response] = await db.select().from(evaluationResponses).where(eq(evaluationResponses.caseId, caseId));
    return response;
  }

  async createEvaluationResponse(data: InsertEvaluationResponse): Promise<EvaluationResponse> {
    const [response] = await db
      .insert(evaluationResponses)
      .values(data)
      .returning();
    return response;
  }

  async updateEvaluationResponse(caseId: number, data: Partial<InsertEvaluationResponse>): Promise<EvaluationResponse | undefined> {
    const [response] = await db
      .update(evaluationResponses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(evaluationResponses.caseId, caseId))
      .returning();
    return response;
  }
}

export const storage = new DatabaseStorage();