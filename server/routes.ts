import type { Express, Request, Response } from "express";
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
  // API routes for documents
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
      });
      
      // Still attempt to send to webhook but don't wait for it or fail if it's not available
      // This is done in a separate async function that doesn't affect the response
      (async () => {
        try {
          // Updated webhook URL provided by the user
          const webhookUrl = 'https://n8n.probateswift.com/webhook/fileupload';
          
          console.log(`Attempting to send document ${newDocument.id} to webhook: ${webhookUrl}`);
          
          // Build parameters
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
            
            // Update the document with webhook response
            await storage.updateDocument(newDocument.id, {
              notes: `${newDocument.notes}\nWebhook processing: ${JSON.stringify(webhookResponse.data)}`,
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
          
          // Update the document notes to indicate webhook failure
          await storage.updateDocument(newDocument.id, {
            notes: `${newDocument.notes}\nWebhook processing attempted but failed: ${errorMessage}`
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

  return httpServer;
}
