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
    const jobSubmissions = candidate.submissions.filter((sub) => sub.status === 'Webinar Passed');
    for (const submission of jobSubmissions) {
      await saveSubmissionStatus(restUrl, BhRestToken, submission.id, prescreenResult);
    }
    !jobSubmissions.length && (await saveNoSubmissionNote(restUrl, BhRestToken, candidate.id, prescreenResult));
  }
};
