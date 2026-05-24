import { storage } from "./storage";
import { NotFoundError, AuthorizationError } from "./errors";
import type { ProbateCase, Executor, Document } from "@shared/schema";

/**
 * Verify that a probate case exists and belongs to the given user.
 * Throws NotFoundError or AuthorizationError on failure.
 */
export async function assertCaseOwnership(
  userId: string,
  caseId: number
): Promise<ProbateCase> {
  const probateCase = await storage.getProbateCase(caseId);
  if (!probateCase) {
    throw new NotFoundError("Probate case not found");
  }
  if (probateCase.userId !== userId) {
    throw new AuthorizationError("You do not have access to this case");
  }
  return probateCase;
}

/**
 * Verify that a person record exists and belongs to the given user.
 * Throws NotFoundError or AuthorizationError on failure.
 */
export async function assertPersonOwnership(
  userId: string,
  personId: number
): Promise<Executor> {
  const person = await storage.getExecutor(personId);
  if (!person) {
    throw new NotFoundError("Person not found");
  }
  if (person.userId !== userId) {
    throw new AuthorizationError("You do not have access to this person");
  }
  return person;
}

/**
 * Verify that a document record exists and that the user owns its case.
 * Throws NotFoundError or AuthorizationError on failure.
 */
export async function assertDocumentOwnership(
  userId: string,
  documentId: number
): Promise<Document> {
  const doc = await storage.getDocument(documentId);
  if (!doc) {
    throw new NotFoundError("Document not found");
  }
  // Ownership is via the case
  await assertCaseOwnership(userId, doc.caseId);
  return doc;
}
