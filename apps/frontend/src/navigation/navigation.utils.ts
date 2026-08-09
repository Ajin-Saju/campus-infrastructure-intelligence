import { NavItem, BreadcrumbItem } from './navigation.types';
import {
  ADMIN_NAV,
  TECHNICIAN_NAV,
  VENDOR_NAV,
  FACULTY_NAV,
  STUDENT_NAV,
} from './navigation.config';

export function getNavForRole(role: string): NavItem[] {
  const normalizedRole = (role || '').toUpperCase();

  switch (normalizedRole) {
    case 'ADMIN':
      return ADMIN_NAV;
    case 'TECHNICIAN':
      return TECHNICIAN_NAV;
    case 'VENDOR':
      return VENDOR_NAV;
    case 'FACULTY':
      return FACULTY_NAV;
    case 'STUDENT':
    default:
      return STUDENT_NAV;
  }
}

export function isRouteActive(pathname: string, route: string): boolean {
  if (route === '/') {
    return pathname === '/';
  }
  const cleanRoute = route.split('?')[0];
  const cleanPathname = pathname.split('?')[0];
  return cleanPathname === cleanRoute || cleanPathname.startsWith(`${cleanRoute}/`);
}

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === '/') {
    return [{ label: 'Home', route: '/' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', route: '/' }];

  let currentPath = '';
  segments.forEach((seg, idx) => {
    currentPath += `/${seg}`;
    const formatted = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

    if (idx === segments.length - 1) {
      breadcrumbs.push({ label: formatted });
    } else {
      breadcrumbs.push({ label: formatted, route: currentPath });
    }
  });

  return breadcrumbs;
}
