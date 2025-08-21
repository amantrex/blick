import { PrismaClient } from "../src/generated/prisma";
import { hash } from "bcrypt";

const db = new PrismaClient();

async function main() {
  const tenant = await db.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: { 
      name: "Demo School", 
      slug: "demo",
      companyType: "SCHOOL"
    },
  });

  const adminEmail = "admin@demo.local";
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Demo Admin",
      role: "ADMIN",
      tenantId: tenant.id,
      passwordHash: await hash("password", 10),
    },
  });

  await db.contact.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: "+919999999999" } },
    update: {},
    create: { 
      tenantId: tenant.id, 
      name: "Parent One", 
      phone: "+919999999999", 
      email: "p1@example.com", 
      tags: ["grade-1"] 
    },
  });

  console.log("Seeded:", { tenant: tenant.slug, admin: admin.email });
}

main().finally(async () => {
  await db.$disconnect();
});


