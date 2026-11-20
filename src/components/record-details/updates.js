// Small helpers for the lines of a record's history (StatusCard.jsx) and the "Delete update" dialog
// (DeleteUpdateDialog.jsx). Each line is one update: the form being submitted or edited, or a
// status update ("Save update").

import { STATUSES } from "@/lib/constants";
import { formatDate, formatTimeRange } from "@/lib/format";

// The notes the API writes itself; any other note is the one a person typed.
const ACTIONS = { "Form submitted": "Form submitted", "Form updated": "Form edited" };

// What the update was: "Form submitted", "Form edited" or "Updated".
export const updateAction = (update) => ACTIONS[update.note] ?? "Updated";

// The note a person typed with the update, or "".
export const typedNote = (update) => (ACTIONS[update.note] ? "" : (update.note ?? ""));

// When the update was made: "Wed 4 Nov, 2:15 PM" (with the year when it isn't this year).
export function madeAt(at, now = new Date()) {
  const thisYear = formatDate(at, "yyyy") === formatDate(now, "yyyy");
  return formatDate(at, thisYear ? "EEE d MMM, h:mm a" : "d MMM yyyy, h:mm a");
}

// "Form submitted by Wakil Israk Abir" (madeAt says when).
export const madeBy = (update) => `${updateAction(update)} by ${update.by?.name ?? "someone"}`;

// "Wed 4 Nov, 10:00 – 11:30 AM"
export const visitWhen = ({ visitDate, visitEndDate }) => `${formatDate(visitDate, "EEE d MMM")}, ${formatTimeRange(visitDate, visitEndDate)}`;

export const statusLabel = (status) => STATUSES[status]?.label ?? status;
