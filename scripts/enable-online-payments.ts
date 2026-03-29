import { config } from 'dotenv';
config(); // Load .env

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

neonConfig.webSocketConstructor = WebSocket as unknown as typeof globalThis.WebSocket;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter } as any);

async function main() {
  // Check all organizations
  const orgs = await db.organization.findMany({ select: { id: true, name: true } });
  console.log(`Total organizations: ${orgs.length}`);
  
  // Check which have feature settings
  const settings = await db.organizationFeatureSettings.findMany({
    select: { organizationId: true, enableOnlinePayments: true },
  });
  console.log(`Orgs with feature settings: ${settings.length}`);
  console.log('Settings:', settings);
  
  // Find orgs WITHOUT feature settings
  const settingsOrgIds = new Set(settings.map(s => s.organizationId));
  const missing = orgs.filter(o => !settingsOrgIds.has(o.id));
  console.log(`Orgs missing feature settings: ${missing.length}`, missing);

  // Create missing feature settings with online payments enabled
  for (const org of missing) {
    await db.organizationFeatureSettings.create({
      data: { organizationId: org.id, enableOnlinePayments: true },
    });
    console.log(`Created feature settings for: ${org.name} (${org.id})`);
  }

  // Enable online payments for all
  const result = await db.organizationFeatureSettings.updateMany({
    data: { enableOnlinePayments: true },
  });
  console.log(`Updated ${result.count} organization(s) — enableOnlinePayments = true`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
