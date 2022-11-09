import { CORP_TYPE } from './Corporation';
import { Knockout } from './Knockout';

interface WebResponseFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  format: string;
}

interface CandidateFields extends Partial<WebResponseFields> {
  status: string;
  city: string;
  state: string;
  zip: string;
  workAuthorization: string;
  relocation: string;
  codingAbility: string;
  yearsOfExperience: string;
  militaryStatus: string;
  name?: string;
  nickName?: string;
  graduationDate?: string;
  degreeExpected?: string;
  highestDegree?: string;
  militaryBranch?: string;
  major?: string;
  techSelection: string;
  hardwareDesign: string;
  instagram?: string;
  linkedin?: string;
}
export interface ApplicationProcessingRequest {
  webResponse?: {
    fields: WebResponseFields;
  };
  submission: {
    id: number;
    fields: {
      status: string;
      deviceType: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
    };
  };
  candidate: {
    id: number;
    fields: CandidateFields;
  };
  knockout: Knockout;
  corpType: CORP_TYPE;
}

export interface SAApplicationProcessingRequest {
  webResponse: {
    fields: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      format: string;
    };
  };
  submission: {
    id: number;
  };
  candidate: {
    id: number;
    fields: {
      city: string;
      state: string;
      zip: string;
      phone: string;
      workAuthorization: string;
      willRelocate: string;
      yearsOfProfessionalExperience: string;
      nickName?: string;
    };
  };
  careerId: string;
  corpType: CORP_TYPE;
}
