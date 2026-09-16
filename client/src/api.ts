import {
  Category,
  RelatedSystem,
  RequesterUser,
  User,
  Ticket,
  Attachment,
  Priority,
  PaginatedResponse,
  StaffQueueResponse,
  StaffQueueFilterParams,
} from "./types/index.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export interface CreateTicketPayload {
  requesterId?: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: Priority;
}

export interface GetTicketsParams {
  requesterId?: number;
  search?: string;
  categoryId?: number | "";
  requestedPriority?: string;
  itPriority?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Authentication APIs (Lab 3)
// ---------------------------------------------------------------------------
export async function apiLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to sign in");
  }
  return json.data;
}

export async function apiGetMe(token?: string | null): Promise<User> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Unable to retrieve session");
  }
  return json.data;
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  token?: string | null
): Promise<{ mustChangePassword: boolean }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update password");
  }
  return json.data;
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// ---------------------------------------------------------------------------
// Health & Reference Data
// ---------------------------------------------------------------------------
export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const catRes = await fetch(`${API_URL}/api/categories`);
  if (!catRes.ok) {
    throw new Error("Unable to retrieve categories");
  }

  const categories: Category[] = await catRes.json();
  return { online: true, categories };
}

export async function getRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) {
    throw new Error("Unable to retrieve development requesters");
  }
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) {
    throw new Error("Unable to retrieve categories");
  }
  return res.json();
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) {
    throw new Error("Unable to retrieve related systems");
  }
  return res.json();
}

export async function createTicket(payload: CreateTicketPayload, token?: string | null): Promise<Ticket> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (payload.requesterId) {
    headers["x-requester-id"] = String(payload.requesterId);
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorMsg = json.details
      ? Object.values(json.details).join(". ")
      : json.error || "Failed to create ticket";
    throw new Error(errorMsg);
  }
  return json.data;
}

export async function getTickets(params: GetTicketsParams, token?: string | null): Promise<PaginatedResponse<Ticket>> {
  const query = new URLSearchParams();
  if (params.requesterId) {
    query.set("requesterId", String(params.requesterId));
  }
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.categoryId) {
    query.set("categoryId", String(params.categoryId));
  }
  if (params.requestedPriority) {
    query.set("requestedPriority", params.requestedPriority);
  }
  if (params.itPriority) {
    query.set("itPriority", params.itPriority);
  }
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    query.set("sortOrder", params.sortOrder);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const headers: Record<string, string> = {};
  if (params.requesterId) {
    headers["x-requester-id"] = String(params.requesterId);
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    headers,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to retrieve tickets");
  }
  return json;
}

export async function getTicketDetail(ticketId: number, requesterId?: number, token?: string | null): Promise<Ticket> {
  const headers: Record<string, string> = {};
  if (requesterId) {
    headers["x-requester-id"] = String(requesterId);
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to load ticket details");
  }
  return json.data;
}

export async function uploadAttachment(
  ticketId: number,
  file: File,
  requesterId?: number,
  token?: string | null
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  if (requesterId) {
    formData.append("requesterId", String(requesterId));
  }

  const headers: Record<string, string> = {};
  if (requesterId) {
    headers["x-requester-id"] = String(requesterId);
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to upload attachment");
  }
  return json.data;
}

export async function softRemoveAttachment(
  attachmentId: number,
  removalReason: string,
  requesterId?: number,
  token?: string | null
): Promise<Attachment> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (requesterId) {
    headers["x-requester-id"] = String(requesterId);
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/soft-remove`, {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify({ removalReason, requesterId }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to soft-remove attachment");
  }
  return json.data;
}

export function getDownloadUrl(attachmentId: number, requesterId?: number): string {
  const query = requesterId ? `?requesterId=${requesterId}` : "";
  return `${API_URL}/api/attachments/${attachmentId}/download${query}`;
}

export async function apiGetStaffTickets(
  params: StaffQueueFilterParams = {},
  token?: string | null
): Promise<StaffQueueResponse> {
  const query = new URLSearchParams();
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.category && params.category !== "ALL") {
    query.set("category", params.category);
  }
  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.requestedPriority && params.requestedPriority !== "ALL") {
    query.set("requestedPriority", params.requestedPriority);
  }
  if (params.itPriority && params.itPriority !== "ALL") {
    query.set("itPriority", params.itPriority);
  }
  if (params.ownerId && params.ownerId !== "ALL") {
    query.set("ownerId", params.ownerId);
  }
  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    query.set("sortOrder", params.sortOrder);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/staff/tickets?${query.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || "Failed to fetch staff tickets");
  }
  return json;
}

export { API_URL };
export type {
  Category,
  RelatedSystem,
  RequesterUser,
  User,
  Ticket,
  Attachment,
  Priority,
  PaginatedResponse,
  StaffQueueResponse,
  StaffQueueFilterParams,
};
