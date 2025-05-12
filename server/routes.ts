import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { WebSocketServer, WebSocket } from "ws";


// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage2,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a HTTP server for the express app
  const httpServer = createServer(app);

  // Initialize WebSocket Server for real-time notifications
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('Received: %s', message);
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast document updates to all connected clients
  const broadcastDocumentUpdate = (docId: number, status: string, metadata?: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DOCUMENT_UPDATE',
          documentId: docId,
          status,
          metadata
        }));
      }
    });
  };
  // Set up authentication routes and middleware
  setupAuth(app);
  
  // Google Authentication endpoint
  app.post('/api/auth/google', async (req: Request, res: Response) => {
    try {
      const { idToken, email, displayName, photoURL } = req.body;
      
      // Log request details for debugging
      console.log('Google auth request received:');
      console.log(`Email: ${email || 'Not provided'}`);
      console.log(`User Agent: ${req.headers['user-agent'] || 'Not provided'}`);
      console.log(`Is Mobile: ${/Mobi|Android|iPhone|iPad|iPod/i.test(req.headers['user-agent'] || '')}`);
      console.log(`Origin: ${req.headers.origin || 'Not provided'}`);
      console.log(`Host: ${req.headers.host || 'Not provided'}`);
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Extract first and last name from displayName if available
      let firstName = null;
      let lastName = null;
      
      if (displayName) {
        const nameParts = displayName.split(' ');
        if (nameParts.length >= 1) {
          firstName = nameParts[0];
          
          if (nameParts.length >= 2) {
            lastName = nameParts.slice(1).join(' ');
          }
        }
      }
      
      // Use the token as the Firebase UID
      const firebaseUid = idToken ? `google:${email}` : null;
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update existing user with Firebase details
        user = await storage.updateUser(user.id, {
          firebaseUid,
          photoURL,
          // Only update these if they don't exist already
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName
        });
        
        // Update last login
        await storage.updateUserLastLogin(user.id);
      } else {
        // Create new user
        user = await storage.createUser({
          email,
          firstName,
          lastName,
          firebaseUid,
          photoURL,
          password: '', // Not used with Firebase auth
          isGuest: false
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: 'Failed to login' });
        }
        return res.status(200).json(user);
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
  });

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
      
      // Allow deleting all executor types (including primary ones)
      
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
      
      // Convert document_id to documentId for client use
      const formattedAssets = assets.map(asset => {
        // Type safety for document_id - convert snake_case to camelCase
        const assetAny = asset as any; // Use 'any' to bypass type checking temporarily
        if (assetAny.document_id !== null && assetAny.document_id !== undefined) {
          const { document_id, ...rest } = assetAny;
          return {
            ...rest,
            documentId: document_id
          };
        }
        return asset;
      });
      
      res.json(formattedAssets);
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
      
      // Convert documentId to document_id if it exists (camelCase to snake_case)
      const { documentId, ...restAssetData } = assetData;
      
      const newAsset = await storage.createEstateAsset({
        ...restAssetData,
        caseId,
        ...(documentId && { document_id: documentId }) // Only include if documentId is present
      });
      
      // Convert document_id back to documentId in the response
      const newAssetAny = newAsset as any;
      if (newAssetAny.document_id !== null && newAssetAny.document_id !== undefined) {
        const { document_id, ...rest } = newAssetAny;
        res.status(201).json({
          ...rest,
          documentId: document_id
        });
      } else {
        res.status(201).json(newAsset);
      }
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ error: "Failed to create asset" });
    }
  });
  
  // Delete an asset
  app.delete("/api/assets/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const assetId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the asset to verify ownership
      const asset = await storage.getEstateAsset(assetId);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      // Get the probate case to verify it belongs to the user
      const probateCase = await storage.getProbateCase(asset.caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this asset" });
      }
      
      // Delete the asset
      await storage.deleteEstateAsset(assetId);
      res.status(200).json({ message: "Asset deleted successfully" });
    } catch (err) {
      console.error("Error deleting asset:", err);
      res.status(500).json({ error: "Failed to delete asset" });
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
      
      // Convert document_id to documentId for client use
      const formattedLiabilities = liabilities.map(liability => {
        // Type safety for document_id - convert snake_case to camelCase
        const liabilityAny = liability as any; // Use 'any' to bypass type checking temporarily
        if (liabilityAny.document_id !== null && liabilityAny.document_id !== undefined) {
          const { document_id, ...rest } = liabilityAny;
          return {
            ...rest,
            documentId: document_id
          };
        }
        return liability;
      });
      
      res.json(formattedLiabilities);
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
      
      // Convert documentId to document_id if it exists (camelCase to snake_case)
      const { documentId, ...restLiabilityData } = liabilityData;
      
      const newLiability = await storage.createEstateLiability({
        ...restLiabilityData,
        caseId,
        ...(documentId && { document_id: documentId }) // Only include if documentId is present
      });
      
      // Convert document_id back to documentId in the response
      const newLiabilityAny = newLiability as any;
      if (newLiabilityAny.document_id !== null && newLiabilityAny.document_id !== undefined) {
        const { document_id, ...rest } = newLiabilityAny;
        res.status(201).json({
          ...rest,
          documentId: document_id
        });
      } else {
        res.status(201).json(newLiability);
      }
    } catch (error) {
      console.error("Error creating liability:", error);
      res.status(500).json({ error: "Failed to create liability" });
    }
  });
  
  // Delete a liability
  app.delete("/api/liabilities/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const liabilityId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the liability to verify ownership
      const liability = await storage.getEstateLiability(liabilityId);
      if (!liability) {
        return res.status(404).json({ error: "Liability not found" });
      }
      
      // Get the probate case to verify it belongs to the user
      const probateCase = await storage.getProbateCase(liability.caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this liability" });
      }
      
      // Delete the liability
      await storage.deleteEstateLiability(liabilityId);
      res.status(200).json({ message: "Liability deleted successfully" });
    } catch (err) {
      console.error("Error deleting liability:", err);
      res.status(500).json({ error: "Failed to delete liability" });
    }
  });
  // API routes for documents
  
  // Update a document's metadata (e.g., includedInEstate flag)
  app.patch("/api/documents/:id/metadata", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.user!.id;
      const metadata = req.body.metadata;
      
      // Get the document to verify ownership
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Get the probate case to verify it belongs to the user
      const probateCase = await storage.getProbateCase(document.caseId);
      if (!probateCase || probateCase.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this document" });
      }
      
      // Update the document metadata
      const updatedDocument = await storage.updateDocument(documentId, { 
        metadata 
      });
      
      // If we're removing from estate, remove the linked asset/liability
      if (metadata && metadata.includedInEstate === false && metadata.estateItemId) {
        if (metadata.estateItemType === 'asset') {
          await storage.deleteEstateAsset(metadata.estateItemId);
        } else if (metadata.estateItemType === 'liability') {
          await storage.deleteEstateLiability(metadata.estateItemId);
        }
      }
      
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document metadata:", error);
      res.status(500).json({ error: "Failed to update document metadata" });
    }
  });
  
  // Get all documents for the authenticated user
  app.get("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const userId = req.user!.id;
      
      // Get user's cases
      const cases = await storage.getProbateCasesByUserId(userId);
      
      if (cases.length === 0) {
        return res.json([]);
      }
      
      // Get documents for the first case (default case)
      const defaultCaseId = cases[0].id;
      const documents = await storage.getDocumentsByCaseId(defaultCaseId);
      
      console.log(`Fetched ${documents.length} documents for user ${userId}, case ${defaultCaseId}`);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });
  
  // Get documents for a specific case
  app.get("/api/documents/:caseId", async (req, res) => {
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
      
      const documents = await storage.getDocumentsByCaseId(caseId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });
  
  app.get("/api/documents/document/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const documentId = parseInt(req.params.id, 10);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Verify the document belongs to a case owned by the user
      const probateCase = await storage.getProbateCase(document.caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this document" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });
  
  app.get("/api/documents/type/:caseId/:type", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const caseId = parseInt(req.params.caseId, 10);
      const type = req.params.type;
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(404).json({ error: "Probate case not found" });
      }
      
      const documents = await storage.getDocumentsByType(caseId, type);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents by type:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });
  
  app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    
    try {
      const userId = req.user!.id;
      const caseId = parseInt(req.body.caseId, 10);
      const category = req.body.category || 'general';
      
      // Verify the case belongs to the user
      const probateCase = await storage.getProbateCase(caseId);
      if (!probateCase || probateCase.userId !== userId) {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, error: "Probate case not found" });
      }
      
      // Create a document record - set as processed immediately since we're storing locally
      const newDocument = await storage.createDocument({
        filename: req.file.originalname,
        caseId,
        userId,
        type: category,
        status: 'processed', // Set to processed immediately instead of 'processing'
        storagePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        notes: `Uploaded and stored locally at ${req.file.path}`,
        metadata: {}, // Initialize with empty metadata
      });
      
      // Still attempt to send to webhook but don't wait for it or fail if it's not available
      // This is done in a separate async function that doesn't affect the response
      (async () => {
        try {
          // Use specific webhook endpoint if provided, otherwise default
          const webhookUrl = req.body.webhookTarget || 'https://n8n.probateswift.com/webhook/fileupload';
          
          console.log(`Attempting to send document ${newDocument.id} to webhook: ${webhookUrl}`);
          
          // Determine the host for the file URL using the public API endpoint
          const host = req.get('host') || 'localhost:5000';
          const protocol = req.protocol || 'http';
          
          // Create two URLs - one for direct file access and one using the document API endpoint
          const rawFileBasename = path.basename(req.file!.path);
          const directFileUrl = `${protocol}://${host}/uploads/${rawFileBasename}`;
          const apiFileUrl = `${protocol}://${host}/api/public/documents/${newDocument.id}/file`;
          
          console.log('Document URLs generated:', {
            documentId: newDocument.id,
            directFileUrl,
            apiFileUrl
          });
          
          // Build parameters with public API URL
          const webhookParams = {
            documentId: newDocument.id.toString(),
            userId: userId.toString(),
            caseId: caseId.toString(),
            category: category,
            filename: req.file!.originalname,
            fileType: req.file!.mimetype,
            fileSize: req.file!.size,
            filePath: req.file!.path,
            storagePath: req.file!.path,
            fileUrl: apiFileUrl, // Use the API endpoint URL which is more robust
            directFileUrl: directFileUrl, // Include direct URL as fallback
            uploadedAt: new Date().toISOString()
          };
          
          // Send to the production webhook endpoint
          let webhookResponse;
          
          // First, try sending just the metadata using GET
          try {
            // Make the webhook request with just the metadata
            webhookResponse = await axios.get(webhookUrl, {
              params: webhookParams,
              timeout: 10000 // 10 second timeout for external API
            });
          } catch (getError) {
            console.log('GET webhook request failed, attempting POST with file data');
            
            // If GET fails, try sending the actual file with a POST request
            // Create a FormData object to send the file
            const formData = new FormData();
            
            // Read the file and create a blob
            const fileBuffer = fs.readFileSync(req.file!.path);
            const blob = new Blob([fileBuffer], { type: req.file!.mimetype });
            
            // Add the file to the form data
            formData.append('file', blob, req.file!.originalname);
            
            // Add all the metadata parameters as well
            Object.entries(webhookParams).forEach(([key, value]) => {
              formData.append(key, value);
            });
            
            // Make the POST request with the file
            webhookResponse = await axios.post(webhookUrl, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              timeout: 15000, // 15 second timeout for file upload
            });
          }
          
          console.log('Webhook response successful');
          
          // Process successful webhook response
          if (webhookResponse && webhookResponse.data) {
            console.log('Webhook response data:', webhookResponse.data);
            
            // Prepare and update the document with webhook response in a structured way
            await storage.updateDocument(newDocument.id, {
              notes: JSON.stringify({
                message: 'Document processed by webhook',
                documentType: category,
                webhookResponse: webhookResponse.data
              }),
            });
            
            // Broadcast the update
            broadcastDocumentUpdate(newDocument.id, 'processed', {
              message: 'Document processed by webhook',
              documentType: category,
              webhookResponse: webhookResponse.data
            });
          }
        } catch (error: any) {
          // Log the webhook error but don't fail the upload
          const errorMessage = error?.message || 'Unknown error';
          console.log('Webhook error (non-critical):', errorMessage);
          
          // Update the document notes to indicate webhook failure with structured format
          await storage.updateDocument(newDocument.id, {
            notes: JSON.stringify({
              message: 'Webhook processing failed',
              documentType: category,
              error: errorMessage
            })
          });
        }
      })();
      
      // Broadcast immediate success regardless of webhook status
      broadcastDocumentUpdate(newDocument.id, 'processed', {
        message: 'Document uploaded and stored successfully',
        documentType: category,
        fileInfo: {
          name: req.file!.originalname,
          size: req.file!.size,
          type: req.file!.mimetype
        }
      });
      
      // Return success to the client with the document ID
      res.status(201).json({
        success: true,
        documentId: newDocument.id,
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // Clean up the uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document'
      });
    }
  });
  
  // Webhook endpoint to receive document processing results
  app.post("/api/webhook/document-processed", async (req, res) => {
    try {
      const { documentId, status, metadata } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ error: "Missing documentId" });
      }
      
      const document = await storage.getDocument(parseInt(documentId, 10));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Update the document with the processing results
      const updatedDoc = await storage.updateDocument(document.id, {
        status: status || 'processed',
        notes: metadata ? JSON.stringify(metadata) : 'Processed by webhook',
        metadata: document.metadata || {}, // Initialize metadata if it doesn't exist
      });
      
      // Broadcast the update to connected clients
      broadcastDocumentUpdate(document.id, status || 'processed', metadata);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });
  
  // Download a document
  app.get("/api/documents/:id/download", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const documentId = parseInt(req.params.id, 10);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Verify the document belongs to a case owned by the user
      const probateCase = await storage.getProbateCase(document.caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this document" });
      }
      
      // Check if the file exists
      if (!document.storagePath || !fs.existsSync(document.storagePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      
      // Set the appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
      if (document.fileType) {
        res.setHeader('Content-Type', document.fileType);
      }
      
      // Stream the file to the client
      const fileStream = fs.createReadStream(document.storagePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });
  
  // View a document (similar to download but with inline disposition)
  app.get("/api/documents/:id/view", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const documentId = parseInt(req.params.id, 10);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Verify the document belongs to a case owned by the user
      const probateCase = await storage.getProbateCase(document.caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this document" });
      }
      
      // Check if the file exists
      if (!document.storagePath || !fs.existsSync(document.storagePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      
      // Set the appropriate headers for inline viewing
      res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
      if (document.fileType) {
        res.setHeader('Content-Type', document.fileType);
      }
      
      // Stream the file to the client
      const fileStream = fs.createReadStream(document.storagePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ error: "Failed to view document" });
    }
  });

  // Update document metadata - specifically for the "includedInEstate" flag
  app.patch("/api/documents/:id/metadata", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const documentId = parseInt(req.params.id, 10);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Verify the document belongs to a case owned by the user
      const probateCase = await storage.getProbateCase(document.caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this document" });
      }
      
      // Get the current metadata or initialize if not present
      const currentMetadata = document.metadata || {};
      
      // Extract metadata from request body - it might be nested under 'metadata' key
      const newMetadata = req.body.metadata || req.body;
      
      // Merge the existing metadata with the new metadata
      const updatedMetadata = { ...currentMetadata, ...newMetadata };
      
      console.log("Updating document metadata:", {
        documentId,
        currentMetadata,
        newMetadata,
        updatedMetadata
      });
      
      // If toggling off includedInEstate, we need to clean up related estate items
      if (currentMetadata.includedInEstate === true && updatedMetadata.includedInEstate === false) {
        // Find and delete any associated assets or liabilities
        if (currentMetadata.estateItemType === 'asset' && currentMetadata.estateItemId) {
          console.log(`Removing asset #${currentMetadata.estateItemId} from estate as document was toggled off`);
          await storage.deleteEstateAsset(currentMetadata.estateItemId);
        } else if (currentMetadata.estateItemType === 'liability' && currentMetadata.estateItemId) {
          console.log(`Removing liability #${currentMetadata.estateItemId} from estate as document was toggled off`);
          await storage.deleteEstateLiability(currentMetadata.estateItemId);
        }
      }
      
      // Update the document with the new metadata
      const updatedDocument = await storage.updateDocument(documentId, {
        metadata: updatedMetadata,
      });
      
      res.status(200).json({ 
        success: true, 
        document: updatedDocument,
        message: 'Document metadata updated successfully' 
      });
    } catch (error) {
      console.error("Error updating document metadata:", error);
      res.status(500).json({ error: "Failed to update document metadata" });
    }
  });
  
  app.delete("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const documentId = parseInt(req.params.id, 10);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Verify the document belongs to a case owned by the user
      const probateCase = await storage.getProbateCase(document.caseId);
      if (!probateCase || probateCase.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this document" });
      }
      
      // Delete the file if it exists
      if (document.storagePath && fs.existsSync(document.storagePath)) {
        fs.unlinkSync(document.storagePath);
      }
      
      // Update the document to mark it as deleted
      // This ensures we keep a record but mark it as deleted
      await storage.updateDocument(documentId, {
        status: 'deleted',
        notes: 'Document deleted by user',
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });
  
  // Public access endpoint for files - no authentication required
  // This is specifically for external integrations like n8n to access files
  app.get("/api/public/documents/:id/file", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id, 10);
      const document = await storage.getDocument(documentId);
      
      if (!document || document.status === 'deleted') {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Check if the file exists
      if (!document.storagePath || !fs.existsSync(document.storagePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      
      // Log access for security monitoring
      console.log(`PUBLIC file access for document ID ${documentId}:`, {
        filename: document.filename,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        referrer: req.headers.referer || 'N/A',
        userAgent: req.headers['user-agent'] || 'N/A'
      });
      
      // Add CORS headers to allow access from anywhere
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      // Set appropriate content type
      let contentType = 'application/octet-stream';
      if (document.fileType) {
        contentType = document.fileType;
      } else {
        // Try to determine by extension
        const ext = path.extname(document.filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        contentType = mimeTypes[ext] || contentType;
      }
      
      // Set the appropriate headers for inline viewing (better for API integrations)
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
      
      // Stream the file to the client
      const fileStream = fs.createReadStream(document.storagePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error accessing public document file:", error);
      res.status(500).json({ error: "Failed to access document file" });
    }
  });

  // Instead of strict IP whitelist, we'll log access attempts but allow all to make debugging easier
  const monitorAccessMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || 
                     (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                     req.socket.remoteAddress;
    
    // Log access for monitoring
    console.log(`File access attempt from IP: ${clientIP}, Filename: ${req.params.filename}, Referrer: ${req.headers.referer || 'N/A'}`);
    
    // Add CORS headers to allow access from anywhere
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Allow all requests to continue
    next();
  };
  
  // Serve uploaded files with access monitoring
  app.get("/uploads/:filename", monitorAccessMiddleware, (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename); // Use uploadDir defined at the top
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Set appropriate headers based on file type
    let contentType = req.query.contentType as string || 'application/octet-stream';
    
    // Try to determine content type based on file extension if not provided
    if (!req.query.contentType) {
      const ext = path.extname(filePath).toLowerCase();
      // Common mime types mapping
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.tar': 'application/x-tar',
        '.7z': 'application/x-7z-compressed',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv'
      };
      
      contentType = mimeTypes[ext] || contentType;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });

  return httpServer;
}
