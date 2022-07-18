import { JobSubmission } from './JobSubmission';

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  phone: string;
  dateAdded: string;
  owner: Owner;
  referrer: string;
  webinarLink: string;
  webinarRegistrantId: string;
  workAuthorization: string;
  relocation: string;
  yearsOfExperience: string;
  graduationDate: string;
  degreeExpected: string;
  educationDegree: string;
  codingAbility: number;
  submissions: JobSubmission[];
  webResponses: WebResponse[];
  githubLink: string;
  fileAttachments: Attachment[];
  address: Address;
  county: string;
  linkedInLink: string;
  expectedGraduationDate: string;
  communicationSkillsPS: string;
  communicationSkillsTS: string;
  vaccinationStatus: string;
  militaryStatus: string;
  militaryBranch: string;
  opportunityRank: string;
  technicalScore: string;
  behavioralScore: string;
  projectScore: string;
  techScreenResult: string;
  screenerDetermination: string;
  screenerEmail: string;
  potentialEmail: string;
  potentialEmailQC: string;
  source: string;
}

interface Address {
  address1: string;
  address2: string;
  city: string;
  countryCode: string;
  countryID: number;
  countryName: string;
  state: string;
  timezone: string;
  zip: string;
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

export interface SACandidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  willRelocate: string;
  willTravel: string;
  employeeType: string;
  pto: string;
  federalHolidays: string;
  healthBenefits: string;
  retirement: string;
  includeRate: string;
}
