import axios from 'axios';
import { JobSubmission } from 'src/model/JobSubmission';
import { getMSToken } from './auth/microsoft.oauth.service';

const BASE_URL = `https://graph.microsoft.com/v1.0/users/info@smoothstack.com/sendMail`;

export const sendSignedDocument = async (candidateEmail: string, docType: string, document: string): Promise<void> => {
  const authToken = await getMSToken();
  const message = {
    message: {
      subject: 'Signed Document Event',
      body: {
        contentType: 'HTML',
        content: `<strong>${candidateEmail} has signed the attached ${docType} Offer Document.</strong>`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: 'funding@smoothstack.com',
          },
        },
      ],
      attachments: [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: `Signed_${docType}_Document.pdf`,
          contentBytes: document,
        },
      ],
    },
  };
  await axios.post(`${BASE_URL}`, message, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

export const sendTechscreenResult = async (
  email: string,
  submission: JobSubmission,
  screenerEmail: string,
  screenerRecommendation: string
): Promise<void> => {
  const authToken = await getMSToken();
  const message = {
    message: {
      subject: 'Tech Screen Results',
      body: {
        contentType: 'HTML',
        content: `Job ID: ${submission.jobOrder.id}<br/>Job Name: ${submission.jobOrder.title}<br/>Candidate ID: ${submission.candidate.id}<br/>Candidate Email: ${submission.candidate.email}<br/>Screener Email: ${screenerEmail}<br/>Screener Determination: ${screenerRecommendation}`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: email,
          },
        },
      ],
    },
  };
  await axios.post(`${BASE_URL}`, message, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

// TODO: Recreate in MS Style

export const sendNewAccountEmail = async (
  fullName: string,
  corporateEmail: string,
  secondaryEmail: string,
  temporaryPassword: string
) => {
  // const gmailClient = await getClient();
  // const mail = new MailComposer({
  //   to: secondaryEmail,
  //   html: `Hi ${fullName},<br/><br/>You have a new Google Account with the Smoothstack organization.<br/><br/>Sign in to your Google Account to access the Google services your organization provides.<br/><br/>Login Url: https://accounts.google.com<br/>Your username: <strong>${corporateEmail}</strong><br/>Your Password: <strong>${temporaryPassword}<strong/><br/><br/>For your security, you must reset your password on initial login.<br/><br/><strong>Regards,<br/>Smoothstack Team<strong/>`,
  //   subject: 'Smoothstack Account Activation',
  //   textEncoding: 'base64',
  // });
  // const msg = await mail.compile().build();
  // const encodedMessage = Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  // await gmailClient.users.messages.send({
  //   userId: 'me',
  //   requestBody: {
  //     raw: encodedMessage,
  //   },
  // });
};

export const sendNewSAJobApplicationEmail = async (
  candidateName: string,
  jobId: number,
  jobName: string
): Promise<void> => {
  const authToken = await getMSToken();
  const message = {
    message: {
      subject: `${candidateName} applied for ${jobName}; Job ID:${jobId}`,
      body: {
        contentType: 'HTML',
        content: `This email is to inform you that <strong>${candidateName}</strong> applied for ${jobName}; Job ID:${jobId}.`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: 'staffaug@smoothstack.com',
          },
        },
      ],
    },
  };
  try {
    await axios.post(`${BASE_URL}`, message, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    console.log('Successfully send the email to staffaug for the new application');
  } catch (err) {
    console.error('Fail to send the email to staffaug for the new application', err);
  }
};
