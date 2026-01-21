import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("Inspecting society table columns...");
        const columns: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'society';
        `;
        console.log("Columns in society table:");
        console.table(columns);

        console.log("\nInspecting Payment table columns...");
        const paymentColumns: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Payment';
        `;
        console.log("Columns in Payment table:");
        console.table(paymentColumns);

    } catch (error) {
        console.error("SQL inspection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
