import {
  fetchNewSubmissions,
  fetchSubmission,
  fetchUpdatedSubmissions,
  findActiveJobOrders,
  saveCandidateFields,
  saveCandidateNote,
  saveSubmissionFields,
} from './careers.service';
import { getSessionData, getStaffAugSessionData } from './auth/bullhorn.oauth.service';
import {
  publishLinksGenerationRequest,
  publishDocumentGenerationRequest,
  publishIntSubmissionProcessingRequest,
  publishUserGenerationRequest,
} from './sns.service';
import { calculateKnockout, isKnockoutPopulated } from 'src/util/knockout.util';
import { KNOCKOUT_NOTE, KNOCKOUT_STATUS } from 'src/model/Knockout';
import { JobSubmission } from 'src/model/JobSubmission';

export const processNewSubmissions = async () => {
  console.log('Received request to process new job submissions.');
  const { restUrl, BhRestToken } = await getSessionData();

  const submissions = await fetchNewSubmissions(restUrl, BhRestToken);

  const generationRequests = submissions.map((sub) => publishIntSubmissionProcessingRequest({ submissionId: sub.id }));
  await Promise.all(generationRequests);

  console.log('Successfully processed new submissions:');
  console.log(submissions);
};

export const processInternalSubmission = async (restUrl: string, BhRestToken: string, submissionId: number) => {
  const { candidate, jobOrder } = await fetchSubmission(restUrl, BhRestToken, submissionId);
  const knockoutFields = {
    workAuthorization: candidate.workAuthorization,
    relocation: candidate.relocation,
    graduationDate: candidate.graduationDate,
    yearsOfExperience: candidate.yearsOfExperience,
    educationDegree: candidate.educationDegree,
    degreeExpected: candidate.degreeExpected,
    codingAbility: candidate.codingAbility,
  };
  const shouldProcessKnockout = isKnockoutPopulated(knockoutFields);
  if (shouldProcessKnockout) {
    const activeJobOrders = await findActiveJobOrders(restUrl, BhRestToken);
    const { result, alternateJobId } = calculateKnockout(jobOrder.knockout, activeJobOrders, knockoutFields);
    await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
      status: KNOCKOUT_STATUS[result].candidateStatus,
    });
    await saveSubmissionFields(restUrl, BhRestToken, submissionId, {
      status: KNOCKOUT_STATUS[result].submissionStatus,
      ...(alternateJobId && { jobOrder: { id: alternateJobId } }),
    });
    await saveCandidateNote(restUrl, BhRestToken, candidate.id, 'Knockout', KNOCKOUT_NOTE[result]);
  } else {
    await saveSubmissionFields(restUrl, BhRestToken, submissionId, {
      status: 'Incomplete Application',
    });
    await saveCandidateNote(
      restUrl,
      BhRestToken,
      candidate.id,
      'Knockout',
      'Candidate is Missing Fields for Knockout Calculation.'
    );
  }
  await publishLinksGenerationRequest(submissionId, 'initial');
};

export const processUpdatedSubmissions = async () => {
  console.log('Received request to process updated job submissions.');

  const { restUrl, BhRestToken } = await getSessionData();
  const statuses = ['Evaluation Offered', 'QC Passed'];
  const submissionFields =
    'id,candidate(firstName,lastName,email,phone,owner(firstName,lastName,email)),jobOrder(startDate,salary,customFloat1,customText6),status,isDeleted';
  const submissions = await fetchUpdatedSubmissions(restUrl, BhRestToken, statuses, submissionFields);

  const evalSubmissions = processEvalSubmissions(submissions.filter((sub) => sub.status === 'Evaluation Offered'));
  const qcSubmissions = processQCSubmissions(submissions.filter((sub) => sub.status === 'QC Passed'));
  await Promise.all([evalSubmissions, qcSubmissions]);

  console.log('Successfully processed updated submissions:');
  console.log(submissions);
};

const processEvalSubmissions = async (submissions: JobSubmission[]) => {
  const generationRequests = submissions.map((sub) => publishDocumentGenerationRequest(sub, 'regular'));
  await Promise.all(generationRequests);
};

const processQCSubmissions = async (submissions: JobSubmission[]) => {
  const generationRequests = submissions.map((sub) => publishUserGenerationRequest('ms', sub.id));
  await Promise.all(generationRequests);
};

export const processUpdatedSASubmissions = async () => {
  console.log('Received request to process updated Staff Aug job submissions.');

  const { restUrl, BhRestToken } = await getStaffAugSessionData();
  const statuses = ['Send RTR'];
  const submissionFields =
    'id,candidate(firstName,lastName,email,employeeType,customText25,customText10,customText1,customText2,customText3,customText4,customText6),jobOrder(title,clientCorporation(name)),payRate,status,isDeleted';
  const submissions = await fetchUpdatedSubmissions(restUrl, BhRestToken, statuses, submissionFields);

  const generationRequests = submissions.map((sub) => publishDocumentGenerationRequest(sub, 'staffAug'));
  await Promise.all(generationRequests);

  console.log('Successfully processed updated Staff Aug submissions:');
  console.log(submissions);
};
