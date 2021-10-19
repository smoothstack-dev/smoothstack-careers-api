import { Candidate } from 'src/model/Candidate';
import { SchedulingTypeId } from 'src/model/SchedulingType';

export const getSchedulingLink = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  typeId: SchedulingTypeId
) => {
  return `https://app.squarespacescheduling.com/schedule.php?owner=23045512&appointmentType=${typeId}&firstName=${encodeURIComponent(
    firstName
  )}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
};

export const getPrescreeningLink = (candidate: Candidate) => {
  const { firstName, lastName, email, relocation } = candidate;
  const fullName = `${firstName} ${lastName}`;
  return `https://docs.google.com/forms/d/e/1FAIpQLSeLhe0FE811KbI0YVS6a29I-skWr5wgWmGDqruUEZ7QotLqHQ/viewform?usp=pp_url&entry.2008644359=${encodeURIComponent(
    fullName
  )}&entry.139410096=${encodeURIComponent(email)}&entry.1002222934=${encodeURIComponent(relocation)}`;
};

