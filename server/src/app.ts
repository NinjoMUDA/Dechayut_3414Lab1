import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma.js";
import { Priority, TicketStatus, Role } from "@prisma/client";
import {
  authenticateToken,
  optionalAuthenticate,
  generateToken,
  requireRole,
  AuthRequest,
} from "./auth.js";

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

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Authentication Endpoints (Lab 3)
// ---------------------------------------------------------------------------

// POST /api/auth/login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact your administrator.",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const token = generateToken(authUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: authUser,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred during authentication",
    });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "User session is no longer active",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve user session",
    });
  }
});

// POST /api/auth/change-password
app.post("/api/auth/change-password", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: "New password and confirmation do not match",
      });
      return;
    }

    // Complexity: at least 8 chars, at least 1 upper, 1 lower, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
      });
      return;
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update password",
    });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// ---------------------------------------------------------------------------
// Development Requesters (Active only — backward compatibility)
// ---------------------------------------------------------------------------
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().user.findMany({
      where: { isActive: true, role: Role.REQUESTER },
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
app.post("/api/tickets", optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = req.user ? req.user.id : Number(req.body.requesterId || requesterHeader);
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;

    const validationErrors: Record<string, string> = {};

    // Validate Requester
    if (!requesterId || isNaN(requesterId)) {
      validationErrors.requesterId = "Requester ID is required";
    } else {
      const requester = await prisma.user.findUnique({
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
            itPriority: priorityValue as Priority,
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
app.get("/api/tickets", optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = (req.user && req.user.role === Role.REQUESTER)
      ? req.user.id
      : Number(req.query.requesterId || requesterHeader);

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
app.get("/api/tickets/:id", optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = req.user ? req.user.id : Number(req.query.requesterId || requesterHeader);

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
        ticketOwner: { select: { id: true, name: true, email: true } },
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

    // Role and ownership check
    if (req.user) {
      if (req.user.role === Role.REQUESTER && ticket.requesterId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: "You do not have permission to view this ticket",
        });
        return;
      }
    } else if (requesterId && ticket.requesterId !== requesterId) {
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

// ---------------------------------------------------------------------------
// IT Staff Ticket Queue (GET /api/staff/tickets)
// ---------------------------------------------------------------------------
app.get(
  "/api/staff/tickets",
  authenticateToken,
  requireRole([Role.IT_STAFF, Role.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const {
        search,
        category,
        status,
        requestedPriority,
        itPriority,
        ownerId,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = "1",
        pageSize = "10",
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(pageSize as string, 10) || 10));
      const skip = (pageNum - 1) * limit;

      const where: any = {};

      // Search (ticketNumber or summary)
      if (search && typeof search === "string" && search.trim() !== "") {
        const queryStr = search.trim();
        where.OR = [
          { ticketNumber: { contains: queryStr, mode: "insensitive" } },
          { summary: { contains: queryStr, mode: "insensitive" } },
        ];
      }

      // Category filter (by ID)
      if (category && typeof category === "string" && category !== "ALL" && category !== "") {
        const catId = parseInt(category, 10);
        if (!isNaN(catId)) {
          where.categoryId = catId;
        }
      }

      // Status filter
      if (status && typeof status === "string" && status !== "ALL" && status !== "") {
        where.currentStatus = status as TicketStatus;
      }

      // Requested Priority filter
      if (requestedPriority && typeof requestedPriority === "string" && requestedPriority !== "ALL" && requestedPriority !== "") {
        where.requestedPriority = requestedPriority as Priority;
      }

      // IT Priority filter
      if (itPriority && typeof itPriority === "string" && itPriority !== "ALL" && itPriority !== "") {
        if (itPriority === "NONE" || itPriority === "UNASSIGNED") {
          where.itPriority = null;
        } else {
          where.itPriority = itPriority as Priority;
        }
      }

      // Owner filter: "unassigned", "me", or specific staff user ID
      if (ownerId && typeof ownerId === "string" && ownerId !== "ALL" && ownerId !== "") {
        if (ownerId === "unassigned") {
          where.ticketOwnerId = null;
        } else if (ownerId === "me" && req.user) {
          where.ticketOwnerId = req.user.id;
        } else {
          const parsedOwnerId = parseInt(ownerId, 10);
          if (!isNaN(parsedOwnerId)) {
            where.ticketOwnerId = parsedOwnerId;
          }
        }
      }

      // Sorting
      const validSortFields = ["ticketNumber", "createdAt", "updatedAt"];
      const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt";
      const sortDir = (sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc";
      const orderBy = { [sortField]: sortDir };

      const [total, tickets] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          include: {
            category: { select: { id: true, name: true } },
            relatedSystem: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true, email: true } },
            ticketOwner: { select: { id: true, name: true, email: true } },
          },
          orderBy,
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      res.json({
        success: true,
        data: tickets,
        pagination: {
          total,
          page: pageNum,
          pageSize: limit,
          totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Unable to retrieve staff tickets" });
    }
  }
);

// ---------------------------------------------------------------------------
// Active IT Staff & Admins for Ticket Assignment (GET /api/staff/users)
// ---------------------------------------------------------------------------
app.get(
  "/api/staff/users",
  authenticateToken,
  requireRole(Role.IT_STAFF, Role.ADMIN),
  async (_req: AuthRequest, res: Response) => {
    try {
      const staffUsers = await getPrisma().user.findMany({
        where: {
          isActive: true,
          role: { in: [Role.IT_STAFF, Role.ADMIN] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        data: staffUsers,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Unable to retrieve staff users" });
    }
  }
);

// ---------------------------------------------------------------------------
// Update Ticket Operational Fields (PATCH /api/staff/tickets/:id)
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  IN_PROGRESS: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  WAITING_FOR_REQUESTER: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  RESOLVED: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  CLOSED: [TicketStatus.REOPENED],
  REOPENED: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  CANCELLED: [TicketStatus.REOPENED],
  PENDING: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
};

app.patch(
  "/api/staff/tickets/:id",
  authenticateToken,
  requireRole(Role.IT_STAFF, Role.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const ticketId = Number(req.params.id);

      if (isNaN(ticketId)) {
        res.status(400).json({ success: false, error: "Invalid ticket ID" });
        return;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: "Ticket not found" });
        return;
      }

      const { ticketOwnerId, itPriority, currentStatus, resolutionSummary } = req.body;
      const updateData: any = {};

      // 1. Ticket Ownership validation
      if (ticketOwnerId !== undefined) {
        if (ticketOwnerId === null || ticketOwnerId === "unassigned") {
          updateData.ticketOwnerId = null;
        } else {
          const ownerIdNum = Number(ticketOwnerId);
          if (isNaN(ownerIdNum)) {
            res.status(400).json({ success: false, error: "Invalid ticket owner ID" });
            return;
          }

          const owner = await prisma.user.findUnique({
            where: { id: ownerIdNum },
          });

          if (!owner || !owner.isActive || (owner.role !== Role.IT_STAFF && owner.role !== Role.ADMIN)) {
            res.status(400).json({
              success: false,
              error: "Ticket owner must be an active user with role IT_STAFF or ADMIN",
            });
            return;
          }

          updateData.ticketOwnerId = ownerIdNum;
        }
      }

      // 2. IT Priority validation
      if (itPriority !== undefined) {
        const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
        const prioStr = String(itPriority).toUpperCase();
        if (!validPriorities.includes(prioStr)) {
          res.status(400).json({
            success: false,
            error: "IT Priority must be one of LOW, MEDIUM, HIGH, URGENT",
          });
          return;
        }
        updateData.itPriority = prioStr as Priority;
      }

      // 3. Status Transition validation (BR-14)
      if (currentStatus !== undefined && currentStatus !== ticket.currentStatus) {
        const targetStatus = String(currentStatus).toUpperCase() as TicketStatus;
        const allowed = VALID_TRANSITIONS[ticket.currentStatus] || [];

        if (!allowed.includes(targetStatus)) {
          res.status(400).json({
            success: false,
            error: `Invalid status transition from ${ticket.currentStatus} to ${targetStatus}`,
          });
          return;
        }

        updateData.currentStatus = targetStatus;
      }

      // 4. Resolution summary
      if (resolutionSummary !== undefined) {
        updateData.resolutionSummary = typeof resolutionSummary === "string" ? resolutionSummary.trim() : null;
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          ticketOwner: { select: { id: true, name: true, email: true } },
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Unable to update ticket operational fields" });
    }
  }
);

// ---------------------------------------------------------------------------
// Requester Resolution Indicator (PATCH /api/tickets/:id/resolve)
// ---------------------------------------------------------------------------
app.patch("/api/tickets/:id/resolve", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, error: "Invalid ticket ID" });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    // Role check: requester must own ticket, or user is staff/admin
    if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.id) {
      res.status(403).json({ success: false, error: "You do not have permission to update this ticket" });
      return;
    }

    const { requesterResolved } = req.body;
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { requesterResolved: Boolean(requesterResolved) },
      select: {
        id: true,
        ticketNumber: true,
        requesterResolved: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Unable to update resolution indicator" });
  }
});

// ---------------------------------------------------------------------------
// Public Comments (GET & POST /api/tickets/:id/comments)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id/comments", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, error: "Invalid ticket ID" });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    // Requester access isolation
    if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Unable to retrieve comments" });
  }
});

app.post("/api/tickets/:id/comments", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, error: "Invalid ticket ID" });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    // Requester access isolation
    if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0 || content.trim().length > 2000) {
      res.status(400).json({
        success: false,
        error: "Comment content is required and must be between 1 and 2000 characters",
      });
      return;
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Unable to create comment" });
  }
});

