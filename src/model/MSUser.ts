export interface MSUser {
  id: string;
  userPrincipalName: string;
  tempPassword?: string;
  assignedLicenses?: any[];
}
