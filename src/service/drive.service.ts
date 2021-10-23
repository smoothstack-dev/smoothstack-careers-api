import { drive, drive_v3 } from '@googleapis/drive';
import { Candidate } from 'src/model/Candidate';
import { DriveFile } from 'src/model/DriveFile';
import { GoogleService } from 'src/model/GoogleCredentials';
import { ResumeFile } from 'src/model/ResumeFile';
import { Readable } from 'stream';
import { getOauth2Client } from './auth/google.oauth.service';

const getClient = async () => {
  const oauth2Client = await getOauth2Client(GoogleService.DRIVE);
  return drive({ version: 'v3', auth: oauth2Client });
};

export const processResumeFile = async (candidate: Candidate, candidateResume: ResumeFile): Promise<DriveFile> => {
  const driveClient = await getClient();
  const uploadedFile = await uploadFile(driveClient, candidate, candidateResume);
  await driveClient.permissions.create({
    fileId: uploadedFile.id,
    sendNotificationEmail: false,
    requestBody: { role: 'reader', type: 'anyone', allowFileDiscovery: false },
  });
  return uploadedFile;
};

const uploadFile = async (
  driveClient: drive_v3.Drive,
  candidate: Candidate,
  candidateResume: ResumeFile
): Promise<DriveFile> => {
  const file = Readable.from(Buffer.from(candidateResume.fileContent, 'base64'));
  const fileExtension = candidateResume.name.substring(candidateResume.name.lastIndexOf('.') + 1);

  const metadata = {
    name: `RESUME_${candidate.firstName.toUpperCase()}_${candidate.lastName.toUpperCase()}.${fileExtension}`,
    parents: ['1-KV27dc5dmdAPcZgm0eVryS7zX_QSSPr'],
  };
  const media = {
    mimeType: candidateResume.contentType,
    body: file,
  };

  const { data } = await driveClient.files.create({
    requestBody: metadata,
    media,
    fields: 'id,webViewLink,name',
  });

  return data as DriveFile;
};
