import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const columns: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'Society';
        `;

    const paymentColumns: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'Payment';
        `;
  } catch (error) {
    console.error("SQL inspection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
