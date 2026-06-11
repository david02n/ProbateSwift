import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { assertCaseOwnership } from "../helpers";
import { insertProbateCaseSchema } from "@shared/schema";

export function registerCaseRoutes(app: Express, requireAuth: RequestHandler): void {

  // GET /api/probate-cases/current — must be before /:caseId
  app.get("/api/probate-cases/current", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const cases = await storage.getProbateCasesByUserId(user.id);
      const active = cases.find(c => c.status === "draft") ?? cases[0] ?? null;
      res.json(active);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/probate-cases/:caseId/progress — computed milestone progress
  // Must be before /:caseId to avoid Express treating "progress" as an ID
  app.get("/api/probate-cases/:caseId/progress", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      // Fetch all data needed to compute progress in parallel
      const [intakeRecord, people, assets, liabilities, documents] = await Promise.all([
        storage.getIntakeByCaseId(caseId),
        storage.getPeopleByCaseId(caseId),
        storage.getEstateAssetsByCaseId(caseId),
        storage.getEstateLiabilitiesByCaseId(caseId),
        storage.getDocumentsByCaseId(caseId),
      ]);

      const answers: Record<string, any> = (intakeRecord?.answers as Record<string, any>) ?? {};

      // Helper — returns true if any of the given answer keys are present and non-null
      const hasAnswers = (...keys: string[]) =>
        keys.some(k => answers[k] !== undefined && answers[k] !== null);

      const completedSections: string[] = [];

      // ── applicant_details ───────────────────────────────────────────────────
      // Complete when: about_applicant section answered OR an executor/applicant exists
      if (
        hasAnswers("named_executor_in_will", "number_of_applicants") ||
        people.some(p => p.isExecutor || p.isApplicant)
      ) {
        completedSections.push("applicant_details");
      }

      // ── deceased_details ────────────────────────────────────────────────────
      // Complete when: deceased section answered OR deceased person record exists
      const deceasedPerson = people.find(
        p => p.relationshipToDeceased?.toLowerCase() === "deceased"
      );
      const deceasedFields = deceasedPerson
        ? await storage.getDeceasedFormFields(deceasedPerson.id)
        : null;

      if (
        hasAnswers("deceased_domiciled_uk", "death_in_england_wales", "has_will") ||
        deceasedPerson !== undefined ||
        deceasedFields !== null
      ) {
        completedSections.push("deceased_details");
      }

      // ── estate_overview ─────────────────────────────────────────────────────
      // Complete when: estate/tax section answered OR assets exist
      if (
        hasAnswers("estate_value_estimate", "estate_excepted_from_iht", "gifts_last_7_years") ||
        assets.length > 0
      ) {
        completedSections.push("estate_overview");
      }

      // ── legal_requirements ──────────────────────────────────────────────────
      // Complete when: will+executors AND iht_readiness sections are answered
      if (
        hasAnswers("iht400_completed", "estate_excepted_from_iht") &&
        hasAnswers("all_executors_applying", "will_date", "has_will")
      ) {
        completedSections.push("legal_requirements");
      }

      res.json({
        completedSections,
        counts: {
          people:      people.length,
          assets:      assets.length,
          liabilities: liabilities.length,
          documents:   documents.filter(d => d.status !== "deleted").length,
        },
        evaluationStarted: intakeRecord !== undefined,
        evaluationFlags:   intakeRecord?.derivedFlags ?? null,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/probate-cases/:caseId
  app.get("/api/probate-cases/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      const probateCase = await assertCaseOwnership(user.id, caseId);
      res.json(probateCase);
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/probate-cases/:caseId
  app.patch("/api/probate-cases/:caseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const caseId = parseInt(req.params.caseId, 10);
      if (isNaN(caseId)) return res.status(400).json({ error: "Invalid ID" });
      await assertCaseOwnership(user.id, caseId);

      const updateSchema = insertProbateCaseSchema.partial().omit({ userId: true });
      const updates = updateSchema.parse(req.body);

      const updated = await storage.updateProbateCase(caseId, updates);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
}
