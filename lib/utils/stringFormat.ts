
export function capitalizeWords(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .replace(/_/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toTitleCase(str: string | null | undefined): string {
    if (!str) return "—";
    return capitalizeWords(str) || "—";
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

export function generateClientCode(clientName: string): string {
  if (!clientName) return "GEN";
  const name = clientName.trim();
  const clean = name.replace(/\b(Inc|Incorporated|Corp|Corporation|Ltd|Limited|OPC)\b/gi, "").trim();

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
  }
  if (words.length === 2) {
    const w1 = words[0];
    const w2 = words[1];
    if (w1.length >= 2) {
      return (w1.slice(0, 2) + w2[0]).toUpperCase();
    }
    return (w1[0] + w2.slice(0, 2)).toUpperCase();
  }
  if (words.length === 1) {
    const w = words[0].replace(/[^A-Za-z0-9]/g, "");
    if (w.length >= 3) return w.slice(0, 3).toUpperCase();
    return w.padEnd(3, "X").toUpperCase();
  }
  return "KTS";
}

export function generateSoaNumber(clientName: string, existingSoas: string[] = []): string {
  const code = generateClientCode(clientName);
  const year = new Date().getFullYear();
  const prefix = `KTS-${code}-${year}-`;

  let maxSeq = 0;
  existingSoas.forEach((soa) => {
    if (soa && soa.toUpperCase().startsWith(prefix)) {
      const parts = soa.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `${prefix}${nextSeq}`;
}
export function formatDriverShortName(driverName?: string | null): string {
  if (!driverName || typeof driverName !== "string" || !driverName.trim() || driverName === "—") {
    return "";
  }
  const parts = driverName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].toUpperCase();
  }
  const firstName = parts[0].toUpperCase();
  const lastInitial = parts[parts.length - 1][0].toUpperCase() + ".";
  return `${firstName} ${lastInitial}`;
}

export function formatEmployeeName(name: string | null | undefined): string {
  if (!name) return "";
  const cleaned = name.trim();
  if (!cleaned) return "";

  return cleaned
    .split(",")
    .map((singleName) => {
      const tokens = singleName.trim().split(/\s+/);
      if (tokens.length <= 1) return tokens[0].toUpperCase();

      const filtered = tokens.filter((token, idx) => {
        if (idx === 0) return true;
        if (idx === tokens.length - 1) return true;
        const isMiddleInitial = /^[A-Za-z]\.?$/.test(token);
        return !isMiddleInitial;
      });

      return filtered.join(" ").toUpperCase();
    })
    .join(", ");
}
