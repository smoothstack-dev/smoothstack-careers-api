import { Candidate } from 'src/model/Candidate';
import { PrescreenForm, TechScreenForm } from 'src/model/Form';
import { getSessionData } from './auth/bullhorn.oauth.service';
import {
  findCandidateByEmail,
  saveFormNote,
  saveNoSubmissionNote,
  savePrescreenData,
  saveSubmissionStatus,
  saveTechScreenData,
} from './careers.service';

export const processFormEvent = async (formType: string, formEvent: any) => {
  switch (formType) {
    case 'prescreen':
      await processPrescreenEvent(formEvent);
      break;
    case 'techscreen':
      await processTechScreenEvent(formEvent);
      break;
  }
};

const processPrescreenEvent = async (prescreenForm: PrescreenForm) => {
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

const processTechScreenEvent = async (techScreenForm: TechScreenForm) => {
  const { restUrl, BhRestToken } = await getSessionData();

  const candidate = await findCandidateByEmail(restUrl, BhRestToken, techScreenForm.candidateEmail.answer);
  if (candidate) {
    await saveFormNote(restUrl, BhRestToken, candidate.id, techScreenForm, 'Tech Screen');
    const techScreenResult = await saveTechScreenData(restUrl, BhRestToken, candidate.id, techScreenForm);
    await updateSubmissionStatus(restUrl, BhRestToken, candidate, techScreenResult, [
      'Tech Screen Scheduled',
      'Prescreen Passed',
    ]);
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
