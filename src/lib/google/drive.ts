import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google/oauth";

export type DriveDocument = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string | null;
};

function authedDrive(refreshToken: string) {
  const auth = getGoogleOAuthClient("drive");
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth });
}

export async function listDriveDocuments(refreshToken: string) {
  const drive = authedDrive(refreshToken);
  const response = await drive.files.list({
    q: "trashed = false and (mimeType = 'application/pdf' or mimeType = 'text/plain' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'application/msword' or mimeType = 'application/vnd.google-apps.document')",
    fields: "files(id,name,mimeType,modifiedTime)",
    pageSize: 50,
    orderBy: "modifiedTime desc",
  });
  return (response.data.files ?? []) as DriveDocument[];
}

export async function downloadDriveDocument(refreshToken: string, fileId: string, mimeType: string) {
  const drive = authedDrive(refreshToken);

  if (mimeType === "application/vnd.google-apps.document") {
    const response = await drive.files.export(
      { fileId, mimeType: "text/plain" },
      { responseType: "arraybuffer" },
    );
    return {
      buffer: Buffer.from(response.data as ArrayBuffer),
      mimeType: "text/plain",
    };
  }

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" },
  );

  return {
    buffer: Buffer.from(response.data as ArrayBuffer),
    mimeType,
  };
}
