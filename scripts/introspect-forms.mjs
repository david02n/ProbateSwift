// One-off tooling (Phase D): dump every AcroForm field name + type from the
// GOV.UK PDFs in forms/ so we can build data→field mappings. Run:
//   node scripts/introspect-forms.mjs
import { PDFDocument } from "pdf-lib";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const FORMS_DIR = path.resolve("forms");
const OUT_DIR = path.resolve("forms", "field-inventories");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const pdfs = readdirSync(FORMS_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));

for (const file of pdfs) {
  try {
    const bytes = readFileSync(path.join(FORMS_DIR, file));
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = doc.getForm();
    const fields = form.getFields().map((f) => {
      const type = f.constructor.name; // PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown...
      const entry = { name: f.getName(), type };
      if (type === "PDFRadioGroup" || type === "PDFDropdown") {
        try {
          entry.options = f.getOptions();
        } catch {
          /* some fields don't expose options */
        }
      }
      return entry;
    });
    const out = { file, fieldCount: fields.length, fields };
    const base = file.replace(/\.pdf$/i, "");
    writeFileSync(path.join(OUT_DIR, `${base}.json`), JSON.stringify(out, null, 2));
    console.log(`${file}: ${fields.length} fields`);
  } catch (err) {
    console.log(`${file}: ERROR — ${err.message}`);
  }
}
