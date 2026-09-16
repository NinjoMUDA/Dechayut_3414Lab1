import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, Priority, TicketStatus } from "@prisma/client";

async function main() {
  const prisma = getPrisma();

  // 1. Categories
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Related Systems
  const relatedSystems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Default seed password for all local testing accounts
  const defaultPasswordHash = bcrypt.hashSync("Password123!", 10);

  // 3. Seed Users (Requesters, IT Staff, Administrators)
  const users = [
    // Requesters (Active & Inactive & First-login)
    {
      name: "Jennifer Anderson",
      email: "jennifer.anderson@example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "David Lee",
      email: "david.lee@example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Emily Davis",
      email: "emily.davis@example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Robert Wilson",
      email: "robert.wilson@example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: true, // For testing mandatory first-login password change
    },
    {
      name: "Alex Taylor (Inactive)",
      email: "alex.taylor.inactive@example.com",
      role: Role.REQUESTER,
      isActive: false,
      mustChangePassword: false,
    },

    // IT Staff (3 active, 1 inactive)
    {
      name: "Michael Brown",
      email: "michael.brown@toktickit.com",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Lisa Martinez",
      email: "lisa.martinez@toktickit.com",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Kevin Patel",
      email: "kevin.patel@toktickit.com",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "James Green (Inactive Staff)",
      email: "james.green.inactive@toktickit.com",
      role: Role.IT_STAFF,
      isActive: false,
      mustChangePassword: false,
    },

    // Administrators
    {
      name: "John Smith",
      email: "john.smith@toktickit.com",
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Admin Support",
      email: "admin.support@toktickit.com",
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: defaultPasswordHash,
      },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: defaultPasswordHash,
      },
    });
  }

  // 4. Seed sample tickets distributed across requesters and IT staff
  const reqJennifer = await prisma.user.findUnique({ where: { email: "jennifer.anderson@example.com" } });
  const reqDavid = await prisma.user.findUnique({ where: { email: "david.lee@example.com" } });
  const staffMichael = await prisma.user.findUnique({ where: { email: "michael.brown@toktickit.com" } });
  const staffLisa = await prisma.user.findUnique({ where: { email: "lisa.martinez@toktickit.com" } });
  const catHardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const catNetwork = await prisma.category.findUnique({ where: { name: "Network" } });
  const sysLaptop = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });
  const sysWifi = await prisma.relatedSystem.findUnique({ where: { name: "Campus Wi-Fi" } });

  if (reqJennifer && catHardware && sysLaptop) {
    const tkt1 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000001" },
      update: {
        ticketOwnerId: staffMichael?.id,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.IN_PROGRESS,
      },
      create: {
        ticketNumber: "TKT-2026-000001",
        requesterId: reqJennifer.id,
        categoryId: catHardware.id,
        relatedSystemId: sysLaptop.id,
        summary: "Laptop battery drains quickly after Windows update",
        description: "My corporate laptop battery now only lasts for 45 minutes after the latest system patch.",
        requestedPriority: Priority.MEDIUM,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.IN_PROGRESS,
        ticketOwnerId: staffMichael?.id,
      },
    });

    // Seed sample Public Comment
    const commentCount = await prisma.publicComment.count({ where: { ticketId: tkt1.id } });
    if (commentCount === 0) {
      await prisma.publicComment.create({
        data: {
          ticketId: tkt1.id,
          authorId: reqJennifer.id,
          content: "Thank you for looking into this. I am available for device diagnostic any time today.",
        },
      });
      if (staffMichael) {
        await prisma.publicComment.create({
          data: {
            ticketId: tkt1.id,
            authorId: staffMichael.id,
            content: "We have received your ticket and ordered a replacement battery pack.",
          },
        });
      }
    }

    // Seed sample Internal Note (Staff only)
    const noteCount = await prisma.internalNote.count({ where: { ticketId: tkt1.id } });
    if (noteCount === 0 && staffMichael) {
      await prisma.internalNote.create({
        data: {
          ticketId: tkt1.id,
          authorId: staffMichael.id,
          content: "Hardware diagnostic shows cycle count 980. Covered under enterprise warranty. ETA tomorrow.",
        },
      });
    }
  }

  if (reqDavid && catNetwork && sysWifi) {
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000002" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000002",
        requesterId: reqDavid.id,
        categoryId: catNetwork.id,
        relatedSystemId: sysWifi.id,
        summary: "Unable to authenticate on Campus Wi-Fi in Building 3",
        description: "Credentials are rejected repeatedly when trying to connect to KMUTT-Secure in Lecture Hall 301.",
        requestedPriority: Priority.HIGH,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.OPEN,
        ticketOwnerId: staffLisa?.id,
      },
    });
  }

  console.log("Lab 3 seed complete: seeded categories, systems, users with bcrypt passwords, and tickets.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
