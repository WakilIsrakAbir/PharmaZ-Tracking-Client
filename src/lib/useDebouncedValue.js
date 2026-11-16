"use client";

import { useEffect, useState } from "react";

// The value, once it has stopped changing for `delay` ms: a search box asks the API when typing
// pauses, not on every key.
export function useDebouncedValue(value, delay = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}
