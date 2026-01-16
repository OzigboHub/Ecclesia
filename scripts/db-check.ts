import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("Checking database connection...");
        const orgCount = await prisma.organization.count();
        console.log(`Connection successful. Found ${orgCount} organizations.`);

        console.log("Checking MassScheduleTemplate table...");
        const templateCount = await prisma.massScheduleTemplate.count();
        console.log(`Found ${templateCount} templates.`);

        console.log("Checking Mass table...");
        const massCount = await prisma.mass.count();
        console.log(`Found ${massCount} masses.`);

        const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
        console.log("Organizations:", orgs);

    } catch (error) {
        console.error("Database diagnostic failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
