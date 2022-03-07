import {
  fetchNewSubmissions,
  fetchSubmission,
  fetchUpdatedSubmissions,
  saveCandidateFields,
  saveCandidateNote,
  saveSubmissionFields,
} from './careers.service';
import { getSessionData, getStaffAugSessionData } from './auth/bullhorn.oauth.service';
import {
  publishLinksGenerationRequest,
  publishDocumentGenerationRequest,
  publishIntSubmissionProcessingRequest,
} from './sns.service';
import { calculateKnockout, isKnockoutPopulated } from 'src/util/knockout.util';
import { KNOCKOUT_NOTE, KNOCKOUT_STATUS } from 'src/model/Knockout';

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
  };
  const shouldProcessKnockout = isKnockoutPopulated(knockoutFields);
  if (shouldProcessKnockout) {
    const knockout = calculateKnockout(jobOrder.knockout, knockoutFields);
    await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
      status: KNOCKOUT_STATUS[knockout].candidateStatus,
    });
    await saveSubmissionFields(restUrl, BhRestToken, submissionId, {
      status: KNOCKOUT_STATUS[knockout].submissionStatus,
    });
    await saveCandidateNote(restUrl, BhRestToken, candidate.id, 'Knockout', KNOCKOUT_NOTE[knockout]);
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
  const status = 'Evaluation Offered';
  const submissionFields =
    'id,candidate(firstName,lastName,email,phone,owner(firstName,lastName,email)),jobOrder(startDate,salary,customFloat1,customText6),status,isDeleted';
  const submissions = await fetchUpdatedSubmissions(restUrl, BhRestToken, status, submissionFields);

  const generationRequests = submissions.map((sub) => publishDocumentGenerationRequest(sub, 'regular'));
  await Promise.all(generationRequests);

  console.log('Successfully processed updated submissions:');
  console.log(submissions);
};

export const processUpdatedSASubmissions = async () => {
  console.log('Received request to process updated Staff Aug job submissions.');

  const { restUrl, BhRestToken } = await getStaffAugSessionData();
  const status = 'Send RTR';
  const submissionFields =
    'id,candidate(firstName,lastName,email,employeeType,willRelocate,customText1,customText2,customText3,customText4),jobOrder(title,clientCorporation(name)),payRate,status,isDeleted';
  const submissions = await fetchUpdatedSubmissions(restUrl, BhRestToken, status, submissionFields);

  const generationRequests = submissions.map((sub) => publishDocumentGenerationRequest(sub, 'staffAug'));
  await Promise.all(generationRequests);

  console.log('Successfully processed updated Staff Aug submissions:');
  console.log(submissions);
};
