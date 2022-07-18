export interface CandidateExtraFields {
  phone: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  workAuthorization: string;
  relocation: string;
  codingAbility: string;
  yearsOfExperience: string;
  nickName?: string;
  graduationDate?: string;
  degreeExpected?: string;
  highestDegree?: string;
  militaryStatus: string;
  militaryBranch?: string;
  major?: string;
}

export interface SACandidateExtraFields {
  city: string;
  state: string;
  zip: string;
  phone: string;
  nickName?: string;
  workAuthorization: string;
  willRelocate: string;
  yearsOfProfessionalExperience: string;
}
