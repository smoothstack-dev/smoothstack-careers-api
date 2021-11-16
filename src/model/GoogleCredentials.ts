export interface GoogleCredentials {
  CALENDAR_CLIENT_ID: string;
  CALENDAR_CLIENT_SECRET: string;
  CALENDAR_REFRESH_TOKEN: string;
  DRIVE_CLIENT_ID: string;
  DRIVE_CLIENT_SECRET: string;
  DRIVE_REFRESH_TOKEN: string;
}

export enum GoogleService {
  CALENDAR = 'CALENDAR',
  DRIVE = 'DRIVE',
  GMAIL = 'GMAIL',
}
