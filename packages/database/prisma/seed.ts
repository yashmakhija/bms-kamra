import { PrismaClient } from ".prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean the database
  await prisma.otpCode.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleaned.");

  // Create a test user
  const userPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      password: userPassword,
      emailVerified: new Date(),
    },
  });
  console.log("Created test user:", user.id);

  // Create an admin user (SUPER_ADMIN)
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      emailVerified: new Date(),
      isAdmin: true,
    },
  });

  // Add admin role
  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Created admin user:", adminUser.id);

  // Create a regular editor admin
  const editorPassword = await bcrypt.hash("Editor123!", 10);
  const editorUser = await prisma.user.create({
    data: {
      name: "Editor User",
      email: "editor@example.com",
      password: editorPassword,
      emailVerified: new Date(),
      isAdmin: true,
    },
  });

  // Add editor role
  await prisma.admin.create({
    data: {
      userId: editorUser.id,
      role: "EDITOR",
    },
  });

  console.log("Created editor user:", editorUser.id);

  // Additional seed data can be added here
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
