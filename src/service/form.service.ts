import { PrescreenFormEvent } from 'src/model/Form';
import { getSessionData } from './auth/bullhorn.oauth.service';
import {
  findCandidateByEmail,
  saveFormNote,
  saveNoSubmissionNote,
  savePrescreenData,
  saveSubmissionStatus,
} from './careers.service';

export const processFormEvent = async (formType: string, formEvent: any) => {
  const { created_at, ...rawFormEvent } = formEvent;
  switch (formType) {
    case 'prescreen':
      await processPrescreenEvent(rawFormEvent);
      break;
  }
};

const processPrescreenEvent = async (rawPrescreenForm: PrescreenFormEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const prescreenForm: any = Object.keys(rawPrescreenForm).reduce((acc, entry) => {
    const parsedEntry = JSON.parse(rawPrescreenForm[entry]);
    return { ...acc, [entry]: { ...parsedEntry, answer: parsedEntry.answer.replace(/\<BR\/\>/g, ' ') } };
  }, {});

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
