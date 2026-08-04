// Heuristic field extraction over raw OCR output. Kenyan HR documents don't
// have a machine-readable layout, so this is regex/label matching rather than
// a trained model — it's a head start for the human reviewer, not a source
// of truth. Every extracted field is shown editable in the review step and
// nothing is filed until HR confirms it.

export type OcrWord = { text: string; confidence: number };

export type ExtractedField = {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0-100, derived from the OCR word confidences behind this value
};

const LABEL_NOISE = [
  "REPUBLIC",
  "KENYA",
  "IDENTITY",
  "CARD",
  "SERIAL",
  "DISTRICT",
  "PLACE",
  "ISSUE",
  "SEX",
  "DATE",
  "BIRTH",
  "NATIONAL",
  "NUMBER",
  "HOLDER",
  "SIGNATURE",
  "CERTIFICATE",
  "ENTRY",
  "REGISTRATION",
];

function cleanToken(s: string): string {
  return s.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

// Averages the confidence of whatever OCR words make up `value`, falling
// back to the page-level confidence when no individual words can be matched
// (e.g. a value assembled from multiple words that got merged/split by OCR).
function confidenceFor(value: string, words: OcrWord[], fallback: number): number {
  const tokens = value.split(/\s+/).map(cleanToken).filter(Boolean);
  if (tokens.length === 0) return fallback;

  const matched: number[] = [];
  for (const token of tokens) {
    const hit = words.find((w) => cleanToken(w.text) === token);
    if (hit) matched.push(hit.confidence);
  }
  if (matched.length === 0) return fallback;
  return Math.round(matched.reduce((a, b) => a + b, 0) / matched.length);
}

function normalizeDate(raw: string): string | null {
  const m = raw.match(/(\d{1,2})[.\-\/\s](\d{1,2})[.\-\/\s](\d{2,4})/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = (Number(y) > 30 ? "19" : "20") + y;
  const dd = d.padStart(2, "0");
  const mm = mo.padStart(2, "0");
  if (Number(dd) > 31 || Number(mm) > 12) return null;
  return `${y}-${mm}-${dd}`;
}

function findDate(text: string): string | null {
  const m = text.match(/\d{1,2}[.\-\/\s]\d{1,2}[.\-\/\s]\d{2,4}/);
  return m ? normalizeDate(m[0]) : null;
}

function findLabeledLine(lines: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(labelPattern);
    if (m) {
      // Value is often on the same line after the label, or on the next line.
      const sameLine = lines[i].slice((m.index ?? 0) + m[0].length).trim();
      if (sameLine.length >= 2) return sameLine;
      const next = lines[i + 1]?.trim();
      if (next && next.length >= 2) return next;
    }
  }
  return null;
}

// Fallback when there's no clear label: the longest ALL-CAPS, letters+spaces
// line that isn't boilerplate — usually the name on an ID-style document.
function guessNameLine(lines: string[]): string | null {
  const candidates = lines
    .map((l) => l.trim())
    .filter((l) => /^[A-Z\s.'-]{4,}$/.test(l) && l.split(/\s+/).length >= 2)
    .filter((l) => !LABEL_NOISE.some((noise) => l.includes(noise)));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

function extractNationalId(text: string, lines: string[], words: OcrWord[]): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const pageConf = words.length ? Math.round(words.reduce((s, w) => s + w.confidence, 0) / words.length) : 50;

  const idMatch = text.match(/\b\d{7,9}\b/);
  if (idMatch) {
    fields.push({ key: "idNumber", label: "ID Number", value: idMatch[0], confidence: confidenceFor(idMatch[0], words, pageConf) });
  }

  const name = findLabeledLine(lines, /full\s*names?/i) ?? guessNameLine(lines);
  if (name) {
    fields.push({ key: "fullName", label: "Full Name", value: name.trim(), confidence: confidenceFor(name, words, pageConf) });
  }

  const dob = findDate(text);
  if (dob) {
    fields.push({ key: "dateOfBirth", label: "Date of Birth", value: dob, confidence: confidenceFor(dob.replace(/-/g, ""), words, pageConf) });
  }

  const sexMatch = text.match(/\bSEX[:\s]*([MF])\b/i) ?? text.match(/\b(MALE|FEMALE)\b/i);
  if (sexMatch) {
    const value = sexMatch[1].toUpperCase().startsWith("M") ? "Male" : "Female";
    fields.push({ key: "sex", label: "Sex", value, confidence: confidenceFor(sexMatch[0], words, pageConf) });
  }

  return fields;
}

function extractBirthCertificate(text: string, lines: string[], words: OcrWord[]): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const pageConf = words.length ? Math.round(words.reduce((s, w) => s + w.confidence, 0) / words.length) : 50;

  const name = findLabeledLine(lines, /\bname\b/i) ?? guessNameLine(lines);
  if (name) {
    fields.push({ key: "fullName", label: "Full Name", value: name.trim(), confidence: confidenceFor(name, words, pageConf) });
  }

  const dob = findDate(text);
  if (dob) {
    fields.push({ key: "dateOfBirth", label: "Date of Birth", value: dob, confidence: confidenceFor(dob.replace(/-/g, ""), words, pageConf) });
  }

  const place = findLabeledLine(lines, /place\s*of\s*birth/i);
  if (place) {
    fields.push({ key: "placeOfBirth", label: "Place of Birth", value: place.trim(), confidence: confidenceFor(place, words, pageConf) });
  }

  const sexMatch = text.match(/\bSEX[:\s]*([MF])\b/i) ?? text.match(/\b(MALE|FEMALE)\b/i);
  if (sexMatch) {
    const value = sexMatch[1].toUpperCase().startsWith("M") ? "Male" : "Female";
    fields.push({ key: "sex", label: "Sex", value, confidence: confidenceFor(sexMatch[0], words, pageConf) });
  }

  return fields;
}

function extractKraPin(text: string, lines: string[], words: OcrWord[]): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const pageConf = words.length ? Math.round(words.reduce((s, w) => s + w.confidence, 0) / words.length) : 50;

  const pinMatch = text.match(/\b[A-Z]\d{9}[A-Z]\b/);
  if (pinMatch) {
    fields.push({ key: "pin", label: "KRA PIN", value: pinMatch[0], confidence: confidenceFor(pinMatch[0], words, pageConf) });
  }

  const name = findLabeledLine(lines, /taxpayer\s*name|\bname\b/i) ?? guessNameLine(lines);
  if (name) {
    fields.push({ key: "fullName", label: "Taxpayer Name", value: name.trim(), confidence: confidenceFor(name, words, pageConf) });
  }

  return fields;
}

// Generic fallback for the other 15 document categories, which don't have a
// predictable field layout (appointment letters, appraisals, memos, etc.).
function extractGeneric(text: string, lines: string[], words: OcrWord[]): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const pageConf = words.length ? Math.round(words.reduce((s, w) => s + w.confidence, 0) / words.length) : 50;

  const date = findDate(text);
  if (date) {
    fields.push({ key: "date", label: "Date Found", value: date, confidence: confidenceFor(date.replace(/-/g, ""), words, pageConf) });
  }

  const nameLine = guessNameLine(lines);
  if (nameLine) {
    fields.push({ key: "possibleName", label: "Possible Name", value: nameLine.trim(), confidence: confidenceFor(nameLine, words, pageConf) });
  }

  return fields;
}

