import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { Priority, TicketStatus } from "@prisma/client";

// Exported separately from app.listen() for Supertest
export const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Lab 2 — Development Requesters (Active only)
// ---------------------------------------------------------------------------
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requesterUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
      orderBy: { id: "asc" },
    });
    res.json(requesters);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve development requesters" });
  }
});

// ---------------------------------------------------------------------------
// Category list
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve categories" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Related Systems list
// ---------------------------------------------------------------------------
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.json(systems);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve related systems" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 Issue 3 — Create Ticket (POST /api/tickets)
// ---------------------------------------------------------------------------
app.post("/api/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = Number(req.body.requesterId || requesterHeader);
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;

    const validationErrors: Record<string, string> = {};

    // Validate Requester
    if (!requesterId || isNaN(requesterId)) {
      validationErrors.requesterId = "Requester ID is required";
    } else {
      const requester = await prisma.requesterUser.findUnique({
        where: { id: requesterId },
      });
      if (!requester || !requester.isActive) {
        validationErrors.requesterId = "Selected requester is invalid or inactive";
      }
    }

    // Validate Category
    if (!categoryId || isNaN(Number(categoryId))) {
      validationErrors.categoryId = "Category is required";
    } else {
      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });
      if (!category) {
        validationErrors.categoryId = "Selected category does not exist";
      }
    }

    // Validate Related System
    if (!relatedSystemId || isNaN(Number(relatedSystemId))) {
      validationErrors.relatedSystemId = "Related system is required";
    } else {
      const system = await prisma.relatedSystem.findUnique({
        where: { id: Number(relatedSystemId) },
      });
      if (!system) {
        validationErrors.relatedSystemId = "Selected related system does not exist";
      }
    }

    // Validate Summary (5 - 100 chars trimmed)
    if (!summary || typeof summary !== "string" || summary.trim().length < 5 || summary.trim().length > 100) {
      validationErrors.summary = "Summary is required and must be between 5 and 100 characters";
    }

    // Validate Description (10 - 2000 chars trimmed)
    if (!description || typeof description !== "string" || description.trim().length < 10 || description.trim().length > 2000) {
      validationErrors.description = "Description is required and must be between 10 and 2000 characters";
    }

    // Validate Priority
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const priorityValue = requestedPriority ? String(requestedPriority).toUpperCase() : "MEDIUM";
    if (!validPriorities.includes(priorityValue)) {
      validationErrors.requestedPriority = "Priority must be one of LOW, MEDIUM, HIGH, URGENT";
    }

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: validationErrors,
      });
      return;
    }

    // Generate unique Ticket Number (TKT-YYYY-XXXXXX)
    const currentYear = new Date().getFullYear();
    let ticket = null;
    let attempts = 0;
    
    while (attempts < 10) {
      try {
        const count = await prisma.ticket.count();
        const offset = attempts === 0 ? 1 : Math.floor(Math.random() * 900000) + 1;
        const nextSeq = String((count + offset) % 1000000).padStart(6, "0");
        const ticketNumber = `TKT-${currentYear}-${nextSeq}`;

        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            requesterId,
            categoryId: Number(categoryId),
            relatedSystemId: Number(relatedSystemId),
            summary: summary.trim(),
            description: description.trim(),
            requestedPriority: priorityValue as Priority,
            currentStatus: "NEW",
          },
          include: {
            requester: { select: { id: true, name: true, email: true } },
            category: { select: { id: true, name: true } },
            relatedSystem: { select: { id: true, name: true } },
          },
        });
        break;
      } catch (err: any) {
        if (err.code === "P2002" && attempts < 9) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Unable to create ticket",
    });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 Issue 4 — My Tickets Query (GET /api/tickets)
// ---------------------------------------------------------------------------
app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = Number(req.query.requesterId || requesterHeader);

    if (!requesterId || isNaN(requesterId)) {
      res.status(400).json({
        success: false,
        error: "Requester ID is required",
      });
      return;
    }

    const {
      search,
      categoryId,
      requestedPriority,
      itPriority,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Multi-tenant isolation: strictly filter by requesterId
    const where: any = {
      requesterId,
    };

    // Keyword Search (in ticketNumber or summary)
    if (search && typeof search === "string" && search.trim() !== "") {
      const query = search.trim();
      where.OR = [
        { ticketNumber: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
      ];
    }

    // Category Filter
    if (categoryId && !isNaN(Number(categoryId))) {
      where.categoryId = Number(categoryId);
    }

    // Priority Filters
    if (requestedPriority && typeof requestedPriority === "string") {
      where.requestedPriority = requestedPriority.toUpperCase() as Priority;
    }
    if (itPriority && typeof itPriority === "string") {
      where.itPriority = itPriority.toUpperCase() as Priority;
    }

    // Status Filter
    if (status && typeof status === "string") {
      where.currentStatus = status.toUpperCase() as TicketStatus;
    }

    // Validate sort field
    const validSortFields = ["ticketNumber", "createdAt", "updatedAt", "summary"];
    const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const sortDirection: "asc" | "desc" = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDirection },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          attachments: {
            where: { isRemoved: false },
            select: { id: true, originalFilename: true, fileSize: true, mimeType: true, isRemoved: true, createdAt: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Unable to retrieve tickets",
    });
  }
});

export default app;
