import { getPrisma } from "../src/prisma.js";

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

  // 3. Development Requesters (4 active, 1 inactive)
  const requesters = [
    {
      name: "Jennifer Anderson",
      email: "jennifer.anderson@example.com",
      isActive: true,
    },
    {
      name: "David Lee",
      email: "david.lee@example.com",
      isActive: true,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      isActive: true,
    },
    {
      name: "Michael Brown",
      email: "michael.brown@example.com",
      isActive: true,
    },
    {
      name: "Alex Taylor (Inactive)",
      email: "alex.taylor.inactive@example.com",
      isActive: false,
    },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: {
        name: req.name,
        isActive: req.isActive,
      },
      create: {
        name: req.name,
        email: req.email,
        isActive: req.isActive,
      },
    });
  }

  console.log("Seeded categories, related systems, and requesters successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
