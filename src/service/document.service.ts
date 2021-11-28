import HelloSign from 'hellosign-sdk';
import { JobSubmission } from 'src/model/JobSubmission';
import { getHelloSignSecrets } from './secrets.service';
import { DocumentEventRequest } from 'src/model/DocumentEvent';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { fetchSubmission, saveSubmissionStatus, uploadCandidateFile } from './careers.service';
import { DocusignClientData, generateDocusignClient } from './auth/docusign.jwt.service';
import { EnvelopesApi, TemplatesApi, EnvelopeDefinition, EnvelopeTemplate } from 'docusign-esign';

const SUB_STATUS_DOCTYPE = {
  'Evaluation Offered': 'Evaluation',
  'SE Offered': 'SE',
};

const DOCTYPE_NAME = {
  Evaluation: 'Engagement Offer',
  SE: 'SE Offer',
};

// TODO: Remove
export const generateDocument = async (submission: JobSubmission) => {
  const { API_KEY } = await getHelloSignSecrets();
  const client = new HelloSign({ key: API_KEY });
  const templateId = await findTemplateId(client, submission);
  await sendSignatureRequest(client, templateId, submission);
};

//TODO: Remove
const findTemplateId = async (client: HelloSign, submission: JobSubmission) => {
  const { templates } = await client.template.list();
  const searchKey = `${SUB_STATUS_DOCTYPE[submission.status]}_Offer`;
  return templates.find((t) => t.title === searchKey)?.template_id;
};

//TODO: Remove
const sendSignatureRequest = async (client: HelloSign, templateId: string, submission: JobSubmission) => {
  const salaryFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const docType = SUB_STATUS_DOCTYPE[submission.status];
  const opts = {
    test_mode: 1, //TODO: Remove
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
        name: 'startDate',
        value: new Date(submission.jobOrder[`${docType.toLowerCase()}StartDate`]).toLocaleDateString('en-US', {
          timeZone: 'America/New_York',
        }),
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
    metadata: { docType, jobSubmissionId: submission.id },
  };

  await client.signatureRequest.sendWithTemplate(opts);
};

// TODO: Remove
export const processDocumentEvent = async (eventReq: DocumentEventRequest) => {
  console.log('Received Document Event: ', eventReq);
  if (eventReq.event.event_type === 'signature_request_all_signed') {
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
      if (submission.status === `${docType} Offered`) {
        await saveSubmissionStatus(restUrl, BhRestToken, submissionId, `${docType} Signed`);
      }
    }
    console.log('Successfully Processed Document Event.');
  } else {
    console.log('Irrelevant Document Event. Skipping...');
  }
};

// TODO: remove
const downloadSignedFile = async (client: HelloSign, signatureReqId: string) => {
  const opts = {
    file_type: 'pdf',
    get_data_uri: true,
  };
  const data = (await client.signatureRequest.download(signatureReqId, opts)) as any;
  return data.data_uri.split('base64, ')[1];
};

export const generateDocument_v2 = async (submission: JobSubmission) => {
  const clientData = await generateDocusignClient();
  const templateId = await findTemplateId_v2(clientData, submission);
  const envelopeId = await createEnvelope(clientData, templateId, submission);
  await prefillEnvelopeTabs(clientData, envelopeId, submission);
  await sendSignatureRequest_v2(clientData, envelopeId);
};

const findTemplateId_v2 = async (clientData: DocusignClientData, submission: JobSubmission): Promise<string> => {
  const templatesApi = new TemplatesApi(clientData.client);
  const searchKey = `${SUB_STATUS_DOCTYPE[submission.status]}_Offer`;
  const { envelopeTemplates } = await templatesApi.listTemplates(clientData.clientInfo.accountId);
  return envelopeTemplates.find((t) => t.name === searchKey)?.templateId;
};

const createEnvelope = async (
  clientData: DocusignClientData,
  templateId: string,
  submission: JobSubmission
): Promise<string> => {
  const envelopeDefinition: EnvelopeDefinition = {
    templateId,
    templateRoles: [
      {
        email: submission.candidate.email,
        name: `${submission.candidate.firstName} ${submission.candidate.lastName}`,
        roleName: 'Candidate',
      },
    ],
    customFields: {
      textCustomFields: [
        {
          show: 'true',
          name: 'submissionId',
          value: `${submission.id}`,
        },
        {
          show: 'true',
          name: 'docType',
          value: SUB_STATUS_DOCTYPE[submission.status],
        },
      ],
    },
    status: 'created',
  };
  const envelopeApi = new EnvelopesApi(clientData.client);
  const { envelopeId } = await envelopeApi.createEnvelope(clientData.clientInfo.accountId, { envelopeDefinition });
  return envelopeId;
};

