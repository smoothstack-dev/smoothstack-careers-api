import { SNSEvent } from 'aws-lambda';
import {
  AppointmentGenerationRequest,
  AppointmentType,
  ChallengeAppointmentData,
  TechScreenAppointmentData,
} from 'src/model/AppointmentGenerationRequest';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { sendChallengeCalendarInvite, sendTechScreenCalendarInvite } from './calendar.service';
import { fetchCandidateResume, saveCandidateFields } from './careers.service';
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

const generateTechScreenAppointment = async (appointmentData: TechScreenAppointmentData) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { candidate, screenerEmail, appointment, jobTitle } = appointmentData;
  const candidateResume = await fetchCandidateResume(restUrl, BhRestToken, candidate);
  const driveFile = candidateResume && (await processResumeFile(candidate, candidateResume));
  const eventId = await sendTechScreenCalendarInvite(candidate, screenerEmail, appointment, driveFile, jobTitle);
  await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
    customText11: eventId,
  });
};

const generateChallengeAppointment = async ({ candidate, appointment }: ChallengeAppointmentData) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const eventId = await sendChallengeCalendarInvite(candidate, appointment);
  await saveCandidateFields(restUrl, BhRestToken, candidate.id, {
    customText38: eventId,
  });
};
