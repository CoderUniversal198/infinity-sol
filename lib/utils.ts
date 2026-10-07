import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}
export function initials(name: string) { return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase(); }
export const roleLabel = { ADMIN: 'Admin', MANAGER: 'Manager', AGENT: 'Agent' };
