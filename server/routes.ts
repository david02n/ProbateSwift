import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);

  // API routes for assessment results
  app.get("/api/assessment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const assessments = await storage.getAssessmentResultsByUserId(userId);
      
      // Return the most recent assessment
      if (assessments.length > 0) {
        const mostRecent = assessments.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Sort in descending order (newest first)
        })[0];
        
        return res.json(mostRecent);
      }
      
      return res.json(null);
    } catch (error) {
      console.error("Error fetching assessment results:", error);
      res.status(500).json({ error: "Failed to fetch assessment results" });
    }
  });

  app.post("/api/assessment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const assessmentData = {
        ...req.body,
        userId
      };
      
      const newAssessment = await storage.createAssessmentResult(assessmentData);
      res.status(201).json(newAssessment);
    } catch (error) {
      console.error("Error creating assessment result:", error);
      res.status(500).json({ error: "Failed to save assessment result" });
    }
  });

  app.put("/api/assessment/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const assessmentId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      
      // Verify the assessment belongs to the user
      const existingAssessment = await storage.getAssessmentResult(assessmentId);
      if (!existingAssessment || existingAssessment.userId !== userId) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      
      const updatedAssessment = await storage.updateAssessmentResult(assessmentId, req.body);
      res.json(updatedAssessment);
    } catch (error) {
      console.error("Error updating assessment result:", error);
      res.status(500).json({ error: "Failed to update assessment result" });
    }
  });

  // API routes for probate cases
  app.get("/api/probate-cases", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const cases = await storage.getProbateCasesByUserId(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching probate cases:", error);
      res.status(500).json({ error: "Failed to fetch probate cases" });
    }
  });

  app.get("/api/probate-cases/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const caseId = parseInt(req.params.id, 10);
      const probateCase = await storage.getProbateCase(caseId);
      
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      res.json(probateCase);
    } catch (error) {
      console.error("Error fetching probate case:", error);
      res.status(500).json({ error: "Failed to fetch probate case" });
    }
  });

  app.post("/api/probate-cases", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const caseData = {
        ...req.body,
        userId
      };
      
      const newCase = await storage.createProbateCase(caseData);
      res.status(201).json(newCase);
    } catch (error) {
      console.error("Error creating probate case:", error);
      res.status(500).json({ error: "Failed to create probate case" });
    }
  });

  app.put("/api/probate-cases/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const caseId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      
      // Verify the case belongs to the user
      const existingCase = await storage.getProbateCase(caseId);
      if (!existingCase || existingCase.userId !== userId) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const updatedCase = await storage.updateProbateCase(caseId, req.body);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating probate case:", error);
      res.status(500).json({ error: "Failed to update probate case" });
    }
  });

  // API routes for executors
  app.get("/api/executors", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      // Get user's cases first
      const cases = await storage.getProbateCasesByUserId(userId);
      
      if (cases.length === 0) {
        return res.json([]);
      }
      
      // Use the first case if no specific case is specified
      const defaultCaseId = cases[0].id;
      const executors = await storage.getExecutorsByCaseId(defaultCaseId);
      res.json(executors);
    } catch (error) {
      console.error("Error fetching executors:", error);
      res.status(500).json({ error: "Failed to fetch executors" });
    }
  });
  
  app.get("/api/executors/:caseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const caseId = parseInt(req.params.caseId, 10);
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const executors = await storage.getExecutorsByCaseId(caseId);
      res.json(executors);
    } catch (error) {
      console.error("Error fetching executors:", error);
      res.status(500).json({ error: "Failed to fetch executors" });
    }
  });

  app.post("/api/executors", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const { caseId, ...executorData } = req.body;
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const newExecutor = await storage.createExecutor({
        ...executorData,
        caseId,
        userId
      });
      
      res.status(201).json(newExecutor);
    } catch (error) {
      console.error("Error creating executor:", error);
      res.status(500).json({ error: "Failed to create executor" });
    }
  });
  
  app.put("/api/executors/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const executorId = parseInt(req.params.id, 10);
      
      // Get the executor and verify it belongs to the user
      const executor = await storage.getExecutor(executorId);
      if (!executor) {
        return res.status(404).json({ error: "Executor not found" });
      }
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(executor.caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(404).json({ error: "Not authorized to update this executor" });
      }
      
      const updatedExecutor = await storage.updateExecutor(executorId, req.body);
      if (!updatedExecutor) {
        return res.status(404).json({ error: "Failed to update executor" });
      }
      
      res.json(updatedExecutor);
    } catch (error) {
      console.error("Error updating executor:", error);
      res.status(500).json({ error: "Failed to update executor" });
    }
  });
  
  app.delete("/api/executors/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const executorId = parseInt(req.params.id, 10);
      
      // Get the executor and verify it belongs to the user
      const executor = await storage.getExecutor(executorId);
      if (!executor) {
        return res.status(404).json({ error: "Executor not found" });
      }
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(executor.caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(404).json({ error: "Not authorized to delete this executor" });
      }
      
      // Check if it's the primary executor
      if (executor.isApplicant) {
        return res.status(400).json({ error: "Cannot delete the primary executor" });
      }
      
      await storage.deleteExecutor(executorId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting executor:", error);
      res.status(500).json({ error: "Failed to delete executor" });
    }
  });

  // API routes for estate assets
  app.get("/api/assets/:caseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const caseId = parseInt(req.params.caseId, 10);
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const assets = await storage.getEstateAssetsByCaseId(caseId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const { caseId, ...assetData } = req.body;
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const newAsset = await storage.createEstateAsset({
        ...assetData,
        caseId
      });
      
      res.status(201).json(newAsset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ error: "Failed to create asset" });
    }
  });

  // API routes for estate liabilities
  app.get("/api/liabilities/:caseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const caseId = parseInt(req.params.caseId, 10);
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const liabilities = await storage.getEstateLiabilitiesByCaseId(caseId);
      res.json(liabilities);
    } catch (error) {
      console.error("Error fetching liabilities:", error);
      res.status(500).json({ error: "Failed to fetch liabilities" });
    }
  });

  app.post("/api/liabilities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      const { caseId, ...liabilityData } = req.body;
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const newLiability = await storage.createEstateLiability({
        ...liabilityData,
        caseId
      });
      
      res.status(201).json(newLiability);
    } catch (error) {
      console.error("Error creating liability:", error);
      res.status(500).json({ error: "Failed to create liability" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
