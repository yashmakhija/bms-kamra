import { PrismaClient } from ".prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log("Starting admin account creation...");

    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
      include: { admin: true },
    });

    if (existingAdmin) {
      if (!existingAdmin.admin) {
        await prisma.admin.create({
          data: {
            userId: existingAdmin.id,
            role: "SUPER_ADMIN",
          },
        });

        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { isAdmin: true },
        });

        console.log(`User ${existingAdmin.email} upgraded to SUPER_ADMIN`);
      } else {
        console.log(
          `User ${existingAdmin.email} is already an admin with role: ${existingAdmin.admin.role}`
        );

        if (existingAdmin.admin.role !== "SUPER_ADMIN") {
          await prisma.admin.update({
            where: { userId: existingAdmin.id },
            data: { role: "SUPER_ADMIN" },
          });
          console.log(`Updated role to SUPER_ADMIN`);
        }
      }

      const hashedPassword = await bcrypt.hash("Admin123!", 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword },
      });
      console.log(`Reset password for ${existingAdmin.email}`);
    } else {
      const hashedPassword = await bcrypt.hash("Admin123!", 10);
      const adminUser = await prisma.user.create({
        data: {
          name: "Admin User",
          email: "admin@example.com",
          password: hashedPassword,
          emailVerified: new Date(),
          isAdmin: true,
        },
      });

      await prisma.admin.create({
        data: {
          userId: adminUser.id,
          role: "SUPER_ADMIN",
        },
      });

      console.log(`Created new admin user: ${adminUser.email}`);
    }

    console.log("\nAdmin account ready!");
    console.log("Email: admin@example.com");
    console.log("Password: Admin123!");
    console.log("Role: SUPER_ADMIN");
  } catch (error) {
    console.error("Error creating admin account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
