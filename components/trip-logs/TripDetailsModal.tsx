"use client";

import { Modal, Tabs, Text, Group, Badge, ScrollArea } from "@mantine/core";
import { IconClipboardList, IconGauge, IconWallet, IconReceipt } from "@tabler/icons-react";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "@mantine/form";
import { DispatchRecord } from "@/app/(app)/constant";
import { NewOdometerTab } from "./OdometerTab";
import { NewBudgetTab } from "./BudgetTab";
import { NewExpensesTab } from "./ExpensesTab";
import { TripSummaryModal } from "./TripSummaryModal";
import { BookingWithRelations } from "@/lib/db/schema/booking";
import { generateLiquidationPDF } from "@/lib/utils/pdf";

export interface TripData {
    tripNumber: number;
    odoStart: number;
    odoEnd: number;
}

export interface Expenses {
    expenseId: number;
    expenseCategory: string;
    amount: number;
    assignedTo?: string;
}

export interface NewTripDetailsFormData {
    // odometer
    tripType: "single" | "multiple";
    trips: TripData[];
    totalKm: number;

    // budget
    budget: number;
    budgetFrom: string;
    rfidLoad: number;
    rfidPaymentType: 'cash' | 'card';
    fuelAmount: number;
    fuelPaymentType: 'shell card' | 'cash';
    collectionFromCustomer: number;
    cashOnHandReturned: number;
    cashOnHandReturnedToWhom: string;
    autoCA: boolean;

    // expenses
    driverRate: number;
    helperRate: number;
    helperRates?: Record<string, number>;
    expenses: Expenses[];
}

const defaultForm = (): NewTripDetailsFormData => ({
    tripType: "single",
    trips: [{ tripNumber: 1, odoStart: 0, odoEnd: 0 }],
    totalKm: 0,
    budget: 0,
    budgetFrom: "",
    rfidLoad: 0,
    rfidPaymentType: "cash",
    fuelAmount: 0,
    fuelPaymentType: "cash",
    collectionFromCustomer: 0,
    cashOnHandReturned: 0,
    cashOnHandReturnedToWhom: "",
    autoCA: false,
    driverRate: 0,
    helperRate: 0,
    expenses: [],
});

import { getTripRefNumber } from "@/lib/utils/stringFormat";