const EXTRACTORS: Record<string, (text: string, lines: string[], words: OcrWord[]) => ExtractedField[]> = {
  "05_National_ID": extractNationalId,
  "02_Birth_Certificate": extractBirthCertificate,
  "07_KRA_PIN": extractKraPin,
};

export function extractFields(categoryKey: string, rawText: string, words: OcrWord[]): ExtractedField[] {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const extractor = EXTRACTORS[categoryKey] ?? extractGeneric;
  return extractor(rawText, lines, words);
}

export type FieldMismatch = {
  key: string;
  message: string;
};

// Cross-checks extracted values against the employee record already selected
// for this scan — since the employee is picked before scanning, a mismatch
// here is a strong, near-free signal that the wrong document (or wrong
// employee) is about to be filed.
export function crossCheckAgainstEmployee(
  fields: ExtractedField[],
  employee: { fullName: string; nationalId: string; dateOfBirth?: string }
): FieldMismatch[] {
  const mismatches: FieldMismatch[] = [];
  const byKey = new Map(fields.map((f) => [f.key, f.value]));

  const nameField = byKey.get("fullName");
  if (nameField) {
    const empTokens = employee.fullName.toUpperCase().split(/\s+/).filter(Boolean);
    const scannedTokens = new Set(nameField.toUpperCase().split(/\s+/).filter(Boolean));
    const overlap = empTokens.filter((t) => scannedTokens.has(t)).length / Math.max(empTokens.length, 1);
    if (overlap < 0.5) {
      mismatches.push({ key: "fullName", message: `Scanned name doesn't look like ${employee.fullName} — double-check this is the right document.` });
    }
  }

  const idField = byKey.get("idNumber");
  if (idField && employee.nationalId && idField.replace(/\D/g, "") !== employee.nationalId.replace(/\D/g, "")) {
    mismatches.push({ key: "idNumber", message: `Scanned ID number doesn't match this employee's National ID on file (${employee.nationalId}).` });
  }

  const dobField = byKey.get("dateOfBirth");
  if (dobField && employee.dateOfBirth && dobField !== employee.dateOfBirth) {
    mismatches.push({ key: "dateOfBirth", message: `Scanned date of birth (${dobField}) doesn't match the record on file (${employee.dateOfBirth}).` });
  }

  return mismatches;
}
