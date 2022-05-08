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
  forms: AppointmentForm[];
}

interface AppointmentForm {
  id: number;
  name: string;
  values: AppointmentFormValue[];
}

interface AppointmentFormValue {
  id: number;
  fieldID: number;
  value: string;
  name: string;
}
