"use client";

import { useCallback } from "react";
import { DispatchRecord } from "@/app/(app)/constant";
import { ExportColumn } from "./useTableExport";
import { toTitleCase } from "@/lib/utils/stringFormat";

export function adjustDateByDays(dateStr: string, daysOffset: number): string {
  if (!daysOffset || !dateStr) return dateStr;
  const str = dateStr.trim();
  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10);
    const day = parseInt(matchIso[3], 10);
    const d = new Date(year, month - 1, day + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
  }

  const matchSlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchSlash) {
    const month = parseInt(matchSlash[1], 10);
    const day = parseInt(matchSlash[2], 10);
    const year = parseInt(matchSlash[3], 10);
    const d = new Date(year, month - 1, day + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    return `${m}/${dt}/${y}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    d.setDate(d.getDate() + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
  }

  return dateStr;
}

export function getDepartureInGarageTime(
  timeStr: string | null | undefined,
  dateStr?: string | null | undefined
): string {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.trim() || timeStr === "—") {
    return "—";
  }

  const str = timeStr.trim();
  let hours: number | null = null;
  let minutes: number | null = null;

  // 1. Parse 12-hour format with AM/PM (e.g. "8:00 AM", "08:30 PM", "12:00 PM")
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }

  // 2. Parse 24-hour or HH:MM format (e.g. "08:00", "14:30")
  if (hours === null) {
    const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);
    }
  }

  if (hours === null || minutes === null) {
    return str;
  }

  const isPreviousDay = hours < 2;
  const newHours = (hours - 2 + 24) % 24;
  const newPeriod = newHours >= 12 ? "PM" : "AM";
  let displayHours = newHours % 12;
  if (displayHours === 0) displayHours = 12;

  const formattedMinutes = minutes.toString().padStart(2, "0");
  const timeFormatted = `${displayHours}:${formattedMinutes} ${newPeriod}`;

  if (isPreviousDay && dateStr && dateStr.trim() && dateStr !== "—") {
    const departureDate = adjustDateByDays(dateStr, -1);
    return `${timeFormatted}\n${departureDate}`;
  }

  return timeFormatted;
}

export function useTablePrint(
  records: DispatchRecord[],
  columns: ExportColumn[],
  title: string
) {
  const handlePrint = useCallback(() => {
    const rows = records
      .map(
        (r) => `
          <tr>
            ${columns
              .map((col) => {
                const val = r[col.key as keyof DispatchRecord];
                let text = col.key === "bookedBy" ? toTitleCase(String(val ?? "")) : String(val ?? "—");
                if (col.key === "pickUpTime") {
                  text = getDepartureInGarageTime(String(val ?? ""), r.pickUpDate || r.date);
                }
                return `<td>${text}</td>`;
              })
              .join("")}
          </tr>`,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 15px; color: #1e3a8a; margin-bottom: 2px; }
            p  { font-size: 9px; color: #888; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th {
              padding: 6px 10px;
              text-align: left;
              font-size: 9px;
              font-weight: 700;
              color: #fff;
              background: #2563eb;
              white-space: nowrap;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            td {
              padding: 5px 10px;
              font-size: 10px;
              border-bottom: 1px solid #e5e7eb;
              white-space: pre-wrap;
            }
            tr:nth-child(even) td { background: #f8fafc; }
            @page { margin: 12mm; size: landscape; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Printed: ${new Date().toLocaleString()} · ${records.length} record${records.length !== 1 ? "s" : ""}</p>
          <table>
            <thead>
              <tr>${columns.map((col) => `<th>${col.key === "pickUpTime" ? "Departure in Garage" : col.label}</th>`).join("")}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onload = () => {
      win.print();
      win.close();
    };
  }, [records, columns, title]);

  return { handlePrint };
}
