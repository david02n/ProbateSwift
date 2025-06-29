import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupStytchAuth, verifyStytchSession } from "./stytch";
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
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    cb(null, `${baseName}-${timestamp}${extension}`);
  },
});

const upload = multer({ storage: storage2 });

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a HTTP server for the express app
  const httpServer = createServer(app);
  
  // Setup Stytch authentication
  setupStytchAuth(app);
  console.log('Stytch authentication middleware registered');

  // Initialize WebSocket Server for real-time notifications
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true
  });

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket, req) => {
    console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        
        // Echo back for now - can be expanded for real-time features
        ws.send(JSON.stringify({
          type: 'echo',
          data: message,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'broadcast',
          data: message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  // Protected routes require authentication
  const requireAuth = verifyStytchSession;

  // Session refresh endpoint for maintaining active sessions
  app.post('/api/session-refresh', (req: Request, res: Response) => {
    // Basic session health check
    if (req.session) {
      // Extend session expiry by touching it
      req.session.touch();
      res.json({ 
        message: 'Session refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({ message: 'No active session' });
    }
  });

  // Document upload endpoint
  app.post('/api/documents/upload', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const { type, caseId, metadata } = req.body;
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get user from authenticated request
      const user = (req as any).user;
      
      // Store document information in database
      const document = await storage.createDocument({
        type: type || 'general',
        userId: user.id,
        caseId: caseId ? parseInt(caseId) : undefined,
        filename: file.filename,
        storagePath: file.path,
        metadata: metadata ? JSON.parse(metadata) : null,
        status: 'uploaded',
        fileSize: file.size,
        fileType: file.mimetype,
        notes: null
      });

      res.json({
        message: 'File uploaded successfully',
        document: document
      });

      // Broadcast upload notification
      broadcast({
        type: 'document_uploaded',
        userId: user.id,
        documentId: document.id,
        filename: file.filename
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  // Basic health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return httpServer;
}