import { Appointment } from './Appointment';
import { Candidate } from './Candidate';

export interface AppointmentGenerationRequest {
  type: string;
  appointmentData: TechScreenAppointmentData | ChallengeAppointmentData;
}

export interface TechScreenAppointmentData {
  candidate: Candidate;
  screenerEmail: string;
  appointment: Appointment;
  jobTitle: string;
}

export interface ChallengeAppointmentData {
  candidate: Candidate;
  appointment: Appointment;
}

export enum AppointmentType {
  TECHSCREEN = 'techscreen',
  CHALLENGE = 'challenge',
}
