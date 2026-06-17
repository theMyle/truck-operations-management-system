import { Box, Group, TextInput, Loader, Paper, Text } from "@mantine/core";
import React, { useState } from "react";

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
  const [suggestions, setSuggestions] = useState<{ display_name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(value ?? "");
  }, [value]);

  const search = (q: string) => {
    setQuery(q);
    onChange?.(q); // keep parent in sync as user types
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
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const select = (display_name: string) => {
    setQuery(display_name);
    onChange?.(display_name);
    setSuggestions([]);
  };

  return (
    <Box style={{ position: "relative" }}>
      {/* Label row with optional right action */}
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
          input: { fontSize: "11px", fontWeight: 600 },
        }}
      />
      {/* suggestions dropdown unchanged */}
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
            maxHeight: 200,
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
                fontSize: "11px",
                fontWeight: 500,
                borderBottom:
                  i < suggestions.length - 1
                    ? "1px solid var(--mantine-color-gray-2)"
                    : "none",
              }}
              onMouseDown={() => select(s.display_name)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--mantine-color-gray-0)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              {s.display_name}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}