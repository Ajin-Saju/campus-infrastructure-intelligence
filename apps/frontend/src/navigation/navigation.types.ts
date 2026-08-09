export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  route: string;
  allowedRoles: string[];
  permission?: string;
  badge?: string;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

export type RoleType = 'ADMIN' | 'TECHNICIAN' | 'VENDOR' | 'FACULTY' | 'STUDENT';
