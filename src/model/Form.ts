export type FormType = 'prescreen' | 'techscreen';

export interface Form {
  type: FormType;
  formData: PrescreenForm | TechScreenForm;
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
  county: FormEntry;
  address1: FormEntry;
  address2: FormEntry;
  city: FormEntry;
  state: FormEntry;
  zip: FormEntry;
  showOnTime: FormEntry;
  updatedTime: FormEntry;
  referFriend: FormEntry;
  drugScreen: FormEntry;
  candidateRank: FormEntry;
  clearanceStatus: FormEntry;
  firstName: FormEntry;
  lastName: FormEntry;
  nickName: FormEntry;
  monthsOfProjectExperience: FormEntry;
  teamWorkExperience: FormEntry;
  agreeToBeResponsive: FormEntry;
  major: FormEntry;
  hobbies: FormEntry;
}

export interface TechScreenForm {
  respondentEmail: FormEntry;
  submissionId: FormEntry;
  githubLink: FormEntry;
  onTime: FormEntry;
  dressedProfessionally: FormEntry;
  technicalQuestions: FormEntry[];
  behavioralQuestions: FormEntry[];
  projectQuestions: FormEntry[];
  screenerRecommendation: FormEntry;
  communicationSkills: FormEntry;
}

export interface FormEntry {
  question: string;
  answer: string;
}

export interface TechScreenResults {
  respondentEmail: string;
  screenerRecommendation: string;
  technicalResult: string;
  behavioralResult: string;
  projectResult: string;
  totalResult: string;
  githubLink: string;
  onTime: string;
  dressedProfessionally: string;
  communicationSkills: string;
}