// ---------------------------------------------------------------------------
// Internal Notes (GET & POST /api/tickets/:id/notes — IT_STAFF & ADMIN ONLY)
// ---------------------------------------------------------------------------
app.get(
  "/api/tickets/:id/notes",
  authenticateToken,
  requireRole(Role.IT_STAFF, Role.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const ticketId = Number(req.params.id);

      if (isNaN(ticketId)) {
        res.status(400).json({ success: false, error: "Invalid ticket ID" });
        return;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: "Ticket not found" });
        return;
      }

      const notes = await prisma.internalNote.findMany({
        where: { ticketId },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      res.json({
        success: true,
        data: notes,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Unable to retrieve internal notes" });
    }
  }
);

app.post(
  "/api/tickets/:id/notes",
  authenticateToken,
  requireRole(Role.IT_STAFF, Role.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      const prisma = getPrisma();
      const ticketId = Number(req.params.id);

      if (isNaN(ticketId)) {
        res.status(400).json({ success: false, error: "Invalid ticket ID" });
        return;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: "Ticket not found" });
        return;
      }

      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0 || content.trim().length > 2000) {
        res.status(400).json({
          success: false,
          error: "Note content is required and must be between 1 and 2000 characters",
        });
        return;
      }

      const note = await prisma.internalNote.create({
        data: {
          ticketId,
          authorId: req.user!.id,
          content: content.trim(),
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Unable to create internal note" });
    }
  }
);

export default app;
