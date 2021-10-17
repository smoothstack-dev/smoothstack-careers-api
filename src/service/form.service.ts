import { Candidate } from 'src/model/Candidate';
import { PrescreenForm } from 'src/model/Form';
import { getSessionData } from './auth/bullhorn.oauth.service';
import {
  findCandidateByEmail,
  saveFormNote,
  saveNoSubmissionNote,
  savePrescreenData,
  saveSubmissionStatus,
} from './careers.service';

export const processFormEvent = async (formType: string, formEvent: any) => {
  switch (formType) {
    case 'prescreen':
      await processPrescreenEvent(formEvent);
      break;
  }
};

const processPrescreenEvent = async (prescreenForm: PrescreenForm) => {
  const { restUrl, BhRestToken } = await getSessionData();

  const candidate = await findCandidateByEmail(restUrl, BhRestToken, prescreenForm.candidateEmail.answer);
  if (candidate) {
    await saveFormNote(restUrl, BhRestToken, candidate.id, prescreenForm, 'Prescreen');
    const prescreenResult = await savePrescreenData(restUrl, BhRestToken, candidate.id, prescreenForm);
    await updateSubmissionStatus(restUrl, BhRestToken, candidate, prescreenResult);
  }
};

const updateSubmissionStatus = async (url: string, token: string, candidate: Candidate, prescreenResult: string) => {
  const searchStatuses = ['Prescreen Scheduled', 'Webinar Passed'];
  const prescreenSubmissions = candidate.submissions.filter((sub) => sub.status === searchStatuses[0]);
  const webinarSubmissions = candidate.submissions.filter((sub) => sub.status === searchStatuses[1]);
  const jobSubmissions = prescreenSubmissions.length ? prescreenSubmissions : webinarSubmissions;
  for (const submission of jobSubmissions) {
    await saveSubmissionStatus(url, token, submission.id, prescreenResult);
  }
  !jobSubmissions.length && (await saveNoSubmissionNote(url, token, candidate.id, prescreenResult, searchStatuses));
};
