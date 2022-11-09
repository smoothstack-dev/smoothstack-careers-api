import { SNSEvent } from 'aws-lambda';
import {
  AppointmentGenerationRequest,
  AppointmentType,
  ChallengeAppointmentData,
  TechScreenAppointmentData,
  ThirtyMinAppointmentData,
} from 'src/model/AppointmentGenerationRequest';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { send30MinCalendarInvite, sendTechScreenCalendarInvite } from './calendar.service';
import { sendChallengeCalendarInvite } from './calendar.service';
import { fetchCandidateFiles, saveSubmissionFields } from './careers.service';
import { generateChallengeLinks } from './links.service';
import { getSFDCConnection, updateSFDCLead } from './sfdc.service';

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
    case AppointmentType.THIRTYMIN:
      await generate30MinAppointment(request.appointmentData as ThirtyMinAppointmentData);
  }
  console.log(`Successfully generated ${request.type} appointment.`);
};

const generateChallengeAppointment = async (appointmentData: ChallengeAppointmentData) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const candidate = appointmentData.submission.candidate;
  const challengeLink = await generateChallengeLinks(restUrl, BhRestToken, appointmentData.submission.id);
  if (challengeLink) {
    const eventId = await sendChallengeCalendarInvite(candidate, challengeLink, appointmentData.appointment);
    await saveSubmissionFields(restUrl, BhRestToken, appointmentData.submission.id, {
      customTextBlock5: eventId,
    });
  }
};

const generateTechScreenAppointment = async (appointmentData: TechScreenAppointmentData) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { submission, screenerEmail, appointment } = appointmentData;
  const candidateResume = (await fetchCandidateFiles(restUrl, BhRestToken, submission.candidate.id, ['Resume']))[0];
  const eventId = await sendTechScreenCalendarInvite(submission, screenerEmail, appointment, candidateResume);
  await saveSubmissionFields(restUrl, BhRestToken, submission.id, {
    customTextBlock5: eventId,
  });
};

const generate30MinAppointment = async (appointmentData: ThirtyMinAppointmentData) => {
  const sfdcConnection = await getSFDCConnection();
  const { leadId, calendarEmail, calendarName, appointment } = appointmentData;
  const eventId = await send30MinCalendarInvite(calendarEmail, calendarName, appointment);
  await updateSFDCLead(sfdcConnection, leadId, { Teams_Meeting_ID__C: eventId });
};
