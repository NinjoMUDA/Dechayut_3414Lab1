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
  const reqSarah = await prisma.user.findUnique({ where: { email: "sarah.johnson@example.com" } });
  const staffMichael = await prisma.user.findUnique({ where: { email: "michael.brown@toktickit.com" } });
  const staffLisa = await prisma.user.findUnique({ where: { email: "lisa.martinez@toktickit.com" } });
  const staffKevin = await prisma.user.findUnique({ where: { email: "kevin.patel@toktickit.com" } });
  const catHardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const catNetwork = await prisma.category.findUnique({ where: { name: "Network" } });
  const catSoftware = await prisma.category.findUnique({ where: { name: "Software" } });
  const sysLaptop = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });
  const sysWifi = await prisma.relatedSystem.findUnique({ where: { name: "Campus Wi-Fi" } });
  const sysVPN = await prisma.relatedSystem.findUnique({ where: { name: "VPN" } });

  // Ticket 1: IN_PROGRESS with multiple Actions Taken (and comments + notes)
  if (reqJennifer && catHardware && sysLaptop && staffMichael && staffLisa) {
    const tkt1 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000001" },
      update: {
        ticketOwnerId: staffMichael.id,
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
        ticketOwnerId: staffMichael.id,
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
      await prisma.publicComment.create({
        data: {
          ticketId: tkt1.id,
          authorId: staffMichael.id,
          content: "We have received your ticket and ordered a replacement battery pack.",
        },
      });
    }

    // Seed sample Internal Note (Staff only)
    const noteCount = await prisma.internalNote.count({ where: { ticketId: tkt1.id } });
    if (noteCount === 0) {
      await prisma.internalNote.create({
        data: {
          ticketId: tkt1.id,
          authorId: staffMichael.id,
          content: "Hardware diagnostic shows cycle count 980. Covered under enterprise warranty. ETA tomorrow.",
        },
      });
    }

    // Seed Actions Taken for Ticket 1 (Multiple actions, diverse performers - BR-02)
    const actionCount1 = await prisma.actionTaken.count({ where: { ticketId: tkt1.id } });
    if (actionCount1 === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: tkt1.id,
          actionDateTime: new Date("2026-09-24T09:30:00Z"),
          description: "Ran battery diagnostic utility via Lenovo Vantage diagnostic tool.",
          result: "Battery health reported at 42% of design capacity; cycle count 980.",
          performedById: staffMichael.id,
          followUpRequired: true,
          followUpNote: "Order replacement battery FRU #5B10W13930 and schedule swap.",
          attachmentNotes: "battery_diagnostic_log.html",
        },
      });

      // Different IT Staff performer (Lisa Martinez) under Ticket owned by Michael Brown
      await prisma.actionTaken.create({
        data: {
          ticketId: tkt1.id,
          actionDateTime: new Date("2026-09-24T14:15:00Z"),
          description: "Received replacement battery pack and installed into laptop chassis.",
          result: "Battery recognized in BIOS and calibrated; completed 1 full charge cycle.",
          performedById: staffLisa.id,
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      });
    }
  }

  // Ticket 2: OPEN with 1 Action Taken
  if (reqDavid && catNetwork && sysWifi && staffLisa) {
    const tkt2 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000002" },
      update: {
        ticketOwnerId: staffLisa.id,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.OPEN,
      },
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
        ticketOwnerId: staffLisa.id,
      },
    });

    const actionCount2 = await prisma.actionTaken.count({ where: { ticketId: tkt2.id } });
    if (actionCount2 === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: tkt2.id,
          actionDateTime: new Date("2026-09-24T11:00:00Z"),
          description: "Inspected RADIUS server access logs for user david.lee.",
          result: "Found stale certificate in authentication cache; flushed cache entry.",
          performedById: staffLisa.id,
          followUpRequired: true,
          followUpNote: "Test connection in Lecture Hall 301 on next campus visit.",
          attachmentNotes: "radius_error_log.txt",
        },
      });
    }
  }

  // Ticket 3: NEW, Unassigned, 0 Actions Taken (Demonstrating unassigned queue ticket & 0 actions)
  if (reqSarah && catSoftware && sysVPN) {
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000003" },
      update: {
        ticketOwnerId: null,
        currentStatus: TicketStatus.NEW,
      },
      create: {
        ticketNumber: "TKT-2026-000003",
        requesterId: reqSarah.id,
        categoryId: catSoftware.id,
        relatedSystemId: sysVPN.id,
        summary: "VPN client reports error 412 on macOS Sonoma",
        description: "After upgrading to macOS Sonoma, Cisco AnyConnect fails with handshake error 412.",
        requestedPriority: Priority.MEDIUM,
        itPriority: null,
        currentStatus: TicketStatus.NEW,
        ticketOwnerId: null,
      },
    });
  }

  // Ticket 4: WAITING_FOR_REQUESTER, 1 Action Taken
  if (reqJennifer && catSoftware && sysVPN && staffKevin) {
    const tkt4 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000004" },
      update: {
        ticketOwnerId: staffKevin.id,
        itPriority: Priority.MEDIUM,
        currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
      },
      create: {
        ticketNumber: "TKT-2026-000004",
        requesterId: reqJennifer.id,
        categoryId: catSoftware.id,
        relatedSystemId: sysVPN.id,
        summary: "VPN profile configuration for remote off-campus access",
        description: "Need VPN profile for remote research database access.",
        requestedPriority: Priority.LOW,
        itPriority: Priority.MEDIUM,
        currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
        ticketOwnerId: staffKevin.id,
      },
    });

    const actionCount4 = await prisma.actionTaken.count({ where: { ticketId: tkt4.id } });
    if (actionCount4 === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: tkt4.id,
          actionDateTime: new Date("2026-09-24T13:00:00Z"),
          description: "Generated and emailed new XML VPN profile package to requester.",
          result: "Email sent with profile installation instructions; awaiting user confirmation.",
          performedById: staffKevin.id,
          followUpRequired: true,
          followUpNote: "Follow up with user if no confirmation received within 48 hours.",
          attachmentNotes: "vpn_profile_config.xml",
        },
      });
    }
  }

  // Ticket 5: RESOLVED with Resolution Summary and Action Taken
  if (reqDavid && catHardware && sysLaptop && staffMichael) {
    const tkt5 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000005" },
      update: {
        ticketOwnerId: staffMichael.id,
        itPriority: Priority.MEDIUM,
        currentStatus: TicketStatus.RESOLVED,
        resolutionSummary: "Replaced faulty power adapter and verified stable charging.",
      },
      create: {
        ticketNumber: "TKT-2026-000005",
        requesterId: reqDavid.id,
        categoryId: catHardware.id,
        relatedSystemId: sysLaptop.id,
        summary: "Power adapter sparks when plugged into wall outlet",
        description: "The 65W USB-C charger produces small sparks and does not deliver steady power.",
        requestedPriority: Priority.HIGH,
        itPriority: Priority.MEDIUM,
        currentStatus: TicketStatus.RESOLVED,
        resolutionSummary: "Replaced faulty power adapter and verified stable charging.",
        ticketOwnerId: staffMichael.id,
      },
    });

    const actionCount5 = await prisma.actionTaken.count({ where: { ticketId: tkt5.id } });
    if (actionCount5 === 0) {
      await prisma.actionTaken.create({
        data: {
          ticketId: tkt5.id,
          actionDateTime: new Date("2026-09-23T15:00:00Z"),
          description: "Inspected frayed charging cord and tested with multimeter.",
          result: "Internal wire short detected; safely disposed of adapter and issued new 65W unit.",
          performedById: staffMichael.id,
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      });
    }
  }

  console.log("Lab 4 seed complete: seeded categories, systems, users with bcrypt passwords, tickets across major statuses, and Actions Taken.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
