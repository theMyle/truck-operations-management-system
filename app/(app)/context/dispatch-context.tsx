"use client";

import { createContext, useContext, useState } from "react";
import { DispatchRecord } from "@/app/(app)/constant";
import { MOCK_RECORDS, MOCK_RECORDS_BOOKING } from "@/app/(app)/constant";

interface DispatchContextType {
  records: DispatchRecord[];
  setRecords: React.Dispatch<React.SetStateAction<DispatchRecord[]>>;
  editingRecord: DispatchRecord | null;
  setEditingRecord: (r: DispatchRecord | null) => void;
  bookingRecords: DispatchRecord[];
  travelLogs: DispatchRecord[];
  updateBookingRecord: (id: number, details: Partial<DispatchRecord>) => void;
  deleteBookingRecord: (id: number) => void;
  updateTravelLog: (id: number, data: Partial<DispatchRecord>) => void;
  deleteTravelLog: (id: number) => void;
}

const DispatchContext = createContext<DispatchContextType | null>(null);

export function DispatchProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DispatchRecord[]>(MOCK_RECORDS);
  const [editingRecord, setEditingRecord] = useState<DispatchRecord | null>(null);

  const [bookingRecords, setBookingRecords] = useState<DispatchRecord[]>(
    MOCK_RECORDS_BOOKING.filter((r) => r.deliveryStatus !== "Completed"),
  );
  const [travelLogs, setTravelLogs] = useState<DispatchRecord[]>(
    MOCK_RECORDS_BOOKING.filter((r) => r.deliveryStatus === "Completed"),
  );

  const updateBookingRecord = (id: number, details: Partial<DispatchRecord>) => {
    setBookingRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...details } : r));
      const completed = updated.find(
        (r) => r.id === id && r.deliveryStatus === "Completed",
      );
      if (completed) {
        setTravelLogs((logs) => [...logs, completed]);
        return updated.filter((r) => r.id !== id);
      }
      return updated;
    });
  };

  const deleteBookingRecord = (id: number) => {
    setBookingRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const updateTravelLog = (id: number, data: Partial<DispatchRecord>) => {
    setTravelLogs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
    );
  };

  const deleteTravelLog = (id: number) => {
    setTravelLogs((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <DispatchContext.Provider
      value={{
        records,
        setRecords,
        editingRecord,
        setEditingRecord,
        bookingRecords,
        travelLogs,
        updateBookingRecord,
        deleteBookingRecord,
        updateTravelLog,
        deleteTravelLog,
      }}
    >
      {children}
    </DispatchContext.Provider>
  );
}

export const useDispatch = () => {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useDispatch must be used within DispatchProvider");
  return ctx;
};