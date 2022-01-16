import { SNSEvent } from 'aws-lambda';
import { Candidate } from 'src/model/Candidate';
import { Form, FormType, PrescreenForm, TechScreenForm } from 'src/model/Form';
import { getSessionData } from './auth/bullhorn.oauth.service';
import {
  fetchSubmission,
  findCandidateByEmail,
  saveFormNote,
  saveNoSubmissionNote,
  savePrescreenData,
  saveSubmissionStatus,
  saveTechScreenData,
} from './careers.service';
import { publishFormProcesingRequest } from './sns.service';

export const processFormEvent = async (formType: FormType, formData: any) => {
  const form: Form = {
    type: formType,
    formData,
  };
  await publishFormProcesingRequest(form);
};

export const processForm = async (event: SNSEvent) => {
  const message = event.Records[0].Sns.Message;
  console.log('Received Form Processing Request: ', message);
  const { type, formData }: Form = JSON.parse(message);

  switch (type) {
    case 'prescreen':
      await processPrescreenForm(formData as PrescreenForm);
      break;
    case 'techscreen':
      await processTechScreenForm(formData as TechScreenForm);
      break;
  }
  console.log('Successfully processed form');
};

const processPrescreenForm = async (prescreenForm: PrescreenForm) => {
  const { restUrl, BhRestToken } = await getSessionData();

  const candidate = await findCandidateByEmail(restUrl, BhRestToken, prescreenForm.candidateEmail.answer);
  if (candidate) {
    await saveFormNote(restUrl, BhRestToken, candidate.id, prescreenForm, 'Prescreen');
    const prescreenResult = await savePrescreenData(restUrl, BhRestToken, candidate.id, prescreenForm);
    await updateSubmissionStatus(restUrl, BhRestToken, candidate, prescreenResult, [
      'Prescreen Scheduled',
      'Webinar Passed',
    ]);
  }
};

const processTechScreenForm = async (techScreenForm: TechScreenForm) => {
  const { restUrl, BhRestToken } = await getSessionData();

  const submission = await fetchSubmission(restUrl, BhRestToken, +techScreenForm.submissionId.answer);
  if (submission) {
    const saveFormNoteReq = saveFormNote(restUrl, BhRestToken, submission.candidate.id, techScreenForm, 'Tech Screen');
    const saveTSDataReq = saveTechScreenData(restUrl, BhRestToken, submission, techScreenForm);
    await Promise.all([saveFormNoteReq, saveTSDataReq]);
  }
};

const updateSubmissionStatus = async (
  url: string,
  token: string,
  candidate: Candidate,
  result: string,
  searchStatuses: string[]
) => {
  const firstPrioritySubmissions = candidate.submissions.filter((sub) => sub.status === searchStatuses[0]);
  const secondPrioritySubmissions = candidate.submissions.filter((sub) => sub.status === searchStatuses[1]);
  const jobSubmissions = firstPrioritySubmissions.length ? firstPrioritySubmissions : secondPrioritySubmissions;
  for (const submission of jobSubmissions) {
    await saveSubmissionStatus(url, token, submission.id, result);
  }
  !jobSubmissions.length && (await saveNoSubmissionNote(url, token, candidate.id, result, searchStatuses));
};
