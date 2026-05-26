"use client";

import { Group, Tooltip, ActionIcon } from "@mantine/core";
import { IconEye, IconEdit, IconTrash } from "@tabler/icons-react";

interface TableRowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TableRowActions({ onView, onEdit, onDelete }: TableRowActionsProps) {
  return (
    <Group gap={4} wrap="nowrap">
      {onView && (
        <Tooltip label="View" withArrow position="top" fz={10}>
          <ActionIcon
            size="sm"
            radius="sm"
            variant="light"
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            aria-label="View"
          >
            <IconEye size={13} />
          </ActionIcon>
        </Tooltip>
      )}

      {onEdit && (
        <Tooltip label="Edit" withArrow position="top" fz={10}>
          <ActionIcon
            size="sm"
            radius="sm"
            variant="light"
            color="orange"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit"
          >
            <IconEdit size={13} />
          </ActionIcon>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip label="Delete" withArrow position="top" fz={10}>
          <ActionIcon
            size="sm"
            radius="sm"
            variant="light"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
          >
            <IconTrash size={13} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
