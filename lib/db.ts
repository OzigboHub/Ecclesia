import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

import WebSocket from 'ws';

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	// Prisma Client is generated to use engine type "client" in this project,
	// which requires providing a driver adapter.
	//
	// Important: this module must NOT be imported by Edge middleware.
	// Use an Edge-safe auth config for `proxy.ts`.
	neonConfig.webSocketConstructor = globalThis.WebSocket ?? WebSocket;

	const adapter = new PrismaNeon({ connectionString });
	return new PrismaClient({
		adapter,
		log:
			process.env.NODE_ENV !== 'production' ?
				['error', 'warn'] :
				['error']
	});
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;
