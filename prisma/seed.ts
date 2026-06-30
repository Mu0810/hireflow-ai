import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@hireflow.ai" },
    update: {},
    create: {
      email: "admin@hireflow.ai",
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
