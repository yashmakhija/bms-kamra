/**
 * Format date for display
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format time for display
 * @param timeString ISO date-time string
 * @returns Formatted time string
 */
export function formatTime(timeString: string): string {
  const time = new Date(timeString);
  return time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format currency value
 * @param amount Numeric amount
 * @param currency Currency code (default: INR)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "INR"
): string {
  const currencySymbol = currency === "INR" ? "₹" : currency;
  return `${currencySymbol} ${amount.toLocaleString()}`;
}

/**
 * Get relative time from now
 * @param dateString ISO date string
 * @returns Relative time (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return date > now ? "Tomorrow" : "Yesterday";
  } else if (diffDays < 7) {
    return date > now ? `In ${diffDays} days` : `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return date > now
      ? `In ${weeks} ${weeks === 1 ? "week" : "weeks"}`
      : `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else {
    return formatDate(dateString);
  }
}
