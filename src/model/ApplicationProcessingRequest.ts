import { CORP_TYPE } from './Corporation';
import { KnockoutResult } from './Knockout';

export interface ApplicationProcessingRequest {
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
    fields: {
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };
  };
  candidate: {
    id: number;
    fields: {
      city: string;
      state: string;
      zip: string;
      phone: string;
      workAuthorization: string;
      relocation: string;
      codingAbility: string;
      yearsOfExperience: string;
      militaryStatus: string;
      nickName?: string;
      graduationDate?: string;
      degreeExpected?: string;
      highestDegree?: string;
      militaryBranch?: string;
    };
  };
  knockout: KnockoutResult;
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
