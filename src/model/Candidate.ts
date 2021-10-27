import { JobOrder } from './JobOrder';

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  owner: Owner;
  challengeLink: string;
  webinarLink: string;
  webinarRegistrantId: string;
  relocation: string;
  techScreenEventId: string;
  challengeEventId: string;
  submissions: Submission[];
  webResponses: WebResponse[];
  githubLink: string;
  fileAttachments: Attachment[];
}

interface Owner {
  id: number;
  email: string;
}

interface Attachment {
  id: number;
  type: string;
}

export interface Submission {
  id: number;
  status: string;
  jobOrder: JobOrder;
  dateAdded: number;
}

export interface WebResponse {
  id: number;
  dateAdded: number;
}
