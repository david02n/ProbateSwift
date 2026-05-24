import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertCaseOwnership, assertDocumentOwnership } from "../helpers";
import { insertDocumentSchema } from "@shared/schema";
import { uploadToS3, getPresignedUrl, buildS3Key } from "../s3";
import { processDocument } from "../services/documentProcessor";
import { config } from "../config";
import { strictLimiter } from "../middleware/security";
import multer from "multer";

// Allowed MIME types for document uploads
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/tiff",
]);

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Accepted: PDF, JPEG, PNG, WebP, TIFF"));
    }
  },
});

export function registerDocumentRoutes(
  app: Express,
  requireAuth: RequestHandler,
  broadcast: (message: any) => void
): void {

  // POST /api/documents/upload — multipart upload → S3 → DB → Gemini async
  app.post("/api/documents/upload", strictLimiter, requireAuth, upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const caseId = parseInt(req.body.caseId, 10);
      if (!caseId || isNaN(caseId)) {
        return res.status(400).json({ error: "caseId is required" });
      }
      await assertCaseOwnership(user.id, caseId);

      const category = (req.body.category as string) || "general";

      // Sanitise the original filename before storing — user-controlled input
      const safeFilename = req.file.originalname
        .replace(/[^\w\s.\-()]/g, "_")
        .slice(0, 255);

      // 1. Upload buffer to S3
      const s3Key = buildS3Key(caseId, safeFilename);
      await uploadToS3(s3Key, req.file.buffer, req.file.mimetype);

      // 2. Create DB record with status 'processing'
      const doc = await storage.createDocument({
        caseId,
        userId: user.id,
        type: category,
        filename: safeFilename,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        storagePath: s3Key,
        status: "processing",
      });

      // 3. Respond immediately — client polls or listens via WebSocket
      res.status(201).json({ success: true, documentId: doc.id });

      // 4. Fire-and-forget: extract people/assets/liabilities and persist them
      const fileMimeType = req.file.mimetype;
      const docUserId = user.id;
      (async () => {
        try {
          const extraction = await processDocument(s3Key, category, fileMimeType);

          // Create people records (deceased, next of kin, executors)
          await Promise.all(
            extraction.people.map((p) =>
              storage.createExecutor({
                caseId,
                userId: docUserId,
                title:                 p.title ?? undefined,
                firstName:             p.firstName,
                lastName:              p.lastName,
                addressLine1:          p.addressLine1 ?? undefined,
                addressLine2:          p.addressLine2 ?? undefined,
                city:                  p.city ?? undefined,
                county:                p.county ?? undefined,
                postCode:              p.postCode ?? undefined,
                relationshipToDeceased: p.relationshipToDeceased ?? undefined,
                isExecutor:            p.isExecutor ?? false,
                documentId:            doc.id,
              })
            )
          );

          // Create estate asset records
          await Promise.all(
            extraction.assets.map((a) =>
              storage.createEstateAsset({
                caseId,
                documentId:    doc.id,
                type:          a.type,
                description:   a.description,
                value:         a.value !== null ? String(a.value) : undefined,
                address:       a.address ?? undefined,
                accountNumber: a.accountNumber ?? undefined,
                institution:   a.institution ?? undefined,
                ownership:     a.ownership ?? "sole",
              })
            )
          );

          // Create estate liability records
          await Promise.all(
            extraction.liabilities.map((l) =>
              storage.createEstateLiability({
                caseId,
                documentId:    doc.id,
                type:          l.type,
                description:   l.description,
                amount:        l.amount !== null ? String(l.amount) : undefined,
                creditor:      l.creditor ?? undefined,
                accountNumber: l.accountNumber ?? undefined,
              })
            )
          );

          // Mark document as processed with a summary of what was created
          await storage.updateDocument(doc.id, {
            status: "processed",
            metadata: {
              peopleCreated:      extraction.people.length,
              assetsCreated:      extraction.assets.length,
              liabilitiesCreated: extraction.liabilities.length,
            } as any,
          });

          broadcast({
            type:       "DOCUMENT_UPDATE",
            documentId: doc.id,
            status:     "processed",
            extracted: {
              people:      extraction.people.length,
              assets:      extraction.assets.length,
              liabilities: extraction.liabilities.length,
            },
          });
        } catch (err) {
          console.error(`[documentProcessor] failed for documentId=${doc.id}:`, err);
          await storage.updateDocument(doc.id, { status: "error" });
          broadcast({ type: "DOCUMENT_UPDATE", documentId: doc.id, status: "error" });
        }
      })();
    } catch (error) {
      next(error);
    }
  });

  // GET /api/documents/item/:id — single document (used by checkDocumentStatus)
  // Registered before /:caseId so Express doesn't try to parse "item" as an integer
  app.get("/api/documents/item/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const documentId = parseInt(req.params.id, 10);
      if (isNaN(documentId)) return res.status(400).json({ error: "Invalid ID" });
      const doc = await assertDocumentOwnership(user.id, documentId);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/documents/:id/view — redirect to short-lived presigned GET URL
  app.get("/api/documents/:id/view", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const documentId = parseInt(req.params.id, 10);
      if (isNaN(documentId)) return res.status(400).json({ error: "Invalid ID" });
      const doc = await assertDocumentOwnership(user.id, documentId);
      const url = await getPresignedUrl(doc.storagePath, 900);
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/documents/:id/download — return presigned URL + filename for client-side download
  app.get("/api/documents/:id/download", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const documentId = parseInt(req.params.id, 10);
      if (isNaN(documentId)) return res.status(400).json({ error: "Invalid ID" });
      const doc = await assertDocumentOwnership(user.id, documentId);
      const url = await getPresignedUrl(doc.storagePath, 900);
      res.json({ url, filename: doc.filename });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/documents/:caseId — all documents for a case
  app.get("/api/documents/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);
      const docs = await storage.getDocumentsByCaseId(caseId);
      res.json(docs);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/documents/:id — soft delete: status → 'deleted'
  app.delete("/api/documents/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const documentId = parseInt(req.params.id, 10);
      if (isNaN(documentId)) return res.status(400).json({ error: "Invalid ID" });
      await assertDocumentOwnership(user.id, documentId);
      await storage.updateDocument(documentId, { status: "deleted" });
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/documents/:id/metadata — update notes, metadata, or document type
  app.patch("/api/documents/:id/metadata", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const documentId = parseInt(req.params.id, 10);
      if (isNaN(documentId)) return res.status(400).json({ error: "Invalid ID" });
      await assertDocumentOwnership(user.id, documentId);

      const updateSchema = insertDocumentSchema.partial().pick({
        notes: true,
        metadata: true,
        type: true,
      });
      const updates = updateSchema.parse(req.body);
      const updated = await storage.updateDocument(documentId, updates);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/webhooks/document-callback — server-to-server callback (PUBLIC route, secret-protected)
  app.post("/api/webhooks/document-callback", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = config.N8N_WEBHOOK_SECRET;

      // In production the secret must always be configured
      if (config.NODE_ENV === "production" && !secret) {
        return res.status(503).json({ error: "Webhook endpoint not configured" });
      }

      if (secret) {
        const provided = req.headers["x-webhook-secret"] as string | undefined;
        if (!provided || provided !== secret) {
          return res.status(401).json({ error: "Invalid webhook secret" });
        }
      }

      const { documentId, status, extractedData, message } = req.body;

      if (!documentId || !status) {
        return res.status(400).json({ error: "documentId and status are required" });
      }

      // Validate status to a known set of values
      const VALID_STATUSES = ["processing", "processed", "error"];
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
      }

      // Verify the document exists before updating
      const doc = await storage.getDocument(Number(documentId));
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      await storage.updateDocument(doc.id, {
        status,
        ...(extractedData !== undefined && { metadata: extractedData }),
        ...(message !== undefined && { notes: String(message).slice(0, 1000) }),
      });

      broadcast({ type: "DOCUMENT_UPDATE", documentId: doc.id, status });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}
