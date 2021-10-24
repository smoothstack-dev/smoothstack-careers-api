export interface Appointment {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  datetime: string;
  appointmentTypeID: number;
  calendarID: number;
  duration: number;
  confirmationPage: string;
}
