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
  graduationDate?: Date;
  degreeExpected?: string;
  highestDegree?: string;
  militaryStatus: string;
  militaryBranch?: string;
  major?: string;
}

export interface SACandidateExtraFields {
  phone: string;
  workAuthorization: string;
  relocation: string;
}
