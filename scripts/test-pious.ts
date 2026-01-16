import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("Querying PiousOrganization...");
        const orgs = await prisma.piousOrganization.findMany({
            take: 1
        });
        console.log("Result:", orgs);
    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
