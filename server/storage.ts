import { 
  users, 
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
  type InsertUser, 
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
import * as session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session as any);
const PostgresSessionStore = connectPg(session as any);

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;
  
  // Assessment methods
  getAssessmentResult(id: number): Promise<AssessmentResult | undefined>;
  getAssessmentResultsByUserId(userId: number): Promise<AssessmentResult[]>;
  createAssessmentResult(assessment: InsertAssessmentResult): Promise<AssessmentResult>;
  updateAssessmentResult(id: number, assessment: Partial<InsertAssessmentResult>): Promise<AssessmentResult | undefined>;
  
  // Probate Case methods
  getProbateCase(id: number): Promise<ProbateCase | undefined>;
  getProbateCasesByUserId(userId: number): Promise<ProbateCase[]>;
  createProbateCase(caseData: InsertProbateCase): Promise<ProbateCase>;
  updateProbateCase(id: number, caseData: Partial<InsertProbateCase>): Promise<ProbateCase | undefined>;
  
  // People/Executor methods - "executors" table renamed to "people"
  getExecutor(id: number): Promise<Executor | undefined>;
  getExecutorsByCaseId(caseId: number): Promise<Executor[]>;
  getPeopleByCaseId(caseId: number): Promise<Executor[]>;  // New method for renamed table
  createExecutor(executorData: InsertExecutor): Promise<Executor>;
  updateExecutor(id: number, executorData: Partial<InsertExecutor>): Promise<Executor | undefined>;
  deleteExecutor(id: number): Promise<void>;
  
  // Estate Asset methods
  getEstateAsset(id: number): Promise<EstateAsset | undefined>;
  getEstateAssetsByCaseId(caseId: number): Promise<EstateAsset[]>;
  createEstateAsset(assetData: InsertEstateAsset): Promise<EstateAsset>;
  updateEstateAsset(id: number, assetData: Partial<InsertEstateAsset>): Promise<EstateAsset | undefined>;
  deleteEstateAsset(id: number): Promise<void>;
  
  // Estate Liability methods
  getEstateLiability(id: number): Promise<EstateLiability | undefined>;
  getEstateLiabilitiesByCaseId(caseId: number): Promise<EstateLiability[]>;
  createEstateLiability(liabilityData: InsertEstateLiability): Promise<EstateLiability>;
  updateEstateLiability(id: number, liabilityData: Partial<InsertEstateLiability>): Promise<EstateLiability | undefined>;
  deleteEstateLiability(id: number): Promise<void>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByCaseId(caseId: number): Promise<Document[]>;
  getDocumentsByType(caseId: number, type: string): Promise<Document[]>;
  createDocument(documentData: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined>;
  
  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getTasksByCaseId(caseId: number): Promise<Task[]>;
  createTask(taskData: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Deceased Form Fields methods
  getDeceasedFormFields(personId: number): Promise<DeceasedFormFields | undefined>;
  createDeceasedFormFields(data: InsertDeceasedFormFields): Promise<DeceasedFormFields>;
  updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined>;
  isDeceasedFormFieldsComplete(personId: number): Promise<boolean>;
  
  // Evaluation Response methods
  getEvaluationResponse(caseId: number): Promise<EvaluationResponse | undefined>;
  createEvaluationResponse(data: InsertEvaluationResponse): Promise<EvaluationResponse>;
  updateEvaluationResponse(caseId: number, data: Partial<InsertEvaluationResponse>): Promise<EvaluationResponse | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessments: Map<number, AssessmentResult>;
  private probateCases: Map<number, ProbateCase>;
  private executors: Map<number, Executor>;
  private estateAssets: Map<number, EstateAsset>;
  private estateLiabilities: Map<number, EstateLiability>;
  private documents: Map<number, Document>;
  private tasks: Map<number, Task>;
  private deceasedFormFields: Map<number, DeceasedFormFields>;
  private evaluationResponses: Map<number, EvaluationResponse>;
  private userIdCounter: number;
  private assessmentIdCounter: number;
  private probateCaseIdCounter: number;
  private executorIdCounter: number;
  private estateAssetIdCounter: number;
  private estateLiabilityIdCounter: number;
  private documentIdCounter: number;
  private taskIdCounter: number;
  private evaluationResponseIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.assessments = new Map();
    this.probateCases = new Map();
    this.executors = new Map();
    this.deceasedFormFields = new Map();
    this.estateAssets = new Map();
    this.estateLiabilities = new Map();
    this.documents = new Map();
    this.tasks = new Map();
    this.deceasedFormFields = new Map();
    this.evaluationResponses = new Map();
    this.userIdCounter = 2; // Start at 2 since we'll create a test user with ID 1
    this.assessmentIdCounter = 1;
    this.probateCaseIdCounter = 1;
    this.executorIdCounter = 1;
    this.estateAssetIdCounter = 1;
    this.estateLiabilityIdCounter = 1;
    this.documentIdCounter = 1;
    this.taskIdCounter = 1;
    this.evaluationResponseIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Add a test user for login testing with correctly formatted password
    // Format should be scrypt(password, salt, 64).toString("hex") + "." + salt
    const testUserPassword = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92c10b7d1d0aae37510b659b3958424a67fdfce21c67f5b8c46989fdada96c823.1111111111111111"; // "1234" with salt "1111111111111111"
    const testUser: User = {
      id: 1,
      email: "test@probateswift.com",
      password: testUserPassword,
      firstName: "Test",
      lastName: "User",
      isGuest: false,
      createdAt: new Date(),
      lastLogin: null
    };
    this.users.set(1, testUser);
    
    // Add a test assessment result for the test user
    const testAssessment: AssessmentResult = {
      id: 1,
      userId: 1,
      isProbateRequired: true,
      probateType: "Grant of Probate",
      hasWill: true,
      isInsolvent: false,
      hasDispute: false,
      assessmentData: JSON.stringify({
        result: {
          isProbateRequired: true,
          probateType: "Grant of Probate"
        },
        answers: {
          q1: "yes",
          q2: "yes",
          q3: "no",
          q4: "no"
        }
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.assessments.set(1, testAssessment);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Construct the user with all required fields
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      createdAt: now,
      lastLogin: now,
      isGuest: insertUser.isGuest || false
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...userData,
      // Ensure these fields are properly typed as they may be undefined in userData
      firstName: userData.firstName !== undefined ? userData.firstName : user.firstName,
      lastName: userData.lastName !== undefined ? userData.lastName : user.lastName,
      isGuest: userData.isGuest !== undefined ? userData.isGuest : user.isGuest,
      // Add Firebase fields
      firebaseUid: userData.firebaseUid !== undefined ? userData.firebaseUid : user.firebaseUid || null,
      photoURL: userData.photoURL !== undefined ? userData.photoURL : user.photoURL || null,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  // Assessment methods
  async getAssessmentResult(id: number): Promise<AssessmentResult | undefined> {
    return this.assessments.get(id);
  }

  async getAssessmentResultsByUserId(userId: number): Promise<AssessmentResult[]> {
    return Array.from(this.assessments.values()).filter(
      (assessment) => assessment.userId === userId
    );
  }

  async createAssessmentResult(assessment: InsertAssessmentResult): Promise<AssessmentResult> {
    const id = this.assessmentIdCounter++;
    const now = new Date();
    
    // Construct the assessment with all required fields
    const newAssessment: AssessmentResult = {
      id,
      userId: assessment.userId,
      isProbateRequired: assessment.isProbateRequired === undefined ? null : assessment.isProbateRequired,
      probateType: assessment.probateType === undefined ? null : assessment.probateType,
      hasWill: assessment.hasWill === undefined ? null : assessment.hasWill,
      isInsolvent: assessment.isInsolvent === undefined ? null : assessment.isInsolvent, 
      hasDispute: assessment.hasDispute === undefined ? null : assessment.hasDispute,
      assessmentData: assessment.assessmentData === undefined ? null : assessment.assessmentData,
      createdAt: now,
      updatedAt: now
    };
    
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }

  async updateAssessmentResult(id: number, assessment: Partial<InsertAssessmentResult>): Promise<AssessmentResult | undefined> {
    const existingAssessment = this.assessments.get(id);
    if (!existingAssessment) {
      return undefined;
    }
    
    // Update only the fields that were provided
    const updatedAssessment: AssessmentResult = {
      ...existingAssessment,
      userId: assessment.userId !== undefined ? assessment.userId : existingAssessment.userId,
      isProbateRequired: assessment.isProbateRequired !== undefined ? assessment.isProbateRequired : existingAssessment.isProbateRequired,
      probateType: assessment.probateType !== undefined ? assessment.probateType : existingAssessment.probateType,
      hasWill: assessment.hasWill !== undefined ? assessment.hasWill : existingAssessment.hasWill,
      isInsolvent: assessment.isInsolvent !== undefined ? assessment.isInsolvent : existingAssessment.isInsolvent,
      hasDispute: assessment.hasDispute !== undefined ? assessment.hasDispute : existingAssessment.hasDispute,
      assessmentData: assessment.assessmentData !== undefined ? assessment.assessmentData : existingAssessment.assessmentData,
      updatedAt: new Date()
    };
    
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  // Probate Case methods
  async getProbateCase(id: number): Promise<ProbateCase | undefined> {
    return this.probateCases.get(id);
  }

  async getProbateCasesByUserId(userId: number): Promise<ProbateCase[]> {
    return Array.from(this.probateCases.values()).filter(
      (probateCase) => probateCase.userId === userId
    );
  }

  async createProbateCase(caseData: InsertProbateCase): Promise<ProbateCase> {
    const id = this.probateCaseIdCounter++;
    const now = new Date();
    
    const newProbateCase: ProbateCase = {
      id,
      userId: caseData.userId,
      assessmentId: caseData.assessmentId,
      status: caseData.status || "draft",
      deceasedFirstName: caseData.deceasedFirstName || null,
      deceasedLastName: caseData.deceasedLastName || null,
      deceasedDateOfBirth: caseData.deceasedDateOfBirth || null,
      deceasedDateOfDeath: caseData.deceasedDateOfDeath || null,
      deceasedAddress: caseData.deceasedAddress || null,
      caseReference: caseData.caseReference || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.probateCases.set(id, newProbateCase);
    return newProbateCase;
  }

  async updateProbateCase(id: number, caseData: Partial<InsertProbateCase>): Promise<ProbateCase | undefined> {
    const existingCase = this.probateCases.get(id);
    if (!existingCase) {
      return undefined;
    }
    
    const updatedCase: ProbateCase = {
      ...existingCase,
      ...caseData,
      updatedAt: new Date()
    };
    
    this.probateCases.set(id, updatedCase);
    return updatedCase;
  }
  
  // Executor methods
  async getExecutor(id: number): Promise<Executor | undefined> {
    return this.executors.get(id);
  }

  async getExecutorsByCaseId(caseId: number): Promise<Executor[]> {
    return Array.from(this.executors.values()).filter(
      (executor) => executor.caseId === caseId
    );
  }

  async createExecutor(executorData: InsertExecutor): Promise<Executor> {
    const id = this.executorIdCounter++;
    const now = new Date();
    
    const newExecutor: Executor = {
      id,
      caseId: executorData.caseId,
      firstName: executorData.firstName || null,
      lastName: executorData.lastName || null,
      email: executorData.email || null,
      phone: executorData.phone || null,
      address: executorData.address || null,
      isMainExecutor: executorData.isMainExecutor || false,
      relationship: executorData.relationship || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.executors.set(id, newExecutor);
    return newExecutor;
  }

  async updateExecutor(id: number, executorData: Partial<InsertExecutor>): Promise<Executor | undefined> {
    const existingExecutor = this.executors.get(id);
    if (!existingExecutor) {
      return undefined;
    }
    
    const updatedExecutor: Executor = {
      ...existingExecutor,
      ...executorData,
      updatedAt: new Date()
    };
    
    this.executors.set(id, updatedExecutor);
    return updatedExecutor;
  }
  
  async deleteExecutor(id: number): Promise<void> {
    if (this.executors.has(id)) {
      this.executors.delete(id);
    }
  }
  
  // Estate Asset methods
  async getEstateAsset(id: number): Promise<EstateAsset | undefined> {
    return this.estateAssets.get(id);
  }

  async getEstateAssetsByCaseId(caseId: number): Promise<EstateAsset[]> {
    return Array.from(this.estateAssets.values()).filter(
      (asset) => asset.caseId === caseId
    );
  }

  async createEstateAsset(assetData: InsertEstateAsset): Promise<EstateAsset> {
    const id = this.estateAssetIdCounter++;
    const now = new Date();
    
    const newAsset: EstateAsset = {
      id,
      caseId: assetData.caseId,
      type: assetData.type,
      description: assetData.description || null,
      value: assetData.value || null,
      location: assetData.location || null,
      ownership: assetData.ownership || null,
      jointOwners: assetData.jointOwners || null,
      metadata: assetData.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.estateAssets.set(id, newAsset);
    return newAsset;
  }

  async updateEstateAsset(id: number, assetData: Partial<InsertEstateAsset>): Promise<EstateAsset | undefined> {
    const existingAsset = this.estateAssets.get(id);
    if (!existingAsset) {
      return undefined;
    }
    
    const updatedAsset: EstateAsset = {
      ...existingAsset,
      ...assetData,
      updatedAt: new Date()
    };
    
    this.estateAssets.set(id, updatedAsset);
    return updatedAsset;
  }
  
  async deleteEstateAsset(id: number): Promise<void> {
    if (this.estateAssets.has(id)) {
      this.estateAssets.delete(id);
    }
  }
  
  // Estate Liability methods
  async getEstateLiability(id: number): Promise<EstateLiability | undefined> {
    return this.estateLiabilities.get(id);
  }

  async getEstateLiabilitiesByCaseId(caseId: number): Promise<EstateLiability[]> {
    return Array.from(this.estateLiabilities.values()).filter(
      (liability) => liability.caseId === caseId
    );
  }

  async createEstateLiability(liabilityData: InsertEstateLiability): Promise<EstateLiability> {
    const id = this.estateLiabilityIdCounter++;
    const now = new Date();
    
    const newLiability: EstateLiability = {
      id,
      caseId: liabilityData.caseId,
      type: liabilityData.type,
      description: liabilityData.description || null,
      amount: liabilityData.amount || null,
      creditor: liabilityData.creditor || null,
      reference: liabilityData.reference || null,
      metadata: liabilityData.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.estateLiabilities.set(id, newLiability);
    return newLiability;
  }

  async updateEstateLiability(id: number, liabilityData: Partial<InsertEstateLiability>): Promise<EstateLiability | undefined> {
    const existingLiability = this.estateLiabilities.get(id);
    if (!existingLiability) {
      return undefined;
    }
    
    const updatedLiability: EstateLiability = {
      ...existingLiability,
      ...liabilityData,
      updatedAt: new Date()
    };
    
    this.estateLiabilities.set(id, updatedLiability);
    return updatedLiability;
  }
  
  async deleteEstateLiability(id: number): Promise<void> {
    if (this.estateLiabilities.has(id)) {
      this.estateLiabilities.delete(id);
    }
  }
  
  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByCaseId(caseId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.caseId === caseId
    );
  }

  async getDocumentsByType(caseId: number, type: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.caseId === caseId && document.type === type
    );
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const now = new Date();
    
    const newDocument: Document = {
      id,
      caseId: documentData.caseId,
      type: documentData.type,
      fileName: documentData.fileName,
      fileSize: documentData.fileSize,
      mimeType: documentData.mimeType,
      filePath: documentData.filePath,
      uploadedById: documentData.uploadedById,
      status: documentData.status || "pending",
      metadata: documentData.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) {
      return undefined;
    }
    
    const updatedDocument: Document = {
      ...existingDocument,
      ...documentData,
      updatedAt: new Date()
    };
    
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByCaseId(caseId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.caseId === caseId
    );
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    
    const newTask: Task = {
      id,
      caseId: taskData.caseId,
      title: taskData.title,
      description: taskData.description || null,
      type: taskData.type || "standard",
      priority: taskData.priority || "medium",
      status: taskData.status || "pending",
      dueDate: taskData.dueDate || null,
      assignedTo: taskData.assignedTo || null,
      metadata: taskData.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      return undefined;
    }
    
    const updatedTask: Task = {
      ...existingTask,
      ...taskData,
      updatedAt: new Date()
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Deceased Form Fields methods implementation
  async getDeceasedFormFields(personId: number): Promise<DeceasedFormFields | undefined> {
    if (this.deceasedFormFields) {
      return this.deceasedFormFields.get(personId);
    }
    return undefined;
  }

  async updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined> {
    const existingFields = this.deceasedFormFields.get(personId);
    if (!existingFields) {
      return undefined;
    }
    
    const updatedFields: DeceasedFormFields = {
      ...existingFields,
      ...data,
      updatedAt: new Date()
    };
    
    this.deceasedFormFields.set(personId, updatedFields);
    return updatedFields;
  }
  
  async isDeceasedFormFieldsComplete(personId: number): Promise<boolean> {
    const fields = await this.getDeceasedFormFields(personId);
    if (!fields) {
      return false;
    }
    
    // Check required fields
    if (!fields.dateOfBirth || !fields.dateOfDeath || fields.maritalStatus === null) {
      return false;
    }
    
    // Check conditional fields
    if (fields.maritalStatus === 'married' && !fields.marriedDate) {
      return false;
    }
    
    if (fields.maritalStatus === 'divorced' && (!fields.divorcedDate || !fields.divorceCourt)) {
      return false;
    }
    
    if (fields.maritalStatus === 'separated' && (!fields.separatedDate || !fields.separationCourt)) {
      return false;
    }
    
    if (fields.hadForeignAssets && !fields.foreignAssetValueGbp) {
      return false;
    }
    
    if (fields.wasKnownByOtherNames && (!fields.otherNamesHeldAssets || fields.otherNamesHeldAssets.length === 0)) {
      return false;
    }
    
    if (fields.hasAdoptionHistory && (!fields.adoptedRelatives || fields.adoptedRelatives.length === 0)) {
      return false;
    }
    
    return true;
  }
  
  async getPeopleByCaseId(caseId: number): Promise<Executor[]> {
    return Array.from(this.executors.values()).filter(executor => executor.caseId === caseId);
  }

  async createDeceasedFormFields(data: InsertDeceasedFormFields): Promise<DeceasedFormFields> {
    const now = new Date();
    const newDeceasedFormFields: DeceasedFormFields = {
      personId: data.personId,
      dateOfBirth: data.dateOfBirth || null,
      dateOfDeath: data.dateOfDeath || null,
      wasKnownByOtherNames: data.wasKnownByOtherNames || false,
      otherNamesHeldAssets: data.otherNamesHeldAssets || [],
      domicileInEnglandOrWales: data.domicileInEnglandOrWales || false,
      maritalStatus: data.maritalStatus || null,
      marriedDate: data.marriedDate || null,
      divorcedDate: data.divorcedDate || null,
      divorceCourt: data.divorceCourt || null,
      separatedDate: data.separatedDate || null,
      separationCourt: data.separationCourt || null,
      hadForeignAssets: data.hadForeignAssets || false,
      foreignAssetValueGbp: data.foreignAssetValueGbp || null,
      landWasSettled: data.landWasSettled || false,
      executorsApplying: data.executorsApplying || false,
      hasAdoptionHistory: data.hasAdoptionHistory || false,
      adoptedRelatives: data.adoptedRelatives || [],
      createdAt: now,
      updatedAt: now
    };
    
    if (!this.deceasedFormFields) {
      this.deceasedFormFields = new Map<number, DeceasedFormFields>();
    }
    
    this.deceasedFormFields.set(data.personId, newDeceasedFormFields);
    return newDeceasedFormFields;
  }

  async updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined> {
    const existingFields = this.deceasedFormFields.get(personId);
    if (!existingFields) {
      return undefined;
    }
    
    const updatedFields: DeceasedFormFields = {
      ...existingFields,
      ...data,
      updatedAt: new Date()
    };
    
    // Validate conditional fields
    if (updatedFields.wasKnownByOtherNames && 
        (!updatedFields.otherNamesHeldAssets || updatedFields.otherNamesHeldAssets.length === 0)) {
      throw new Error('Other names are required when wasKnownByOtherNames is true');
    }
    
    if (updatedFields.maritalStatus === 'married' && !updatedFields.marriedDate) {
      throw new Error('Marriage date is required when marital status is married');
    }
    
    if (updatedFields.maritalStatus === 'divorced' && 
        (!updatedFields.divorcedDate || !updatedFields.divorceCourt)) {
      throw new Error('Divorce date and court are required when marital status is divorced');
    }
    
    if (updatedFields.maritalStatus === 'separated' && 
        (!updatedFields.separatedDate || !updatedFields.separationCourt)) {
      throw new Error('Separation date and court are required when marital status is separated');
    }
    
    if (updatedFields.hadForeignAssets && !updatedFields.foreignAssetValueGbp) {
      throw new Error('Foreign asset value is required when hadForeignAssets is true');
    }
    
    if (updatedFields.hasAdoptionHistory && 
        (!updatedFields.adoptedRelatives || updatedFields.adoptedRelatives.length === 0)) {
      throw new Error('Adopted relatives details are required when hasAdoptionHistory is true');
    }
    
    this.deceasedFormFields.set(personId, updatedFields);
    return updatedFields;
  }

  async isDeceasedFormFieldsComplete(personId: number): Promise<boolean> {
    const fields = this.deceasedFormFields.get(personId);
    if (!fields) {
      return false;
    }
    
    // Check required fields
    if (!fields.dateOfBirth || !fields.dateOfDeath || fields.domicileInEnglandOrWales === undefined || 
        !fields.maritalStatus || fields.landWasSettled === undefined || 
        fields.executorsApplying === undefined || fields.hasAdoptionHistory === undefined) {
      return false;
    }
    
    // Check conditional required fields
    if (fields.wasKnownByOtherNames && 
        (!fields.otherNamesHeldAssets || fields.otherNamesHeldAssets.length === 0)) {
      return false;
    }
    
    if (fields.maritalStatus === 'married' && !fields.marriedDate) {
      return false;
    }
    
    if (fields.maritalStatus === 'divorced' && 
        (!fields.divorcedDate || !fields.divorceCourt)) {
      return false;
    }
    
    if (fields.maritalStatus === 'separated' && 
        (!fields.separatedDate || !fields.separationCourt)) {
      return false;
    }
    
    if (fields.hadForeignAssets && !fields.foreignAssetValueGbp) {
      return false;
    }
    
    if (fields.hasAdoptionHistory && 
        (!fields.adoptedRelatives || fields.adoptedRelatives.length === 0)) {
      return false;
    }
    
    return true;
  }
  
  // Required by interface but not implemented yet
  async getPeopleByCaseId(caseId: number): Promise<Executor[]> {
    return this.getExecutorsByCaseId(caseId); // For now, redirect to existing method
  }

  // Evaluation Response methods
  async getEvaluationResponse(caseId: number): Promise<EvaluationResponse | undefined> {
    return Array.from(this.evaluationResponses.values()).find(
      (response) => response.caseId === caseId
    );
  }

  async createEvaluationResponse(data: InsertEvaluationResponse): Promise<EvaluationResponse> {
    const id = this.evaluationResponseIdCounter++;
    const now = new Date();
    
    const newEvaluationResponse: EvaluationResponse = {
      id,
      caseId: data.caseId,
      answers: data.answers || {},
      derivedFlags: data.derivedFlags || {},
      completedSections: data.completedSections || [],
      unlockedMilestones: data.unlockedMilestones || [],
      createdAt: now,
      updatedAt: now,
      completedAt: data.completedAt || null
    };
    
    this.evaluationResponses.set(id, newEvaluationResponse);
    return newEvaluationResponse;
  }

  async updateEvaluationResponse(caseId: number, data: Partial<InsertEvaluationResponse>): Promise<EvaluationResponse | undefined> {
    const existing = Array.from(this.evaluationResponses.values()).find(
      (response) => response.caseId === caseId
    );
    
    if (!existing) {
      return undefined;
    }
    
    const updatedResponse: EvaluationResponse = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    
    this.evaluationResponses.set(existing.id, updatedResponse);
    return updatedResponse;
  }
  
  // Deceased Form Fields methods
  async getDeceasedFormFields(personId: number): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db
      .select()
      .from(deceasedFormFields)
      .where(eq(deceasedFormFields.personId, personId));
    return fields;
  }
  
  async createDeceasedFormFields(data: InsertDeceasedFormFields): Promise<DeceasedFormFields> {
    // Set defaults for JSON fields if they're not provided
    const fieldsWithDefaults = {
      ...data,
      otherNames: data.otherNames || [],
      adoptedRelatives: data.adoptedRelatives || [],
    };
    
    const [fields] = await db
      .insert(deceasedFormFields)
      .values(fieldsWithDefaults)
      .returning();
    return fields;
  }
  
  async updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db
      .update(deceasedFormFields)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(deceasedFormFields.personId, personId))
      .returning();
    return fields;
  }
  
  async isDeceasedFormFieldsComplete(personId: number): Promise<boolean> {
    const fields = await this.getDeceasedFormFields(personId);
    if (!fields) {
      return false;
    }
    
    // Check required fields
    if (!fields.firstName || !fields.lastName || !fields.dateOfBirth || !fields.dateOfDeath || !fields.maritalStatus) {
      return false;
    }
    
    // Check conditional fields
    if (fields.maritalStatus === 'married' && !fields.marriedDate) {
      return false;
    }
    
    if (fields.maritalStatus === 'divorced' && (!fields.divorcedDate || !fields.divorceCourt)) {
      return false;
    }
    
    if (fields.maritalStatus === 'separated' && (!fields.separatedDate || !fields.separationCourt)) {
      return false;
    }
    
    if (fields.hadForeignAssets && !fields.foreignAssetValueGbp) {
      return false;
    }
    
    if (fields.hasAdoptionHistory && (!fields.adoptedRelatives || fields.adoptedRelatives.length === 0)) {
      return false;
    }
    
    // All required fields are present
    return true;
  }

  // Evaluation Response methods
  async getEvaluationResponse(caseId: number): Promise<EvaluationResponse | undefined> {
    const [response] = await db
      .select()
      .from(evaluationResponses)
      .where(eq(evaluationResponses.probateCaseId, caseId))
      .limit(1);
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
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(evaluationResponses.probateCaseId, caseId))
      .returning();
    return response;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // Deceased Form Fields methods
  async getDeceasedFormFields(personId: number): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db
      .select()
      .from(deceasedFormFields)
      .where(eq(deceasedFormFields.personId, personId));
    return fields;
  }
  
  async createDeceasedFormFields(data: InsertDeceasedFormFields): Promise<DeceasedFormFields> {
    // Set defaults for JSON fields if they're not provided
    const fieldsWithDefaults = {
      ...data,
      otherNames: data.otherNames || [],
      adoptedRelatives: data.adoptedRelatives || [],
    };
    
    const [fields] = await db
      .insert(deceasedFormFields)
      .values(fieldsWithDefaults)
      .returning();
    return fields;
  }
  
  async updateDeceasedFormFields(personId: number, data: Partial<InsertDeceasedFormFields>): Promise<DeceasedFormFields | undefined> {
    const [fields] = await db
      .update(deceasedFormFields)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(deceasedFormFields.personId, personId))
      .returning();
    return fields;
  }
  
  async isDeceasedFormFieldsComplete(personId: number): Promise<boolean> {
    const fields = await this.getDeceasedFormFields(personId);
    if (!fields) {
      return false;
    }
    
    // Check required fields
    if (!fields.firstName || !fields.lastName || !fields.dateOfBirth || !fields.dateOfDeath || !fields.maritalStatus) {
      return false;
    }
    
    // Check conditional fields
    if (fields.maritalStatus === 'married' && !fields.marriedDate) {
      return false;
    }
    
    if (fields.maritalStatus === 'divorced' && (!fields.divorcedDate || !fields.divorceCourt)) {
      return false;
    }
    
    if (fields.maritalStatus === 'separated' && (!fields.separatedDate || !fields.separationCourt)) {
      return false;
    }
    
    if (fields.hadForeignAssets && !fields.foreignAssetValueGbp) {
      return false;
    }
    
    if (fields.hasAdoptionHistory && (!fields.adoptedRelatives || fields.adoptedRelatives.length === 0)) {
      return false;
    }
    
    // All required fields are present
    return true;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        ...userData,
        ...(userData.lastLogin ? { lastLogin: userData.lastLogin } : {})
      })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Assessment methods
  async getAssessmentResult(id: number): Promise<AssessmentResult | undefined> {
    const [assessment] = await db.select().from(assessmentResults).where(eq(assessmentResults.id, id));
    return assessment;
  }

  async getAssessmentResultsByUserId(userId: number): Promise<AssessmentResult[]> {
    return await db.select().from(assessmentResults).where(eq(assessmentResults.userId, userId));
  }

  async createAssessmentResult(assessment: InsertAssessmentResult): Promise<AssessmentResult> {
    const [result] = await db.insert(assessmentResults).values(assessment).returning();
    return result;
  }

  async updateAssessmentResult(id: number, assessment: Partial<InsertAssessmentResult>): Promise<AssessmentResult | undefined> {
    const [updatedAssessment] = await db
      .update(assessmentResults)
      .set({ ...assessment, updatedAt: new Date() })
      .where(eq(assessmentResults.id, id))
      .returning();
    return updatedAssessment;
  }

  // Probate Case methods
  async getProbateCase(id: number): Promise<ProbateCase | undefined> {
    const [result] = await db.select().from(probateCases).where(eq(probateCases.id, id));
    return result;
  }

  async getProbateCasesByUserId(userId: number): Promise<ProbateCase[]> {
    return await db.select().from(probateCases).where(eq(probateCases.userId, userId));
  }

  async createProbateCase(caseData: InsertProbateCase): Promise<ProbateCase> {
    const [result] = await db.insert(probateCases).values(caseData).returning();
    return result;
  }

  async updateProbateCase(id: number, caseData: Partial<InsertProbateCase>): Promise<ProbateCase | undefined> {
    const [updatedCase] = await db
      .update(probateCases)
      .set({ ...caseData, updatedAt: new Date() })
      .where(eq(probateCases.id, id))
      .returning();
    return updatedCase;
  }

  // People methods (formerly executors)
  async getExecutor(id: number): Promise<Executor | undefined> {
    // Keeping same method name for backward compatibility
    try {
      const [result] = await db.select().from(executors).where(eq(executors.id, id));
      return result;
    } catch (error) {
      console.error("Error in getExecutor:", error);
      throw error;
    }
  }

  async getExecutorsByCaseId(caseId: number): Promise<Executor[]> {
    // Keeping same method name for backward compatibility
    try {
      return await db.select().from(executors).where(eq(executors.caseId, caseId));
    } catch (error) {
      console.error("Error in getExecutorsByCaseId:", error);
      throw error;
    }
  }

  // New method with renamed table but same functionality
  async getPeopleByCaseId(caseId: number): Promise<Executor[]> {
    try {
      return await db.select().from(executors).where(eq(executors.caseId, caseId));
    } catch (error) {
      console.error("Error in getPeopleByCaseId:", error);
      throw error;
    }
  }

  async createExecutor(executorData: InsertExecutor): Promise<Executor> {
    // Keeping same method name for backward compatibility
    try {
      const [result] = await db.insert(executors).values(executorData).returning();
      return result;
    } catch (error) {
      console.error("Error in createExecutor:", error);
      throw error;
    }
  }

  async updateExecutor(id: number, executorData: Partial<InsertExecutor>): Promise<Executor | undefined> {
    // Keeping same method name for backward compatibility
    try {
      const [updatedExecutor] = await db
        .update(executors)
        .set({ ...executorData, updatedAt: new Date() })
        .where(eq(executors.id, id))
        .returning();
      return updatedExecutor;
    } catch (error) {
      console.error("Error in updateExecutor:", error);
      throw error;
    }
  }
  
  async deleteExecutor(id: number): Promise<void> {
    // Keeping same method name for backward compatibility
    try {
      await db
        .delete(executors)
        .where(eq(executors.id, id));
    } catch (error) {
      console.error("Error in deleteExecutor:", error);
      throw error;
    }
  }

  // Estate Asset methods
  async getEstateAsset(id: number): Promise<EstateAsset | undefined> {
    const [result] = await db.select().from(estateAssets).where(eq(estateAssets.id, id));
    return result;
  }

  async getEstateAssetsByCaseId(caseId: number): Promise<EstateAsset[]> {
    return await db.select().from(estateAssets).where(eq(estateAssets.caseId, caseId));
  }

  async createEstateAsset(assetData: InsertEstateAsset): Promise<EstateAsset> {
    const [result] = await db.insert(estateAssets).values(assetData).returning();
    return result;
  }

  async updateEstateAsset(id: number, assetData: Partial<InsertEstateAsset>): Promise<EstateAsset | undefined> {
    const [updatedAsset] = await db
      .update(estateAssets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(estateAssets.id, id))
      .returning();
    return updatedAsset;
  }
  
  async deleteEstateAsset(id: number): Promise<void> {
    await db
      .delete(estateAssets)
      .where(eq(estateAssets.id, id));
  }

  // Estate Liability methods
  async getEstateLiability(id: number): Promise<EstateLiability | undefined> {
    const [result] = await db.select().from(estateLiabilities).where(eq(estateLiabilities.id, id));
    return result;
  }

  async getEstateLiabilitiesByCaseId(caseId: number): Promise<EstateLiability[]> {
    return await db.select().from(estateLiabilities).where(eq(estateLiabilities.caseId, caseId));
  }

  async createEstateLiability(liabilityData: InsertEstateLiability): Promise<EstateLiability> {
    const [result] = await db.insert(estateLiabilities).values(liabilityData).returning();
    return result;
  }

  async updateEstateLiability(id: number, liabilityData: Partial<InsertEstateLiability>): Promise<EstateLiability | undefined> {
    const [updatedLiability] = await db
      .update(estateLiabilities)
      .set({ ...liabilityData, updatedAt: new Date() })
      .where(eq(estateLiabilities.id, id))
      .returning();
    return updatedLiability;
  }
  
  async deleteEstateLiability(id: number): Promise<void> {
    await db
      .delete(estateLiabilities)
      .where(eq(estateLiabilities.id, id));
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [result] = await db.select().from(documents).where(eq(documents.id, id));
    return result;
  }

  async getDocumentsByCaseId(caseId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.caseId, caseId));
  }

  async getDocumentsByType(caseId: number, type: string): Promise<Document[]> {
    return await db.select().from(documents)
      .where(and(
        eq(documents.caseId, caseId),
        eq(documents.type, type)
      ));
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(documentData).returning();
    return result;
  }

  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...documentData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [result] = await db.select().from(tasks).where(eq(tasks.id, id));
    return result;
  }

  async getTasksByCaseId(caseId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.caseId, caseId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(taskData).returning();
    return result;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  // Evaluation Response methods
  async getEvaluationResponse(caseId: number): Promise<EvaluationResponse | undefined> {
    const [response] = await db
      .select()
      .from(evaluationResponses)
      .where(eq(evaluationResponses.caseId, caseId));
    return response;
  }

  async createEvaluationResponse(data: InsertEvaluationResponse): Promise<EvaluationResponse> {
    const [response] = await db
      .insert(evaluationResponses)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return response;
  }

  async updateEvaluationResponse(caseId: number, data: Partial<InsertEvaluationResponse>): Promise<EvaluationResponse | undefined> {
    const [updatedResponse] = await db
      .update(evaluationResponses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(evaluationResponses.caseId, caseId))
      .returning();
    return updatedResponse;
  }
}

// Choose which storage implementation to use
// Uncomment to use database storage
export const storage = new DatabaseStorage();

// Uncomment to use memory storage instead
// export const storage = new MemStorage();
