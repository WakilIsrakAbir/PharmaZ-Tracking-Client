"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { PAGE_SIZES } from "@/components/shared/common";

// How many rows a page of a list shows. By default as many as fit on the screen, so the page needs
// no scrolling ("Auto" under Per page); or the size picked there (?limit=20).
//
//   const { rowsRef, fit, auto, limit } = usePageSize(params);
//   useRecords(type, { …, limit }, { enabled: limit !== null });   // wait until it is measured
//   <div ref={rowsRef}><ul><li>column titles</li><li>row</li>…</ul></div>
//   <Pagination … fit={fit} auto={auto} />                           // the page bar comes after the rows
//
// It measures the real page: where the rows start, how tall the column titles, a row and the page bar
// are (guesses until they are on screen), and measures again when the window or the rows change.
const MIN_ROWS = 5; // on phones the tabs and filters take most of the screen, so a page still has a few rows
const MAX_ROWS = 100; // the most the API gives at once
const GUESS = {
  row: { wide: 69, narrow: 128 }, // one row of the list
  titles: { wide: 33, narrow: 0 }, // the column titles (hidden on phones)
  pager: { wide: 57, narrow: 106 }, // the page bar (two lines on phones)
};

export function usePageSize(params) {
  const picked = Number(params.get("limit"));
  const chosen = PAGE_SIZES.includes(picked) ? picked : null;
  const rowsRef = useRef(null);
  const [fit, setFit] = useState(null);

  useLayoutEffect(() => {
    const box = rowsRef.current;
    if (!box) return undefined;

    function measure() {
      const wide = window.matchMedia("(min-width: 768px)").matches;
      const size = wide ? "wide" : "narrow";
      const titles = box.querySelector("ul")?.firstElementChild ?? null;
      const row = titles?.nextElementSibling ?? null;
      const pager = box.parentElement?.querySelector('nav[aria-label="Pages"]');
      const titlesHeight = titles ? titles.offsetHeight : GUESS.titles[size];
      const rowHeight = row?.offsetHeight || GUESS.row[size];
      const pagerHeight = pager?.offsetHeight || GUESS.pager[size];
      const top = box.getBoundingClientRect().top + window.scrollY; // where the rows start on the page
      const room = window.innerHeight - top - titlesHeight - pagerHeight;
      setFit(Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.floor(room / rowHeight))));
    }

    measure();
    let timer;
    const measureSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 120);
    };
    window.addEventListener("resize", measureSoon);
    const resized = new ResizeObserver(measureSoon); // the filters wrapped, or (phones) the rows came in
    resized.observe(box);
    // On large screens the box has a fixed height (the rows scroll inside it), so the rows coming in
    // don't resize it: watch them arrive to measure a real row instead of the guess.
    const changed = new MutationObserver(measureSoon);
    changed.observe(box, { childList: true });
    return () => {
      window.removeEventListener("resize", measureSoon);
      resized.disconnect();
      changed.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return { rowsRef, fit, auto: chosen === null, limit: chosen ?? fit };
}
