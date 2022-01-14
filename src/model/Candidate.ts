import { JobSubmission } from './JobSubmission';

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
  submissions: JobSubmission[];
  webResponses: WebResponse[];
  githubLink: string;
  fileAttachments: Attachment[];
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Attachment {
  id: number;
  type: string;
}

export interface WebResponse {
  id: number;
  dateAdded: number;
}
