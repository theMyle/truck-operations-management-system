import { useCombobox, Combobox, InputBase, Group, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

/* ── Creatable Select component ── */
export function CreatableSelect({
  label,
  placeholder,
  data: initialData,
  value,
  onChange,
  styles: externalStyles,
  error,
}: {
  label: string;
  placeholder: string;
  data: string[];
  value: string | null;
  onChange: (val: string | null) => void;
  styles?: Record<string, React.CSSProperties>;
  error?: string;
}) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(value || "");

  const exactMatch = data.some(
    (item) => item.toLowerCase() === search.toLowerCase().trim(),
  );

  const filtered = data.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const options = filtered.map((item) => (
    <Combobox.Option value={item} key={item}>
      <Text style={{ fontSize: "11px" }} fw={600}>
        {item}
      </Text>
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={true}
      onOptionSubmit={(val) => {
        if (val === "$create") {
          const trimmed = search.trim();
          setData((prev) => [...prev, trimmed]);
          onChange(trimmed);
          setSearch(trimmed);
        } else {
          onChange(val);
          setSearch(val);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          placeholder={placeholder}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          value={search}
          onChange={(e) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(e.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value || "");
          }}
          styles={externalStyles}
          error={error}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={200} style={{ overflowY: "auto" }}>
          {options}
          {!exactMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">
              <Group gap={6}>
                <IconPlus size={10} color="var(--mantine-color-blue-6)" />
                <Text style={{ fontSize: "11px" }} fw={600} c="blue.6">
                  Add &ldquo;{search.trim()}&rdquo;
                </Text>
              </Group>
            </Combobox.Option>
          )}
          {options.length === 0 && search.trim().length === 0 && (
            <Combobox.Empty>
              <Text style={{ fontSize: "11px" }} c="dimmed">
                No options
              </Text>
            </Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}