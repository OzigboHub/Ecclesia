import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("Querying Society...");
        const societies = await prisma.society.findMany({
            take: 1
        });
        console.log("Result:", societies);
    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
