import {
  Category,
  RelatedSystem,
  RequesterUser,
  Ticket,
  Attachment,
  Priority,
  PaginatedResponse,
} from "./types/index.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export interface CreateTicketPayload {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: Priority;
}

export interface GetTicketsParams {
  requesterId: number;
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

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(payload.requesterId),
    },
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

export async function getTickets(params: GetTicketsParams): Promise<PaginatedResponse<Ticket>> {
  const query = new URLSearchParams();
  query.set("requesterId", String(params.requesterId));

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

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    headers: {
      "x-requester-id": String(params.requesterId),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to retrieve tickets");
  }
  return json;
}

export async function getTicketDetail(ticketId: number, requesterId: number): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
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
  requesterId: number
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("requesterId", String(requesterId));

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "x-requester-id": String(requesterId),
    },
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
  requesterId: number
): Promise<Attachment> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/soft-remove`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(requesterId),
    },
    body: JSON.stringify({ removalReason, requesterId }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to soft-remove attachment");
  }
  return json.data;
}

export function getDownloadUrl(attachmentId: number, requesterId: number): string {
  return `${API_URL}/api/attachments/${attachmentId}/download?requesterId=${requesterId}`;
}

export { API_URL };
export type { Category, RelatedSystem, RequesterUser, Ticket, Attachment, Priority, PaginatedResponse };
