export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Company Admin'
  | 'Manager'
  | 'Sales User'
  | 'Viewer'
  | 'Guest';

export interface PlatformUserContract {
  id: string;
  email: string;
  name: string;
  companyId?: string | null;
  role: UserRole;
  isOrgUser: boolean;
}
