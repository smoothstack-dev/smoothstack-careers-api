import HelloSign from 'hellosign-sdk';
import { JobSubmission, SAJobSubmission } from 'src/model/JobSubmission';
import { getHelloSignSecrets } from './secrets.service';
import { DocumentEventRequest } from 'src/model/DocumentEvent';
import { getSessionData, getStaffAugSessionData } from './auth/bullhorn.oauth.service';
import { fetchSubmission, saveCandidateNote, saveSubmissionStatus, uploadCandidateFile } from './careers.service';
import { sendSignedDocument } from './email.service';

const SUB_STATUS_DOCTYPE = {
  'Evaluation Offered': 'Evaluation',
};

const DOCTYPE_NAME = {
  Evaluation: 'Engagement Offer',
};

export const generateDocument = async (submission: JobSubmission) => {
  const { API_KEY } = await getHelloSignSecrets();
  const client = new HelloSign({ key: API_KEY });
  const templateId = await findTemplateId(client, submission);
  await sendSignatureRequest(client, templateId, submission);
};

const findTemplateId = async (client: HelloSign, submission: JobSubmission) => {
  const { templates } = await client.template.list();
  const searchKey = `${SUB_STATUS_DOCTYPE[submission.status]}_Offer`;
  return templates.find((t) => t.title === searchKey)?.template_id;
};

const sendSignatureRequest = async (client: HelloSign, templateId: string, submission: JobSubmission) => {
  const salaryFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const docType = SUB_STATUS_DOCTYPE[submission.status];
  const opts = {
    // test_mode: 1,
    template_id: templateId,
    subject: 'Smoothstack Document Signature Request',
    message: 'Please sign the following document to confirm enrollment.',
    signers: [
      {
        email_address: submission.candidate.email,
        name: `${submission.candidate.firstName} ${submission.candidate.lastName}`,
        role: 'Candidate',
      },
    ],
    custom_fields: [
      {
        name: 'todaysDate',
        value: new Date().toLocaleDateString('en-US', {
          timeZone: 'America/New_York',
        }),
      },
      {
        name: 'startDate',
        value: new Date(submission.jobOrder[`${docType.toLowerCase()}StartDate`]).toLocaleDateString('en-US', {
          timeZone: 'America/New_York',
        }),
      },
      {
        name: 'trainingLength',
        value: submission.jobOrder.trainingLength,
      },
      {
        name: 'year1Salary',
        value: `${salaryFormatter.format(submission.jobOrder.year1Salary)}+`,
      },
      {
        name: 'year2Salary',
        value: `${salaryFormatter.format(submission.jobOrder.year2Salary)}+`,
      },
      {
        name: 'recruiterEmail',
        value: submission.candidate.owner.email,
      },
      {
        name: 'recruiterName',
        value: `${submission.candidate.owner.firstName} ${submission.candidate.owner.lastName}`,
      },
      {
        name: 'candidatePhone',
        value: submission.candidate.phone,
      },
      {
        name: 'candidateEmail',
        value: submission.candidate.email,
      },
    ],
    metadata: { type: 'regular', docType, jobSubmissionId: submission.id },
  };

  await client.signatureRequest.sendWithTemplate(opts);
};

export const processDocumentEvent = async (eventReq: DocumentEventRequest) => {
  console.log('Received Document Event: ', eventReq);
  if (eventReq.event.event_type === 'signature_request_all_signed') {
    switch (eventReq.signature_request.metadata.type) {
      case 'staffAug':
        await processStaffAugDocEvent(eventReq);
        break;
      default:
        await processRegularDocEvent(eventReq);
        break;
    }
    console.log('Successfully Processed Document Event.');
  } else {
    console.log('Irrelevant Document Event. Skipping...');
  }
};

const processRegularDocEvent = async (eventReq: DocumentEventRequest) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { API_KEY } = await getHelloSignSecrets();
  const client = new HelloSign({ key: API_KEY });
  const signature = eventReq.signature_request.signatures.find((s) => s.signer_role === 'Candidate');
  const submissionId = eventReq.signature_request.metadata.jobSubmissionId;
  const submission = signature && (await fetchSubmission(restUrl, BhRestToken, submissionId));
  if (submission) {
    const signatureReqId = eventReq.signature_request.signature_request_id;
    const signedFile = await downloadSignedFile(client, signatureReqId);
    const docType = eventReq.signature_request.metadata.docType;
    await uploadCandidateFile(
      restUrl,
      BhRestToken,
      submission.candidate.id,
      signedFile,
      `Signed_${docType}_Document.pdf`,
      DOCTYPE_NAME[docType]
    );
    await sendSignedDocument(submission.candidate.email, docType, signedFile);
    if (submission.status === `${docType} Offered`) {
      await saveSubmissionStatus(restUrl, BhRestToken, submissionId, `${docType} Signed`);
    }
  }
};

