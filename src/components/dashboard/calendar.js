import { eachDayOfInterval, endOfMonth, endOfWeek, startOfWeek } from "date-fns";

import { dayKey } from "@/lib/format";

// Helpers for the dashboard calendar: which month and day are shown, and which days to draw.

// Reads ?month= &day= &type= &id= &filter= from the address bar, with safe defaults.
export function readView(params, today) {
  const thisMonth = today.slice(0, 7);

  let month = params.get("month");
  if (!/^\d{4}-\d{2}$/.test(month ?? "")) month = thisMonth;

  let day = params.get("day");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "") || !day.startsWith(month)) {
    day = month === thisMonth ? today : `${month}-01`;
  }

  const type = params.get("type");
  const id = params.get("id");
  const selected = type && id ? { type, id } : null;

  const filter = params.get("filter") ?? "all";
  return { month, day, selected, filter };
}

// "2026-10" → 1 October 2026
export function monthStart(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

// Every day the calendar shows: whole weeks, Saturday to Friday, covering the month.
export function monthDays(month) {
  const first = monthStart(month);
  return eachDayOfInterval({
    start: startOfWeek(first, { weekStartsOn: 6 }),
    end: endOfWeek(endOfMonth(first), { weekStartsOn: 6 }),
  });
}

// An earlier stage of an onboarding that has moved on to a later visit (shown faded). Only
// `current: false` counts, so an API without the field (an older server) shows every visit as current.
export const isEarlierVisit = (visit) => visit?.current === false;

// Tells apart the visits of one record, which can be on several days. An older server sends no
// `key`, and one visit per record, so the record id is enough there.
export const visitKey = (visit) => visit.key ?? visit.id;

// { "2026-10-21": [visit, visit], … } using the day in Dhaka time.
export function groupByDay(visits) {
  const byDay = {};
  if (!Array.isArray(visits)) return byDay;
  for (const visit of visits) {
    if (!visit?.visitDate) continue;
    const day = dayKey(visit.visitDate);
    if (!day) continue;
    byDay[day] ??= [];
    byDay[day].push(visit);
  }
  return byDay;
}
