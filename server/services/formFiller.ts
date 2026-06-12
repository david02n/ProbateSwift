import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import path from "node:path";
import { storage } from "../storage";

// Phase D — fill GOV.UK AcroForm PDFs from the data we already hold, producing a
// completed-but-still-editable PDF the executor can review, print, and sign.
// Mappings live in forms/mappings/<FORM>.json (field name → dotted context path);
// field inventories in forms/field-inventories/ list every fillable field.

const FORMS_DIR = path.resolve(process.cwd(), "forms");

// Supported form types → their mapping file. Add PA1A / IHT400 here as their
// mappings are built out (the field inventories already exist for both).
const FORM_MAPPINGS: Record<string, string> = {
  pa1p: "PA1P.json",
};

export function isSupportedForm(formType: string): boolean {
  return formType.toLowerCase() in FORM_MAPPINGS;
}

type FormContext = Record<string, Record<string, unknown>>;

/** Assemble a flat context (applicant, deceased, …) from the case's records. */
export async function buildFormContext(caseId: number): Promise<FormContext> {
  const [people, probateCase] = await Promise.all([
    storage.getPeopleByCaseId(caseId),
    storage.getProbateCase(caseId),
  ]);

  const applicant =
    people.find((p) => p.isApplicant) ?? people.find((p) => p.isExecutor) ?? null;
  const deceased =
    people.find((p) => (p.relationshipToDeceased ?? "").toLowerCase() === "deceased") ?? null;

  const join = (...parts: (string | null | undefined)[]) =>
    parts.filter(Boolean).join(" ").trim() || null;

  return {
    applicant: {
      title: applicant?.title ?? null,
      firstName: applicant?.firstName ?? null,
      middleNames: applicant?.middleNames ?? null,
      lastName: applicant?.lastName ?? null,
      addressLine1: applicant?.addressLine1 ?? null,
      addressLine2: applicant?.addressLine2 ?? null,
      city: applicant?.city ?? null,
      county: applicant?.county ?? null,
      postCode: applicant?.postCode ?? null,
      phoneHome: applicant?.phoneHome ?? null,
      phoneMobile: applicant?.phoneMobile ?? null,
      email: applicant?.email ?? null,
    },
    deceased: {
      firstName: deceased?.firstName ?? probateCase?.deceasedFirstName ?? null,
      middleNames: deceased?.middleNames ?? null,
      lastName: deceased?.lastName ?? probateCase?.deceasedLastName ?? null,
      forenames: join(
        deceased?.firstName ?? probateCase?.deceasedFirstName,
        deceased?.middleNames,
      ),
    },
  };
}

function resolvePath(ctx: FormContext, dotted: string): unknown {
  return dotted
    .split(".")
    .reduce<any>((o, k) => (o == null ? undefined : o[k]), ctx);
}

export interface FilledForm {
  bytes: Uint8Array;
  filledCount: number;
  totalMapped: number;
  title: string;
  filename: string;
}

/** Load the form, set every mapped field we have a value for, return the bytes. */
export async function fillForm(formType: string, context: FormContext): Promise<FilledForm> {
  const mapFile = FORM_MAPPINGS[formType.toLowerCase()];
  if (!mapFile) throw new Error(`Unsupported form type: ${formType}`);

  const mapping = JSON.parse(
    readFileSync(path.join(FORMS_DIR, "mappings", mapFile), "utf8"),
  ) as { form: string; title: string; text?: Record<string, string> };

  const pdfBytes = readFileSync(path.join(FORMS_DIR, mapping.form));
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();

  const entries = Object.entries(mapping.text ?? {});
  let filledCount = 0;
  for (const [fieldName, dotted] of entries) {
    const value = resolvePath(context, dotted);
    if (value == null || value === "") continue;
    try {
      form.getTextField(fieldName).setText(String(value));
      filledCount++;
    } catch {
      // Field missing or not a text field — skip; the user completes it by hand.
    }
  }

  const bytes = await doc.save();
  return {
    bytes,
    filledCount,
    totalMapped: entries.length,
    title: mapping.title,
    filename: `${formType.toLowerCase()}-draft.pdf`,
  };
}
