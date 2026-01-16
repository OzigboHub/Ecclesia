import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("Inspecting PiousOrganization table columns...");
        const columns: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'PiousOrganization';
        `;
        console.log("Columns in PiousOrganization table:");
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
