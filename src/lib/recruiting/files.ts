import crypto from "node:crypto";
import mammoth from "mammoth";

export function fileHash(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function safeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function extensionFromName(name: string) {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() || "bin";
}

export async function fileToBuffer(file: File) {
  return Buffer.from(await file.arrayBuffer());
}

export async function extractTextFromBuffer(fileName: string, mimeType: string, buffer: Buffer) {
  const ext = extensionFromName(fileName);

  if (mimeType.includes("text") || ext === "txt") {
    return buffer.toString("utf8").trim();
  }

  if (mimeType.includes("pdf") || ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (mimeType.includes("wordprocessingml") || ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (ext === "doc") {
    return buffer.toString("utf8").replace(/\0/g, " ").trim();
  }

  throw new Error("Formato no compatible. Usa PDF, DOC, DOCX o TXT.");
}
