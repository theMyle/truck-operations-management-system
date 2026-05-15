"use client";

import { createContext, useContext, useState } from "react";
import { DispatchRecord } from "@/app/(app)/constant"; 
import { MOCK_RECORDS } from "@/app/(app)/constant";

interface DispatchContextType {
  records: DispatchRecord[];
  setRecords: React.Dispatch<React.SetStateAction<DispatchRecord[]>>;
  editingRecord: DispatchRecord | null;
  setEditingRecord: (r: DispatchRecord | null) => void;
}

const DispatchContext = createContext<DispatchContextType | null>(null);

export function DispatchProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DispatchRecord[]>(MOCK_RECORDS);
  const [editingRecord, setEditingRecord] = useState<DispatchRecord | null>(null);

  return (
    <DispatchContext.Provider value={{ records, setRecords, editingRecord, setEditingRecord }}>
      {children}
    </DispatchContext.Provider>
  );
}

export const useDispatch = () => {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useDispatch must be used within DispatchProvider");
  return ctx;
};