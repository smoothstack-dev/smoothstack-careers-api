export const getScheduleLink = (firstName: string, lastName: string, email: string, phone: string) =>
  `https://app.squarespacescheduling.com/schedule.php?owner=23045512&calendarID=6003573&firstName=${encodeURIComponent(
    firstName
  )}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
