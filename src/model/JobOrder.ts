import { KnockoutRequirements } from './Knockout';

export interface JobOrder {
  id: number;
  title: string;
  trainingLength: string;
  year1Salary: number;
  year2Salary: number;
  evaluationStartDate: string;
  challengeName: string;
  passingScore: number;
  foundationsPassingScore: number;
  foundationsJobId: number;
  techScreenType: string;
  knockout: KnockoutRequirements;
  batchType: string;
}

export interface SAJobOrder {
  title: string;
  clientCorporation: SAClient;
}

interface SAClient {
  name: string;
}
