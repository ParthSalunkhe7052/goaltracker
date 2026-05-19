import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getActiveQuarterWindow() {
  const month = new Date().getMonth(); // 0-indexed (0 = Jan)
  
  if (month === 4) return "GOAL_SETTING"; // May
  if (month === 6) return "Q1"; // July
  if (month === 9) return "Q2"; // Oct
  if (month === 0) return "Q3"; // Jan
  if (month === 2 || month === 3) return "Q4"; // March or April
  
  return null;
}
