import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class lists, letting later entries override earlier
 * conflicting utilities (shadcn/ui convention).
 */
export function cn(...inputs: Array<ClassValue>): string {
	return twMerge(clsx(inputs));
}
