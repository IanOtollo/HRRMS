import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

function useDebouncedValue(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Live "is this already taken" check for a unique employee field — flags a
// clash the moment it's typed, instead of only surfacing it after submit.
export function useFieldAvailability(
  field: "pfNumber" | "nationalId" | "phoneNumber" | "emailAddress",
  value: string,
  excludeId?: Id<"employees">
) {
  const debounced = useDebouncedValue(value?.trim() ?? "");
  const result = useQuery(
    api.employees.checkFieldAvailable,
    debounced ? { field, value: debounced, excludeId } : "skip"
  );

  // Only report "taken" once the debounced value matches what's currently
  // typed — avoids flashing a stale result while the user is still typing.
  const isCurrent = debounced === (value?.trim() ?? "");
  return isCurrent && result?.available === false;
}
