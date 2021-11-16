import { gmail } from '@googleapis/gmail';
import { GoogleService } from 'src/model/GoogleCredentials';
import { getOauth2Client } from './auth/google.oauth.service';
import MailComposer from 'nodemailer/lib/mail-composer';

const getClient = async () => {
  const oauth2Client = await getOauth2Client(GoogleService.GMAIL);
  return gmail({ version: 'v1', auth: oauth2Client });
};

// TODO: Remove when candidate challenge flow is purged
export const sendOldCalendarAlertEmail = async (candidateEmail: string): Promise<void> => {
  const gmailClient = await getClient();
  const mail = new MailComposer({
    to: 'boris.kuiper@smoothstack.com',
    text: `${candidateEmail} has scheduled Coding Challenge using old scheduling calendar.`,
    html: `<strong>${candidateEmail} has scheduled Coding Challenge using old scheduling calendar.</strong>`,
    subject: 'Old Challenge Calendar Scheduling Action Occurred',
    textEncoding: 'base64',
  });
  const msg = await mail.compile().build();
  const encodedMessage = Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmailClient.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
};
