"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

// A page's view lives in its address: /doctors?status=setup&page=2, or /?month=2026-10&day=…
// So a refresh keeps it, the back button returns to the same page of a list, and a view can be shared.
//
//   const [params, setParams] = useUrlParams();
//   params.get("page")                       // "2" or null
//   setParams({ page: 3, search: null })     // changes the address without a page load;
//                                            // null, "" or undefined removes the key
export function useUrlParams() {
  const params = useSearchParams();

  const setParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const query = next.toString();
      window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    },
    [params],
  );

  return [params, setParams];
}
