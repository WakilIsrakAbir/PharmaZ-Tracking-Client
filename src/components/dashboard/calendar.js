import { eachDayOfInterval, endOfMonth, endOfWeek, startOfWeek } from "date-fns";

import { dayKey } from "@/lib/format";

// Helpers for the dashboard calendar: which month and day are shown, and which days to draw.

// Reads ?month= &day= &type= &id= &filter= from the address bar, with safe defaults.
export function readView(params, today) {
  const thisMonth = today.slice(0, 7);

  let month = params.get("month");
  if (!/^\d{4}-\d{2}$/.test(month ?? "")) month = thisMonth;

  let day = params.get("day");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) day = month === thisMonth ? today : `${month}-01`;

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

// { "2026-10-21": [visit, visit], … } using the day in Dhaka time.
export function groupByDay(visits) {
  const byDay = {};
  for (const visit of visits) {
    const day = dayKey(visit.visitDate);
    byDay[day] ??= [];
    byDay[day].push(visit);
  }
  return byDay;
}
