import { gmail } from '@googleapis/gmail';
import { GoogleService } from 'src/model/GoogleCredentials';
import { getOauth2Client } from './auth/google.oauth.service';
import MailComposer from 'nodemailer/lib/mail-composer';
import { JobSubmission } from 'src/model/JobSubmission';

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

export const sendChallengeSchedulingAlert = async (email: string): Promise<void> => {
  const gmailClient = await getClient();
  const mail = new MailComposer({
    to: email,
    html: `Greetings,<br/><br/>Thank you for scheduling a Coding Challenge with Smoothstack.<br/>Unfortunately, scheduling your challenge has failed for the following reason:<br/><br/>- The email address (<strong>${email}</strong>) you have entered is invalid.<br/><br/>Please try to reschedule your challenge using the scheduling link previously sent to you <strong>without</strong> modifying the prepopulated email address within the scheduling url. The email address should be in the following format: <strong>coding_challenge_xxxx@smoothstack.com</strong> or <strong>xxxx@smoothstack.com</strong>.`,
    subject: 'Smoothstack Coding Challenge Scheduling Failure',
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

export const sendTechscreenResult = async (
  email: string,
  submission: JobSubmission,
  screenerEmail: string,
  screenerRecommendation: string
): Promise<void> => {
  const gmailClient = await getClient();
  const mail = new MailComposer({
    to: email,
    html: `Job ID: ${submission.jobOrder.id}<br/>Job Name: ${submission.jobOrder.title}<br/>Candidate ID: ${submission.candidate.id}<br/>Candidate Email: ${submission.candidate.email}<br/>Screener Email: ${screenerEmail}<br/>Screener Determination: ${screenerRecommendation}`,
    subject: 'Tech Screen Results',
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
