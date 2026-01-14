#!/bin/bash

echo "🚀 Ecclesia DPM - Database Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
pnpm prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated successfully${NC}"
else
    echo -e "${RED}✗ Failed to generate Prisma Client${NC}"
    exit 1
fi
echo ""

# Step 2: Create and apply migration
echo "🗄️  Step 2: Creating database migration..."
pnpm prisma migrate dev --name init
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration completed successfully${NC}"
else
    echo -e "${RED}✗ Failed to create migration${NC}"
    exit 1
fi
echo ""

# Step 3: Seed database (optional)
echo "🌱 Step 3: Seeding database with sample data..."
echo -e "${YELLOW}⚠️  This will create a sample organization and admin user${NC}"
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm prisma db seed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database seeded successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Seeding failed or no seed script found${NC}"
    fi
fi
echo ""

# Step 4: Open Prisma Studio
echo "🎨 Step 4: Opening Prisma Studio..."
echo -e "${YELLOW}Would you like to open Prisma Studio to view your database?${NC}"
read -p "(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm prisma studio
fi

echo ""
echo -e "${GREEN}✓ Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm dev' to start the development server"
echo "  2. Visit http://localhost:3000"
echo "  3. Log in with your credentials"
echo ""