export function TripDetailsModal({
    opened,
    onClose,
    record,
    initialData,
    onSave,
}: {
    opened: boolean;
    onClose: () => void;
    record: DispatchRecord | null;
    initialData?: NewTripDetailsFormData;
    onSave: (data: NewTripDetailsFormData) => void;
}) {
    const [activeTab, setActiveTab] = useState<string | null>("odometer");
    const [reviewOpened, setReviewOpened] = useState(false);
    const [pendingRefNumber, setPendingRefNumber] = useState("");

    const form = useForm<NewTripDetailsFormData>({
        initialValues: initialData || defaultForm(),
        validate: {
            trips: {
                odoEnd: (value, values, path) => {
                    const idx = parseInt(path.split(".")[1], 10);
                    const trip = values.trips[idx];
                    if (trip && value < trip.odoStart) {
                        return "ODO End must be ≥ ODO Start";
                    }
                    return null;
                },
            },
        },
    });
    
    useEffect(() => {
        if (opened) {
            form.initialize(initialData || defaultForm());
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab("odometer");
        }
    }, [opened, initialData]);

    const handleReset = () => {
        switch (activeTab) {
            case "odometer":
                form.setValues({
                    tripType: "single",
                    trips: [{ tripNumber: 1, odoStart: 0, odoEnd: 0 }],
                    totalKm: 0,
                });
                break;
            case "budget":
                form.setValues({
                    budget: 0,
                    budgetFrom: "",
                    rfidLoad: 0,
                    rfidPaymentType: "cash",
                    fuelAmount: 0,
                    fuelPaymentType: "cash",
                    collectionFromCustomer: 0,
                    cashOnHandReturned: 0,
                    cashOnHandReturnedToWhom: "",
                    autoCA: false,
                });
                break;
            case "expenses":
                form.setFieldValue("expenses", []);
                break;
        }
    };

    /* ── Dynamic Calculations ── */
    const start = form.values.trips[0]?.odoStart || 0;
    const end = form.values.trips[form.values.trips.length - 1]?.odoEnd || 0;
    const totalKm = Math.max(0, end - start);

    const handleSave = () => {
        const validation = form.validate();
        if (validation.hasErrors) return;

        if (!record) return;
        setPendingRefNumber(getTripRefNumber(String(record.id), record.pickUpDate || record.date));
        setReviewOpened(true);
    };

    const handleConfirmSave = () => {
        setReviewOpened(false);
        onSave({
            ...form.values,
            totalKm,
        });
    };

    const handleDownload = () => {
        if (!record) return;
        generateLiquidationPDF(record, form.values, pendingRefNumber);
    };

    const manpowerOptions = useMemo(() => {
        if (!record) return [];

        const helperList: string[] = [];
        if (record.rawHelpers && record.rawHelpers.length > 0) {
            record.rawHelpers.forEach((h) => {
                if (h.helperName && !helperList.includes(h.helperName)) {
                    helperList.push(h.helperName);
                }
            });
        } else if (record.helper) {
            record.helper.split(",").forEach((hName) => {
                const trimmed = hName.trim();
                if (trimmed && trimmed !== "No Helper" && !helperList.includes(trimmed)) {
                    helperList.push(trimmed);
                }
            });
        }

        const helperOptions = helperList.map((name) => ({
            value: name,
            label: `${name} (Helper)`,
        }));

        const items = [
            record.driver
                ? { value: record.driver, label: `${record.driver} (Driver)` }
                : null,
            ...helperOptions,
            record.trucker
                ? { value: record.trucker, label: `${record.trucker} (Trucker)` }
                : null,
        ].filter((o): o is { value: string; label: string } => o !== null);

        const seen = new Set<string>();
        return items.filter((item) => {
            if (seen.has(item.value)) return false;
            seen.add(item.value);
            return true;
        });
    }, [record]);

    const activeBookingData = useMemo<BookingWithRelations | null>(() => {
        if (!record) return null;

        return {
            id: String(record.id),
            displayBookingNo: Number(record.id) || 0,
            bookingDate: record.date,
            clientId: "",
            clientName: record.client,
            ruta: record.ruta || "",
            clientRate: "0",
            pickupDate: record.date,
            pickupTime: record.pickUpTime || "",
            pickupLocation: "",
            bookingDRNo: record.bookingDr || "",
            numberOfDrops: record.noOfDrops || 0,
            plateNumber: record.plateNo || "",
            trucker: record.trucker || "",
            fleetType: "",
            truckerRate: "0",
            driverId: "",
            driverName: record.driver || "",
            bookedBy: record.bookedBy || "",

            deliveryStatus: record.status,
            PODLink: record.podFileUrl || null,
            tripRemarks: record.tripRemarks || "",
            pickupArrivalTime: record.arrivalPickup ? new Date(record.arrivalPickup) : null,
            pickupDepartureTime: record.departurePickup ? new Date(record.departurePickup) : null,
            loadingStartTime: record.loadingStart ? new Date(record.loadingStart) : null,
            loadingEndTime: record.loadingEnd ? new Date(record.loadingEnd) : null,
            finishedDeliveryTime: record.finishDelivery ? new Date(record.finishDelivery) : null,

            odoDetails: form.values.trips.map((t, idx) => ({
                id: String(idx),
                bookingId: String(record.id),
                tripIndex: t.tripNumber || idx + 1,
                odoStart: t.odoStart,
                odoEnd: t.odoEnd,
            })),

            budget: String(form.values.budget),
            budgetFrom: form.values.budgetFrom,
            rfidLoad: String(form.values.rfidLoad),
            rfidPaymentType: form.values.rfidPaymentType,
            fuel: String(form.values.fuelAmount),
            fuelPaymentType: form.values.fuelPaymentType === "shell card" ? "card" : form.values.fuelPaymentType,
            customerCollection: String(form.values.collectionFromCustomer),
            cashOnHandReturned: String(form.values.cashOnHandReturned),
            cashOnHandReturnedTo: form.values.cashOnHandReturnedToWhom,
            autoCash: form.values.autoCA,

            driverRate: String(form.values.driverRate),
            helperRate: String(form.values.helperRate),
            expenses: form.values.expenses.map((e, idx) => ({
                id: String(e.expenseId),
                bookingId: String(record.id),
                entryIndex: idx,
                expenseType: e.expenseCategory,
                amount: String(e.amount),
            })),
            helpers: [],
            drops: [],
        };
    }, [record, form.values]);

    if (!record) return null;

    return (
        <>
            <TripSummaryModal
                opened={reviewOpened}
                onClose={() => setReviewOpened(false)}
                booking={activeBookingData}
                onConfirm={handleConfirmSave}
            />

            <Modal
                opened={opened}
                onClose={onClose}
                title={
                    <Group gap={8}>
                        <IconClipboardList size={16} color="var(--mantine-color-blue-6)" />
                        <Text fw={700} style={{ fontSize: "13px" }} tt="uppercase" lts={0.5}>
                            Trip Details — #{record.id}
                        </Text>
                        <Badge
                            variant="light"
                            color="blue"
                            radius="sm"
                            styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
                        >
                            {record.client}
                        </Badge>
                    </Group>
                }
                size="lg"
                radius="md"
                centered
                scrollAreaComponent={ScrollArea.Autosize}
            >
                <Text style={{ fontSize: "11px" }} c="dimmed" mb="sm">
                    {record.driver} · {record.ruta} · {record.date}
                </Text>

                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List mb="md">
                        <Tabs.Tab value="odometer" leftSection={<IconGauge size={13} />}>
                            <Text style={{ fontSize: "11px" }} fw={600}>
                                Odometer
                            </Text>
                        </Tabs.Tab>
                        <Tabs.Tab value="budget" leftSection={<IconWallet size={13} />}>
                            <Text style={{ fontSize: "11px" }} fw={600}>
                                Budget
                            </Text>
                        </Tabs.Tab>
                        <Tabs.Tab value="expenses" leftSection={<IconReceipt size={13} />}>
                            <Text style={{ fontSize: "11px" }} fw={600}>
                                Expenses
                            </Text>
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* ══ ODOMETER TAB ══ */}
                    <Tabs.Panel value="odometer">
                        <NewOdometerTab
                            form={form}
                            setActiveTab={setActiveTab}
                            handleReset={handleReset}
                            record={record}
                        />
                    </Tabs.Panel>

                    {/* ══ BUDGET TAB ══ */}
                    <Tabs.Panel value="budget">
                        <NewBudgetTab form={form} setActiveTab={setActiveTab} handleReset={handleReset} />
                    </Tabs.Panel>

                    {/* ══ EXPENSES TAB ══ */}
                    <Tabs.Panel value="expenses">
                        <NewExpensesTab
                            form={form}
                            setActiveTab={setActiveTab}
                            handleReset={handleReset}
                            handleSave={handleSave}
                            manpowerOptions={manpowerOptions}
                            driverName={record.driver || "Driver"}
                            helperName={record.helper || "Helper"}
                        />
                    </Tabs.Panel>
                </Tabs>
            </Modal>
        </>
    );
}
