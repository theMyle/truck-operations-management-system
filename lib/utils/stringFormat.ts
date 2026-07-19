
export function toTitleCase(str: string): string {
    return str
        .split(" ")
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

export function formatTime12Hour(timeStr: string | null | undefined): string {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function formatTimeHHMM(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

export function getTripRefNumber(bookingId: string, pickupDateStr?: string | null): string {
  // Use pickup date if available, or fall back to current date
  const d = pickupDateStr ? new Date(pickupDateStr) : new Date();
  const datePart = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(-2)}`;
  
  // Extract first 8 chars of UUID to make it deterministic and readable
  const shortId = bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();
  
  return `LIQ-${datePart}-${shortId}-RCR`;
}