const processStaffAugDocEvent = async (eventReq: DocumentEventRequest) => {
  const { restUrl, BhRestToken } = await getStaffAugSessionData();
  const { API_KEY } = await getHelloSignSecrets();
  const client = new HelloSign({ key: API_KEY });
  const signature = eventReq.signature_request.signatures.find((s) => s.signer_role === 'Candidate');
  const submissionId = eventReq.signature_request.metadata.jobSubmissionId;
  const submission = signature && (await fetchSubmission(restUrl, BhRestToken, submissionId));

  if (submission) {
    const signatureReqId = eventReq.signature_request.signature_request_id;
    if (submission.status === 'Send RTR') {
      await saveSubmissionStatus(restUrl, BhRestToken, submissionId, 'RTR Signed');
    }
    const signedFile = await downloadSignedFile(client, signatureReqId);
    await uploadCandidateFile(
      restUrl,
      BhRestToken,
      submission.candidate.id,
      signedFile,
      `Signed_RTR_Document.pdf`,
      'RTR Document'
    );
  }
};

const downloadSignedFile = async (client: HelloSign, signatureReqId: string) => {
  const opts = {
    file_type: 'pdf',
    get_data_uri: true,
  };
  const data = (await client.signatureRequest.download(signatureReqId, opts)) as any;
  return data.data_uri.split('base64, ')[1];
};

export const generateStaffAugDocument = async (submission: SAJobSubmission) => {
  if (isSASubmissionValid(submission)) {
    const { API_KEY } = await getHelloSignSecrets();
    const client = new HelloSign({ key: API_KEY });
    const templateId = await findStaffAugTemplateId(client);
    await sendStaffAugSignatureRequest(client, templateId, submission);
  } else {
    const { restUrl, BhRestToken } = await getStaffAugSessionData();
    const title = 'Invalid RTR Data Points';
    const note = 'Submission/Candidate does not have all needed data points for generating RTR Document.';
    await saveCandidateNote(restUrl, BhRestToken, submission.candidate.id, title, note);
  }
};

const findStaffAugTemplateId = async (client: HelloSign) => {
  const { templates } = await client.template.list();
  const searchKey = 'StaffAug_RTR';
  return templates.find((t) => t.title === searchKey)?.template_id;
};

const sendStaffAugSignatureRequest = async (client: HelloSign, templateId: string, submission: SAJobSubmission) => {
  const salaryFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const contractAnswer = submission.candidate.employeeType !== 'W2' && 'N/A';
  const opts = {
    // test_mode: 1,
    template_id: templateId,
    subject: 'Smoothstack Document Signature Request',
    message: 'Please sign the following Right to Represent document.',
    signers: [
      {
        email_address: submission.candidate.email,
        name: `${submission.candidate.firstName} ${submission.candidate.lastName}`,
        role: 'Candidate',
      },
    ],
    custom_fields: [
      {
        name: 'clientName',
        value: submission.jobOrder.clientCorporation.name,
      },
      {
        name: 'jobTitle',
        value: submission.jobOrder.title,
      },
      {
        name: 'payRate',
        value: salaryFormatter.format(submission.payRate),
      },
      {
        name: 'employeeType',
        value:
          submission.candidate.employeeType === 'W2'
            ? 'W2 Employee'
            : `${submission.candidate.employeeType} contractor without benefits`,
      },
      {
        name: 'willRelocate',
        value: submission.candidate.willRelocate ? 'am' : 'am not',
      },
      {
        name: 'pto',
        value: contractAnswer || submission.candidate.pto,
      },
      {
        name: 'federalHolidays',
        value: contractAnswer || submission.candidate.federalHolidays,
      },
      {
        name: 'healthBenefits',
        value: contractAnswer || submission.candidate.healthBenefits,
      },
      {
        name: 'retirement',
        value: contractAnswer || submission.candidate.retirement,
      },
    ],
    metadata: { type: 'staffAug', jobSubmissionId: submission.id },
  };

  await client.signatureRequest.sendWithTemplate(opts);
};

const isSASubmissionValid = (submission: SAJobSubmission) => {
  for (const prop in submission) {
    if (submission[prop] === null || submission[prop] === undefined) {
      return false;
    }
  }
  for (const prop in submission.candidate) {
    if (submission.candidate[prop] === null || submission.candidate[prop] === undefined) {
      return false;
    }
  }
  return true;
};
