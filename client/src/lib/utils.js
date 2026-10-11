import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Class-name helper used by the mapcn map component. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
