import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const orgCount = await prisma.organization.count();
        const templateCount = await prisma.massScheduleTemplate.count();
        const massCount = await prisma.mass.count();

        const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });

    } catch (error) {
        console.error("Database diagnostic failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