const prefillEnvelopeTabs = async (
  clientData: DocusignClientData,
  envelopeId: string,
  submission: JobSubmission
): Promise<void> => {
  const envelopeApi = new EnvelopesApi(clientData.client);
  await envelopeApi.createDocumentTabs(clientData.clientInfo.accountId, envelopeId, '1', {
    tabs: {
      prefillTabs: {
        textTabs: getDoc1Tabs(submission),
      },
    },
  });
  await envelopeApi.createDocumentTabs(clientData.clientInfo.accountId, envelopeId, '3', {
    tabs: {
      prefillTabs: {
        textTabs: [
          {
            tabLabel: 'candidatePhone',
            fontSize: 'size9',
            font: 'calibri',
            required: true,
            value: submission.candidate.phone,
            pageNumber: 1,
            xPosition: 94,
            yPosition: 182,
          },
          {
            tabLabel: 'candidateEmail',
            fontSize: 'size9',
            font: 'calibri',
            required: true,
            value: submission.candidate.email,
            pageNumber: 1,
            xPosition: 94,
            yPosition: 197,
          },
        ],
      },
    },
  });
};

const getDoc1Tabs = (submission: JobSubmission): any[] => {
  const docType = SUB_STATUS_DOCTYPE[submission.status];
  const salaryFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return [
    {
      tabLabel: 'startDate',
      fontSize: 'size10',
      font: 'calibri',
      required: true,
      value: new Date(submission.jobOrder[`${docType.toLowerCase()}StartDate`]).toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
      }),
      pageNumber: 1,
      ...(docType === 'SE'
        ? {
            xPosition: 146,
            yPosition: 175,
          }
        : {
            xPosition: 148,
            yPosition: 170,
          }),
    },
    {
      tabLabel: 'year1Salary',
      fontSize: 'size9',
      font: 'calibri',
      required: true,
      value: `${salaryFormatter.format(submission.jobOrder.year1Salary)}+`,
      pageNumber: 2,
      ...(docType === 'SE'
        ? {
            xPosition: 168,
            yPosition: 222,
          }
        : {
            xPosition: 170,
            yPosition: 192,
          }),
    },
    {
      tabLabel: 'year2Salary',
      fontSize: 'size9',
      font: 'calibri',
      required: true,
      value: `${salaryFormatter.format(submission.jobOrder.year2Salary)}+`,
      pageNumber: 2,
      ...(docType === 'SE'
        ? {
            xPosition: 168,
            yPosition: 237,
          }
        : {
            xPosition: 170,
            yPosition: 207,
          }),
    },
    {
      tabLabel: 'recruiterEmail',
      fontSize: 'size10',
      font: 'calibri',
      required: true,
      value: submission.candidate.owner.email,
      pageNumber: 2,
      ...(docType === 'SE'
        ? {
            xPosition: 356,
            yPosition: 460,
          }
        : {
            xPosition: 355,
            yPosition: 409,
          }),
    },
    {
      tabLabel: 'recruiterName',
      fontSize: 'size14',
      italic: true,
      font: 'timesnewroman',
      required: true,
      value: `${submission.candidate.owner.firstName} ${submission.candidate.owner.lastName}`,
      pageNumber: 2,
      ...(docType === 'SE'
        ? {
            xPosition: 75,
            yPosition: 568,
          }
        : {
            xPosition: 71,
            yPosition: 511,
          }),
    },
  ];
};

const sendSignatureRequest_v2 = async (clientData: DocusignClientData, envelopeId: string) => {
  const envelopeApi = new EnvelopesApi(clientData.client);
  await envelopeApi.update(clientData.clientInfo.accountId, envelopeId, {
    envelope: {
      status: 'sent',
    },
  });
};

export const processDocumentEvent_v2 = async (eventReq: EnvelopeTemplate) => {
  console.log('Received Document Event: ', eventReq);
  if (eventReq.status === 'completed') {
    const { restUrl, BhRestToken } = await getSessionData();
    const clientData = await generateDocusignClient();
    const submissionId = eventReq.customFields.textCustomFields.find((f) => f.name === 'submissionId')?.value;
    const submission = submissionId && (await fetchSubmission(restUrl, BhRestToken, +submissionId));
    if (submission) {
      const signedFile = await downloadSignedFile_v2(clientData, eventReq.envelopeId);
      const docType = eventReq.customFields.textCustomFields.find((f) => f.name === 'docType')?.value;
      await uploadCandidateFile(
        restUrl,
        BhRestToken,
        submission.candidate.id,
        signedFile,
        `Signed_${docType}_Document.pdf`,
        DOCTYPE_NAME[docType]
      );
      if (submission.status === `${docType} Offered`) {
        await saveSubmissionStatus(restUrl, BhRestToken, submission.id, `${docType} Signed`);
      }
    }
    console.log('Successfully Processed Document Event.');
  } else {
    console.log('Irrelevant Document Event. Skipping...');
  }
};

const downloadSignedFile_v2 = async (clientData: DocusignClientData, envelopeId: string) => {
  const envelopeApi = new EnvelopesApi(clientData.client);
  const signedDoc = await envelopeApi.getDocument(clientData.clientInfo.accountId, envelopeId, 'combined', {
    encoding: 'base64',
  } as any);
  return signedDoc as any;
};
