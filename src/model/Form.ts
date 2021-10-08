export interface PrescreenFormEvent {
  candidateName: string;
  candidateEmail: string;
  relocation: string;
  newRelocation: string;
  aboutYourself: string;
  otherApplications: string;
  expectedDegree: string;
  expectedGraduationDate: string;
  highestDegree: string;
  graduationDate: string;
  projects: string;
  monthsOfExperience: string;
  programmingLanguages: string;
  goodFit: string;
  referral: string;
  commitment: string;
  abilityToLearn: string;
  challengingSituation: string;
  opportunityRank: string;
  workAuthorization: string;
  backgroundCheck: string;
  githubLink: string;
  linkedinLink: string;
  canCommit: string;
  questions: string;
  communicationSkills: string;
  result: string;
  additionalNotes: string;
  isVaccinated: string;
  willVaccinate: string;
  vaccinationNotes: string;
}

export interface PrescreenForm {
  candidateName: FormEntry;
  candidateEmail: FormEntry;
  relocation: FormEntry;
  newRelocation: FormEntry;
  aboutYourself: FormEntry;
  otherApplications: FormEntry;
  expectedDegree: FormEntry;
  expectedGraduationDate: FormEntry;
  highestDegree: FormEntry;
  graduationDate: FormEntry;
  projects: FormEntry;
  monthsOfExperience: FormEntry;
  programmingLanguages: FormEntry;
  goodFit: FormEntry;
  referral: FormEntry;
  commitment: FormEntry;
  abilityToLearn: FormEntry;
  challengingSituation: FormEntry;
  opportunityRank: FormEntry;
  workAuthorization: FormEntry;
  backgroundCheck: FormEntry;
  githubLink: FormEntry;
  linkedinLink: FormEntry;
  canCommit: FormEntry;
  questions: FormEntry;
  communicationSkills: FormEntry;
  result: FormEntry;
  additionalNotes: FormEntry;
  isVaccinated: FormEntry;
  willVaccinate: FormEntry;
  vaccinationNotes: FormEntry;
}

interface FormEntry {
  question: string;
  answer: string;
}
