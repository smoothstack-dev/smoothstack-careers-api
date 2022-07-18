import { SNSEvent } from 'aws-lambda';
import { Form, FormType, PrescreenForm, TechScreenForm } from 'src/model/Form';
import { updateSubmissionStatus } from 'src/util/status.util';
import { getSessionData } from './auth/bullhorn.oauth.service';
import {
  fetchSubmission,
  findCandidateByEmail,
  saveFormNote,
  savePrescreenData,
  saveTechScreenData,
} from './careers.service';
import { publishFormProcessingRequest } from './sns.service';

export const processFormEvent = async (formType: FormType, formData: any) => {
  const form: Form = {
    type: formType,
    formData,
  };
  await publishFormProcessingRequest(form);
};

export const processForm = async (event: SNSEvent) => {
  const message = event.Records[0].Sns.Message;
  const { type, formData }: Form = JSON.parse(message);
  console.log('Received Form Processing Request: ', { type, formData });
  switch (type) {
    case 'prescreen':
      await processPrescreenForm(formData as PrescreenForm);
      break;
    case 'techscreen':
      await processTechScreenForm(formData as TechScreenForm);
      break;
  }
  console.log('Successfully processed form.');
};

export const processPrescreenForm = async (prescreenForm: PrescreenForm) => {
  const { restUrl, BhRestToken } = await getSessionData();

  const candidate = await findCandidateByEmail(restUrl, BhRestToken, prescreenForm.candidateEmail.answer);
  if (candidate) {
    const prescreenReq = savePrescreenData(restUrl, BhRestToken, candidate.id, prescreenForm);
    const noteReq = saveFormNote(restUrl, BhRestToken, candidate.id, prescreenForm, 'Prescreen');
    const [prescreenResult] = await Promise.all([prescreenReq, noteReq]);

    await updateSubmissionStatus(restUrl, BhRestToken, candidate, prescreenResult, [
      'Prescreen Scheduled',
      'Webinar Passed',
    ]);

    return prescreenReq;
  }
  throw 'Candidate does not exist in the system';
};

export const processTechScreenForm = async (techScreenForm: TechScreenForm) => {
  const { restUrl, BhRestToken } = await getSessionData();

  const submission = await fetchSubmission(restUrl, BhRestToken, +techScreenForm.submissionId.answer);
  if (submission) {
    const saveFormNoteReq = saveFormNote(restUrl, BhRestToken, submission.candidate.id, techScreenForm, 'Tech Screen');
    const saveTSDataReq = saveTechScreenData(restUrl, BhRestToken, submission, techScreenForm);
    await Promise.all([saveFormNoteReq, saveTSDataReq]);
  }
};
