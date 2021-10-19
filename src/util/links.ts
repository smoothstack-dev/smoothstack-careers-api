import { Candidate } from 'src/model/Candidate';
import { SchedulingType } from 'src/model/SchedulingType';

export const getSchedulingLink = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  type: SchedulingType
) => {
  let calendarID: string;

  switch (type) {
    case SchedulingType.CHALLENGE:
      calendarID = '6003573';
      break;
    case SchedulingType.WEBINAR:
      calendarID = '6044217';
      break;
  }

  return `https://app.squarespacescheduling.com/schedule.php?owner=23045512&calendarID=${calendarID}&firstName=${encodeURIComponent(
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

//TODO: TO BE REMOVED
export const getTechScreeningLink = (candidate: Candidate) => {
  const { firstName, lastName, email, githubLink } = candidate;
  const fullName = `${firstName} ${lastName}`;
  return `https://docs.google.com/forms/d/e/1FAIpQLSdq8JhtHNcyMe3ig5W6XLQa0IB-0AY9h75G69QYfI_IKmGiYA/viewform?usp=pp_url&entry.885949558=${encodeURIComponent(
    fullName
  )}&entry.1324592995=${encodeURIComponent(email)}&entry.1466421106=${encodeURIComponent(githubLink ?? '')}`;
};
