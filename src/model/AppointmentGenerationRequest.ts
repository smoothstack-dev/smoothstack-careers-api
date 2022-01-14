import { Appointment } from './Appointment';
import { JobSubmission } from './JobSubmission';

export interface AppointmentGenerationRequest {
  type: string;
  appointmentData: TechScreenAppointmentData | ChallengeAppointmentData;
}

export interface TechScreenAppointmentData {
  submission: JobSubmission;
  screenerEmail: string;
  appointment: Appointment;
}

export interface ChallengeAppointmentData {
  submission: JobSubmission;
  appointment: Appointment;
}

export enum AppointmentType {
  TECHSCREEN = 'techscreen',
  CHALLENGE = 'challenge',
}
