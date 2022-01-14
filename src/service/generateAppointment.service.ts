import { SNSEvent } from 'aws-lambda';
import {
  AppointmentGenerationRequest,
  AppointmentType,
  ChallengeAppointmentData,
  TechScreenAppointmentData,
} from 'src/model/AppointmentGenerationRequest';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { sendChallengeCalendarInvite, sendTechScreenCalendarInvite } from './calendar.service';
import { fetchCandidate, fetchCandidateResume, saveSubmissionFields } from './careers.service';
import { processResumeFile } from './drive.service';

export const generateAppointment = async (event: SNSEvent) => {
  console.log('Received Appointment Generation Request.');
  const request: AppointmentGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
  switch (request.type) {
    case AppointmentType.CHALLENGE:
      await generateChallengeAppointment(request.appointmentData as ChallengeAppointmentData);
      break;
    case AppointmentType.TECHSCREEN:
      await generateTechScreenAppointment(request.appointmentData as TechScreenAppointmentData);
      break;
  }
  console.log(`Successfully generated ${request.type} appointment.`);
};

const generateChallengeAppointment = async (appointmentData: ChallengeAppointmentData) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const candidate = appointmentData.submission.candidate;
  const challengeLink = appointmentData.submission.challengeLink;
  const eventId = await sendChallengeCalendarInvite(candidate, challengeLink, appointmentData.appointment);
  await saveSubmissionFields(restUrl, BhRestToken, appointmentData.submission.id, {
    customText15: eventId,
  });
};

const generateTechScreenAppointment = async (appointmentData: TechScreenAppointmentData) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { submission, screenerEmail, appointment } = appointmentData;
  const candidateResume = await fetchCandidateResume(restUrl, BhRestToken, submission.candidate.id);
  const driveFile = candidateResume && (await processResumeFile(submission.candidate, candidateResume));
  const eventId = await sendTechScreenCalendarInvite(submission, screenerEmail, appointment, driveFile);
  await saveSubmissionFields(restUrl, BhRestToken, submission.id, {
    customText23: eventId,
  });
};
