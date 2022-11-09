export enum SchedulingType {
  CHALLENGE = 'Challenge',
  WEBINAR = 'Webinar',
  TECHSCREEN = 'Tech Screen',
}

export enum SchedulingTypeId {
  CHALLENGE = '33218120',
  WEBINAR = '26658416',
  TECHSCREEN = '27265226',
  '30_MIN' = '38594666',
}

export interface UTMData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}
