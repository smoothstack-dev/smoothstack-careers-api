export interface WebinarEvent {
  event: string;
  webinar: WebinarInfo;
}

interface WebinarInfo {
  id: string;
  uuid: string;
}
