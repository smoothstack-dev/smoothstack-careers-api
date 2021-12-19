import { gmail } from '@googleapis/gmail';
import { GoogleService } from 'src/model/GoogleCredentials';
import { getOauth2Client } from './auth/google.oauth.service';
import MailComposer from 'nodemailer/lib/mail-composer';

const getClient = async () => {
  const oauth2Client = await getOauth2Client(GoogleService.GMAIL);
  return gmail({ version: 'v1', auth: oauth2Client });
};

export const sendSignedDocument = async (candidateEmail: string, docType: string, document: string): Promise<void> => {
  const gmailClient = await getClient();
  const mail = new MailComposer({
    to: 'funding@smoothstack.com',
    text: `${candidateEmail} has signed the attached ${docType} Offer Document.`,
    html: `<strong>${candidateEmail} has signed the attached ${docType} Offer Document.</strong>`,
    subject: 'Signed Document Event',
    textEncoding: 'base64',
    attachments: [
      {
        // encoded string as an attachment
        filename: `Signed_${docType}_Document.pdf`,
        content: document,
        encoding: 'base64',
      },
    ],
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
