import { Box, Group, TextInput, Loader, Paper, Text } from "@mantine/core";
import React, { useState } from "react";

export function formatShortAddress(item: {
  display_name?: string;
  name?: string;
  address?: Record<string, string>;
}): string {
  if (item.address && typeof item.address === "object") {
    const addr = item.address;
    const local =
      item.name ||
      addr.suburb ||
      addr.village ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.city_district ||
      addr.hamlet ||
      addr.road ||
      addr.industrial ||
      "";
    const cityOrMun =
      addr.city ||
      addr.municipality ||
      addr.town ||
      addr.county ||
      "";
    const provinceOrState =
      addr.province ||
      addr.state ||
      addr.region ||
      "";

    const parts: string[] = [];
    if (local) parts.push(local);
    if (cityOrMun && !parts.some((p) => p.toLowerCase() === cityOrMun.toLowerCase())) {
      parts.push(cityOrMun);
    }
    if (
      provinceOrState &&
      provinceOrState.toLowerCase() !== "philippines" &&
      !parts.some((p) => p.toLowerCase() === provinceOrState.toLowerCase())
    ) {
      parts.push(provinceOrState);
    }

    if (parts.length > 0) {
      return parts.slice(0, 3).join(", ");
    }
  }

  if (item.display_name) {
    const filtered = item.display_name
      .split(",")
      .map((p) => p.trim())
      .filter((p) => {
        const l = p.toLowerCase();
        if (!l) return false;
        if (l === "philippines" || l === "ph") return false;
        if (/^\d{4,5}$/.test(p)) return false;
        if (l.includes("district") || l.includes("region")) return false;
        return true;
      });
    if (filtered.length > 0) {
      return filtered.slice(0, 3).join(", ");
    }
    return item.display_name;
  }

  return "";
}

export function LocationSearch({
  label,
  placeholder,
  value,
  onChange,
  error,
  leftSection,
  rightAction,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (val: string) => void;
  error?: React.ReactNode;
  leftSection?: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<
    { display_name: string; short_name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  const search = (q: string) => {
    setQuery(q);
    onChange?.(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=ph`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(
            data.map((item) => ({
              display_name: item.display_name,
              short_name: formatShortAddress(item),
            }))
          );
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const select = (short_name: string) => {
    setQuery(short_name);
    onChange?.(short_name);
    setSuggestions([]);
  };

  return (
    <Box style={{ position: "relative" }}>
      <Group justify="space-between" align="center" mb={4}>
        <Text
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--mantine-color-gray-7)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </Text>
        {rightAction}
      </Group>
      <TextInput
        placeholder={placeholder}
        value={query}
        onChange={(e) => search(e.currentTarget.value)}
        error={error}
        leftSection={leftSection}
        rightSection={loading ? <Loader size={12} /> : null}
        styles={{
          input: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase" },
        }}
      />
      {suggestions.length > 0 && (
        <Paper
          withBorder
          shadow="md"
          radius="sm"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 300,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => (
            <Box
              key={i}
              px="sm"
              py={6}
              style={{
                cursor: "pointer",
                borderBottom:
                  i < suggestions.length - 1
                    ? "1px solid var(--mantine-color-gray-2)"
                    : "none",
              }}
              onMouseDown={() => select(s.short_name)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--mantine-color-gray-0)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              <Text style={{ fontSize: "11px", fontWeight: 700 }} tt="uppercase">
                {s.short_name}
              </Text>
              <Text style={{ fontSize: "9px" }} c="dimmed" truncate>
                {s.display_name}
              </Text>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}