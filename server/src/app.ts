import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { getPrisma } from "./prisma.js";
import { Priority, TicketStatus } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage & configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed types: JPG, PNG, WEBP, PDF"));
    }
  },
});

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
// Development Requesters (Active only)
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
// Related Systems list
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
// Create Ticket (POST /api/tickets)
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
// My Tickets Query (GET /api/tickets)
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
            select: {
              id: true,
              originalFilename: true,
              fileSize: true,
              mimeType: true,
              isRemoved: true,
              removalReason: true,
              removedAt: true,
              createdAt: true,
            },
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

// ---------------------------------------------------------------------------
// Lab 2 Issue 5 — Ticket Detail (GET /api/tickets/:id)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = Number(req.query.requesterId || requesterHeader);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, error: "Invalid ticket ID" });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        attachments: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            ticketId: true,
            originalFilename: true,
            fileSize: true,
            mimeType: true,
            isRemoved: true,
            removalReason: true,
            removedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    // Multi-tenant ownership guard: ensure requester owns this ticket
    if (requesterId && ticket.requesterId !== requesterId) {
      res.status(403).json({
        success: false,
        error: "You do not have permission to view this ticket",
      });
      return;
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Unable to retrieve ticket details" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 Issue 5 — Upload Attachment (POST /api/tickets/:id/attachments)
// ---------------------------------------------------------------------------
app.post(
  "/api/tickets/:id/attachments",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ success: false, error: "File size exceeds 5 MB limit" });
          return;
        }
        res.status(400).json({ success: false, error: err.message });
        return;
      } else if (err) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const ticketId = Number(req.params.id);
      const requesterHeader = req.headers["x-requester-id"];
      const requesterId = Number(req.body.requesterId || requesterHeader);

      if (isNaN(ticketId)) {
        res.status(400).json({ success: false, error: "Invalid ticket ID" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: "No file uploaded" });
        return;
      }

      // Check ticket ownership
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: "Ticket not found" });
        return;
      }

      if (requesterId && ticket.requesterId !== requesterId) {
        res.status(403).json({ success: false, error: "You do not have permission to attach files to this ticket" });
        return;
      }

      // Check max 5 active attachments limit
      const activeCount = await prisma.attachment.count({
        where: { ticketId, isRemoved: false },
      });

      if (activeCount >= 5) {
        res.status(400).json({
          success: false,
          error: "Maximum limit of 5 active attachments reached for this ticket",
        });
        return;
      }

      // Save attachment
      const attachment = await prisma.attachment.create({
        data: {
          ticketId,
          originalFilename: req.file.originalname,
          storedFilename: req.file.filename,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          isRemoved: false,
        },
        select: {
          id: true,
          ticketId: true,
          originalFilename: true,
          fileSize: true,
          mimeType: true,
          isRemoved: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Unable to upload attachment" });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 2 Issue 5 — Download Attachment (GET /api/attachments/:id/download)
// ---------------------------------------------------------------------------
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const attachmentId = Number(req.params.id);
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = Number(req.query.requesterId || requesterHeader);

    if (isNaN(attachmentId)) {
      res.status(400).json({ success: false, error: "Invalid attachment ID" });
      return;
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      res.status(404).json({ success: false, error: "Attachment not found" });
      return;
    }

    // Ownership check
    if (requesterId && attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ success: false, error: "You do not have permission to download this attachment" });
      return;
    }

    // Block download for soft-removed attachments (BR-12 / AC-10)
    if (attachment.isRemoved) {
      res.status(410).json({
        success: false,
        error: "This attachment has been removed and cannot be downloaded.",
      });
      return;
    }

    if (!fs.existsSync(attachment.filePath)) {
      res.status(404).json({ success: false, error: "File binary not found on server storage" });
      return;
    }

    res.download(attachment.filePath, attachment.originalFilename);
  } catch (error) {
    res.status(500).json({ success: false, error: "Unable to download attachment" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 Issue 5 — Soft Remove Attachment (PATCH /api/attachments/:id/soft-remove)
// ---------------------------------------------------------------------------
app.patch("/api/attachments/:id/soft-remove", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const attachmentId = Number(req.params.id);
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = Number(req.body.requesterId || requesterHeader);
    const { removalReason } = req.body;

    if (isNaN(attachmentId)) {
      res.status(400).json({ success: false, error: "Invalid attachment ID" });
      return;
    }

    if (!removalReason || typeof removalReason !== "string" || removalReason.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: "A valid removal reason (minimum 3 characters) is required",
      });
      return;
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      res.status(404).json({ success: false, error: "Attachment not found" });
      return;
    }

    // Ownership check
    if (requesterId && attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ success: false, error: "You do not have permission to remove this attachment" });
      return;
    }

    // Apply soft removal
    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removalReason: removalReason.trim(),
        removedAt: new Date(),
        removedByRequester: requesterId || attachment.ticket.requesterId,
      },
      select: {
        id: true,
        ticketId: true,
        originalFilename: true,
        fileSize: true,
        mimeType: true,
        isRemoved: true,
        removalReason: true,
        removedAt: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Unable to soft-remove attachment" });
  }
});

export default app;
