import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadFromS3 } from "../s3";
import { config } from "../config";

// ── Document type descriptions ────────────────────────────────────────────────

const DOCUMENT_TYPE_CONTEXT: Record<string, string> = {
  death_certificate: "a UK death certificate issued by a Register Office",
  identification:    "a UK identity document (passport or driving licence)",
  will:              "a UK last will and testament",
  property:          "a UK property document (title register, mortgage statement, or valuation)",
  financial:         "a UK financial document (bank statement, investment or savings account)",
  tax:               "a UK tax document (HMRC correspondence, self-assessment return, or inheritance tax form)",
  general:           "a document related to a UK probate case",
};

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(documentType: string): string {
  const context = DOCUMENT_TYPE_CONTEXT[documentType] ?? DOCUMENT_TYPE_CONTEXT.general;

  return `
You are a document data extraction assistant working on UK probate cases.
The attached document is ${context}.

Your job is to extract two things from this document:
1. Any people mentioned — particularly the deceased person and any next of kin, executors, or family members.
2. Any estate assets or liabilities — such as bank accounts, properties, investments, mortgages, or debts.

This data will be used to populate a probate case record, so accuracy is essential.

Rules:
- Return ONLY a valid JSON object. No explanation, no markdown, no code fences.
- Use null for any field you cannot find. Do not guess or infer values.
- For dates use DD/MM/YYYY format.
- For monetary values use a plain number with no currency symbols or commas.
- Split addresses into their components where possible.

Return this exact structure:
{
  "people": [
    {
      "title": string | null,
      "firstName": string,
      "lastName": string,
      "addressLine1": string | null,
      "addressLine2": string | null,
      "city": string | null,
      "county": string | null,
      "postCode": string | null,
      "relationshipToDeceased": string | null,
      "isExecutor": boolean,
      "dateOfBirth": string | null,
      "dateOfDeath": string | null
    }
  ],
  "assets": [
    {
      "type": "property" | "bank_account" | "investment" | "pension" | "vehicle" | "other",
      "description": string,
      "value": number | null,
      "address": string | null,
      "accountNumber": string | null,
      "institution": string | null,
      "ownership": "sole" | "joint"
    }
  ],
  "liabilities": [
    {
      "type": "mortgage" | "loan" | "credit_card" | "tax" | "other",
      "description": string,
      "amount": number | null,
      "creditor": string | null,
      "accountNumber": string | null
    }
  ]
}

If no people, assets, or liabilities are found, return empty arrays for those fields.
`.trim();
}

// ── Extracted data types ──────────────────────────────────────────────────────

export interface ExtractedPerson {
  title: string | null;
  firstName: string;
  lastName: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  county: string | null;
  postCode: string | null;
  relationshipToDeceased: string | null;
  isExecutor: boolean;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
}

export interface ExtractedAsset {
  type: string;
  description: string;
  value: number | null;
  address: string | null;
  accountNumber: string | null;
  institution: string | null;
  ownership: "sole" | "joint";
}

export interface ExtractedLiability {
  type: string;
  description: string;
  amount: number | null;
  creditor: string | null;
  accountNumber: string | null;
}

export interface ExtractionResult {
  people: ExtractedPerson[];
  assets: ExtractedAsset[];
  liabilities: ExtractedLiability[];
}

// ── Main processor ────────────────────────────────────────────────────────────

/**
 * Download a document from S3, send it to Gemini 2.0 Flash, and extract
 * people (deceased, next of kin, executors) and estate assets/liabilities.
 */
export async function processDocument(
  s3Key: string,
  documentType: string,
  mimeType: string
): Promise<ExtractionResult> {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured — cannot process document");
  }

  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const fileBuffer = await downloadFromS3(s3Key);
  const prompt = buildPrompt(documentType);

  const result = await model.generateContent([
    {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: mimeType || "application/pdf",
      },
    },
    prompt,
  ]);

  const raw = result.response.text().trim();

  // Strip markdown code fences if the model wraps its response despite instructions
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      people:      Array.isArray(parsed.people)      ? parsed.people      : [],
      assets:      Array.isArray(parsed.assets)      ? parsed.assets      : [],
      liabilities: Array.isArray(parsed.liabilities) ? parsed.liabilities : [],
    };
  } catch {
    console.warn("[documentProcessor] Failed to parse JSON from model response:", cleaned);
    return { people: [], assets: [], liabilities: [] };
  }
}
