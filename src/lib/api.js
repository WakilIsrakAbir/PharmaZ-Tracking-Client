import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// The one place the browser talks to the API (through this site's /api rewrite).
// Every call returns the API's { data, meta } body, or throws an ApiError whose
// message is ready to show to people.
// ---------------------------------------------------------------------------
class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? "We couldn't reach the server. Please check your connection and try again.");
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "NETWORK_ERROR";
    this.fields = body?.error?.fields ?? {};
  }
}

export async function api(path, { method = "GET", body, signal } = {}) {
  const isJson = body !== undefined && !(body instanceof FormData);
  let response;

  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      signal,
      headers: isJson ? { "Content-Type": "application/json" } : undefined,
      body: isJson ? JSON.stringify(body) : body,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(0, null);
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // The session ended while using the app: go to sign-in, then come back here.
    // A full page load (not a client navigation) also clears what the last session left in memory.
    if (response.status === 401 && !path.startsWith("/auth/")) {
      const here = window.location.pathname + window.location.search;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is the point
      window.location.assign(`/login?next=${encodeURIComponent(here)}`);
    }
    throw new ApiError(response.status, payload);
  }
  return payload;
}

const pathFor = (type) => (type === "doctor" ? "/doctors" : "/pharmacies");

// "?status=setup&page=2" from { status: "setup", page: 2, search: "" }: empty values are left out.
function queryString(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== null && value !== undefined) query.set(key, value);
  }
  return query.toString();
}

// ---------------------------------------------------------------------------
// Doctors and pharmacies (the onboarding forms)
// ---------------------------------------------------------------------------

// One page of the list → { data: records, meta: { counts, page, limit, total, pages } }.
// `params` are the API's filters: search, status, assignee, createdBy, from, to, sort, page, limit.
// While a new page or filter loads, the previous answer stays on screen (no flash of empty list).
export function useRecords(type, params = {}) {
  return useQuery({
    queryKey: ["records", type, params],
    queryFn: () => api(`${pathFor(type)}?${queryString(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useRecord(type, id) {
  return useQuery({
    queryKey: ["record", type, id],
    queryFn: async () => (await api(`${pathFor(type)}/${id}`)).data,
    enabled: Boolean(type && id),
  });
}

// Everything on the calendar between two moments (ISO strings).
export function useCalendar(from, to) {
  return useQuery({
    queryKey: ["calendar", from, to],
    queryFn: async () => (await api(`/calendar?${new URLSearchParams({ from, to })}`)).data,
    placeholderData: keepPreviousData,
  });
}

// How many visits each month of a year has → [{ month: "2026-01", doctors, pharmacies, total }, …] (12 entries).
export function useMonthCounts(year) {
  return useQuery({
    queryKey: ["calendar", "months", year],
    queryFn: async () => (await api(`/calendar/months?year=${year}`)).data,
    placeholderData: keepPreviousData,
  });
}

// After any change: refresh lists and the calendar, and keep the changed record.
// Resolves with the API's whole answer, { data: record, meta }: `meta.email` says whether the
// emails to the assigned people went out (see emailSummary in lib/format.js).
function useRecordMutation(type, request) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => request(input),
    onSuccess: (payload) => {
      const record = payload?.data;
      if (record) queryClient.setQueryData(["record", type, record.id], record);
      queryClient.invalidateQueries({ queryKey: ["records", type] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

// Submit a new form ({ values }) or save an edited one ({ id, values }).
export const useSaveRecord = (type) =>
  useRecordMutation(type, ({ id, values }) => api(id ? `${pathFor(type)}/${id}` : pathFor(type), { method: id ? "PUT" : "POST", body: values }));

// { id, status, visitDate, note }
export const useUpdateStatus = (type) =>
  useRecordMutation(type, ({ id, ...change }) => api(`${pathFor(type)}/${id}/status`, { method: "PATCH", body: change }));

export const useDeleteRecord = (type) =>
  useRecordMutation(type, (id) => api(`${pathFor(type)}/${id}`, { method: "DELETE" }));

// Admins only: { id, assignees: [{ email, name }] } replaces who is assigned to a record
// (teammates by their address, or any outside address with a name).
export const useAssign = (type) =>
  useRecordMutation(type, ({ id, assignees }) => api(`${pathFor(type)}/${id}/assignees`, { method: "PUT", body: { assignees } }));

// ---------------------------------------------------------------------------
// Team accounts (admin)
// ---------------------------------------------------------------------------

// One page of the team → { data: users, meta: { counts: { active, deactivated }, page, limit, total, pages } }.
// `params`: search, role, active ("true" / "false"), sort, page, limit. Pass { limit: 100 } for the
// whole team at once (the people pickers). Only admins may ask; `enabled: false` skips the call.
export function useUsers(params = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => api(`/users?${queryString(params)}`),
    placeholderData: keepPreviousData,
    enabled,
  });
}

function useUserMutation(request) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => (await request(input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export const useCreateUser = () => useUserMutation((input) => api("/users", { method: "POST", body: input }));
export const useUpdateUser = () => useUserMutation(({ id, ...changes }) => api(`/users/${id}`, { method: "PATCH", body: changes }));
export const useResetPassword = () => useUserMutation((id) => api(`/users/${id}/reset-password`, { method: "POST" }));
