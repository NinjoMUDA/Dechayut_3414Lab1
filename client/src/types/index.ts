export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "PENDING"
  | "WAITING_FOR_REQUESTER"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"
  | "CANCELLED";

export type Role = "REQUESTER" | "IT_STAFF" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface Attachment {
  id: number;
  ticketId: number;
  originalFilename: string;
  storedFilename?: string;
  filePath?: string;
  fileSize: number;
  mimeType: string;
  isRemoved: boolean;
  removalReason?: string | null;
  removedAt?: string | null;
  createdAt: string;
}

export interface PublicComment {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: Role;
  };
}

export interface InternalNote {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: Role;
  };
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  ticketOwnerId?: number | null;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: Priority;
  itPriority?: Priority | null;
  currentStatus: TicketStatus;
  requesterResolved?: boolean;
  resolutionSummary?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: User | RequesterUser;
  ticketOwner?: User | null;
  category?: Category;
  relatedSystem?: RelatedSystem;
  attachments?: Attachment[];
  comments?: PublicComment[];
  notes?: InternalNote[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface StaffQueuePagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StaffQueueResponse {
  success: boolean;
  data: Ticket[];
  pagination: StaffQueuePagination;
}

export interface StaffQueueFilterParams {
  search?: string;
  category?: string;
  status?: string;
  requestedPriority?: string;
  itPriority?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

