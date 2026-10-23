import { differenceInCalendarDays, format, formatDistanceToNowStrict } from "date-fns";

import { DAYS, TIME_ZONE } from "./constants";

// ---------------------------------------------------------------------------
// Dates: everything is shown in Dhaka time (UTC+6, no daylight saving).
// ---------------------------------------------------------------------------
const dhakaClock = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

// A Date whose local clock shows what a clock in Dhaka showed at that moment.
// Built from parts, so it never reads the current time (Next.js doesn't allow
// that while prerendering, which rules out helpers like TZDate).
function inDhaka(date) {
  const parts = {};
  for (const { type, value } of dhakaClock.formatToParts(new Date(date))) parts[type] = Number(value);
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

export const formatDate = (date, pattern = "EEE d MMM yyyy") => format(inDhaka(date), pattern);

// The Dhaka calendar day of a moment: "2026-10-21"
export const dayKey = (date) => formatDate(date, "yyyy-MM-dd");

// "2026-10-21" + "17:00" (Dhaka) → an ISO moment for the API.
export const dhakaDateTime = (day, time = "00:00") => new Date(`${day}T${time}:00+06:00`).toISOString();

// For <input type="date"> and <input type="time">
export const toDateInput = (date) => formatDate(date, "yyyy-MM-dd");
export const toTimeInput = (date) => formatDate(date, "HH:mm");

// "Today", "Tomorrow", "Yesterday", or "Sat 24 Oct". Pass in the current time.
export function relativeDay(date, now) {
  const days = differenceInCalendarDays(inDhaka(date), inDhaka(now));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return formatDate(date, "EEE d MMM");
}

// "Good morning" / "Good afternoon" / "Good evening", by the clock in Dhaka.
export function greeting(now) {
  const hour = inDhaka(now).getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

// When something happened, the way people say it. Uses the current time (browser only).
export function timeAgo(date, now = new Date()) {
  if (!date) return "Never";
  const value = new Date(date);
  const seconds = (now - value) / 1000;
  if (seconds < 60) return "Just now";
  if (seconds < 12 * 3600) return formatDistanceToNowStrict(value, { addSuffix: true });
  const days = differenceInCalendarDays(inDhaka(now), inDhaka(value));
  if (days === 0) return `Today, ${formatDate(value, "h:mm a")}`;
  if (days === 1) return `Yesterday, ${formatDate(value, "h:mm a")}`;
  if (days < 7) return `${days} days ago`;
  return formatDate(value, "d MMM yyyy");
}

// ---------------------------------------------------------------------------
// Form values
// ---------------------------------------------------------------------------

// "17:00" → "5:00 PM"
function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

// ["sat","sun","mon","tue","wed"] → "Sat – Wed"; ["sat","mon"] → "Sat, Mon"
function formatDays(days = []) {
  const order = DAYS.map((day) => day.value);
  const picked = order.filter((day) => days.includes(day));
  if (picked.length === 0) return "";
  if (picked.length === 7) return "Every day";
  const label = (day) => DAYS.find((item) => item.value === day).label;
  const indexes = picked.map((day) => order.indexOf(day));
  const consecutive = indexes.every((index, i) => i === 0 || index === indexes[i - 1] + 1);
  if (consecutive && picked.length > 2) return `${label(picked[0])} – ${label(picked.at(-1))}`;
  return picked.map(label).join(", ");
}

// Days + hours → "Sat – Wed · 5:00 PM – 9:00 PM"
export function formatAvailability({ availableDays, availableFrom, availableTo }) {
  const hours = availableFrom && availableTo ? `${formatTime(availableFrom)} – ${formatTime(availableTo)}` : formatTime(availableFrom || availableTo);
  return [formatDays(availableDays), hours].filter(Boolean).join(" · ");
}

// Implementation steps → { done: 2, total: 4 }, or null when there are none. (The API counts the same way.)
export function countSteps(steps = []) {
  if (steps.length === 0) return null;
  return { done: steps.filter((step) => step.done).length, total: steps.length };
}

// 1500 → "৳1,500"
export const formatTaka = (amount) => (amount === null || amount === undefined ? "" : `৳${new Intl.NumberFormat("en-IN").format(amount)}`);

// +8801711234567 → +880 1711-234567
export function formatPhone(phone) {
  const match = /^\+880(\d{4})(\d{6})$/.exec(phone ?? "");
  return match ? `+880 ${match[1]}-${match[2]}` : (phone ?? "");
}

// "Dr. Tanvir Ahmed" → "TA"
export function initials(name = "") {
  const parts = name.replace(/^dr\.?\s+/i, "").replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)[0] : "");
  return letters.toUpperCase() || "?";
}

export const firstName = (name = "") => name.trim().split(/\s+/)[0] ?? "";

// Who is on a form, in one line: "by Wakil · with Rafi, Sumi". `showSubmitter` is false for a
// marketing person's own lists, where "by me" would be noise. Empty when there is nothing to say.
export function peopleLine({ createdBy, assignedTo = [] }, { showSubmitter = true } = {}) {
  const parts = [];
  if (showSubmitter && createdBy) parts.push(`by ${createdBy.name}`);
  if (assignedTo.length) parts.push(`with ${assignedTo.map((person) => person.name).join(", ")}`);
  return parts.join(" · ");
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

// The dashboard with this doctor's or pharmacy's visit open: /?month=…&day=…&type=…&id=…
export function dashboardLink(record) {
  const day = dayKey(record.visitDate);
  return `/?month=${day.slice(0, 7)}&day=${day}&type=${record.type}&id=${record.id}`;
}

// For WhatsApp links: +8801711234567 → 8801711234567
export const whatsappNumber = (phone) => (phone ?? "").replace(/\D/g, "");
