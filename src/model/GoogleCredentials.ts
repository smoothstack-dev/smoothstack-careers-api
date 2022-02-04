export interface GoogleCredentials {
  CALENDAR_CLIENT_ID: string;
  CALENDAR_CLIENT_SECRET: string;
  CALENDAR_REFRESH_TOKEN: string;
  DRIVE_CLIENT_ID: string;
  DRIVE_CLIENT_SECRET: string;
  DRIVE_REFRESH_TOKEN: string;
  ADMIN_CLIENT_ID: string;
  ADMIN_CLIENT_SECRET: string;
  ADMIN_REFRESH_TOKEN: string;
  USERS_CALLBACK_URL: string;
}

export enum GoogleService {
  CALENDAR = 'CALENDAR',
  DRIVE = 'DRIVE',
  GMAIL = 'GMAIL',
  ADMIN = 'ADMIN',
}
