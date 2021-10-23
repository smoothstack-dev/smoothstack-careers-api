import { Appointment } from './Appointment';
import { Candidate } from './Candidate';

export interface AppointmentGenerationRequest {
  type: string;
  appointmentData: TechScreenAppointmentData;
}

export interface TechScreenAppointmentData {
  candidate: Candidate;
  screenerEmail: string;
  appointment: Appointment;
  jobTitle: string;
}
