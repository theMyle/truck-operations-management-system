type DeleteUsage = {
  count: number;
  singular: string;
  plural?: string;
};

function formatUsage({ count, singular, plural }: DeleteUsage) {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}

export function throwIfDeleteBlocked(entity: string, usages: DeleteUsage[]) {
  const blockers = usages.filter(({ count }) => count > 0);

  if (blockers.length === 0) return;

  throw new Error(
    `Cannot delete ${entity} because it is used in ${blockers
      .map(formatUsage)
      .join(" and ")}. Update or delete those records first.`,
  );
}
