import { SchedulingType } from 'src/model/SchedulingType';

export const getSchedulingLink = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  type: SchedulingType
) => {
  let calendarID;

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
