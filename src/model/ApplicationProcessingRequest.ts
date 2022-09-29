import { CORP_TYPE } from './Corporation';
import { Knockout } from './Knockout';

export interface ApplicationProcessingRequest {
  submission: {
    id: number;
    fields: {
      status: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };
  };
  candidate: {
    id: number;
    fields: {
      status: string;
      firstName: string;
      lastName: string;
      email: string;
      name: string;
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
      major?: string;
      techSelection:string;
      hardwareDesign: string;
    };
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
