import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWeight(weight: number | null | undefined): string {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return "0.00 kg";
  }
  return `${Number(weight).toFixed(2)} kg`;
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "text-success-600";
    case "pending":
      return "text-warning-600";
    case "rejected":
      return "text-error-600";
    default:
      return "text-gray-600";
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-success-100 text-success-800 border-success-200";
    case "pending":
      return "bg-warning-100 text-warning-800 border-warning-200";
    case "rejected":
      return "bg-error-100 text-error-800 border-error-200";
    case "active":
      return "bg-primary-100 text-primary-800 border-primary-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
