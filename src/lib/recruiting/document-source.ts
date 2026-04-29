import { downloadDriveDocument } from "@/lib/google/drive";
import { fileToBuffer } from "@/lib/recruiting/files";

export type SourceDocument = {
  id?: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export interface DocumentSourceProvider {
  readonly source: "drive" | "upload" | "sap";
  getDocument(input: unknown): Promise<SourceDocument>;
}

export class DriveDocumentSourceProvider implements DocumentSourceProvider {
  readonly source = "drive" as const;

  constructor(private refreshToken: string) {}

  async getDocument(input: unknown) {
    const document = input as { id: string; name: string; mimeType: string };
    const downloaded = await downloadDriveDocument(this.refreshToken, document.id, document.mimeType);
    return {
      id: document.id,
      fileName: document.name,
      mimeType: downloaded.mimeType,
      buffer: downloaded.buffer,
    };
  }
}

export class UploadDocumentSourceProvider implements DocumentSourceProvider {
  readonly source = "upload" as const;

  async getDocument(input: unknown) {
    const file = input as File;
    return {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer: await fileToBuffer(file),
    };
  }
}

export class SapDocumentSourceProvider implements DocumentSourceProvider {
  readonly source = "sap" as const;

  async getDocument(): Promise<SourceDocument> {
    throw new Error("SapDocumentSourceProvider queda reservado para la integración SAP real.");
  }
}
