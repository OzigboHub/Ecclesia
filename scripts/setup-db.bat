@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Ecclesia DPM - Database Setup
echo ========================================
echo.

REM Step 1: Generate Prisma Client
echo [Step 1/3] Generating Prisma Client...
call pnpm prisma generate
if !errorlevel! neq 0 (
    echo [ERROR] Failed to generate Prisma Client
    pause
    exit /b 1
)
echo [SUCCESS] Prisma Client generated
echo.

REM Step 2: Create and apply migration
echo [Step 2/3] Creating database migration...
call pnpm prisma migrate dev --name init
if !errorlevel! neq 0 (
    echo [ERROR] Failed to create migration
    pause
    exit /b 1
)
echo [SUCCESS] Database migration completed
echo.

REM Step 3: Seed database (optional)
echo [Step 3/3] Seed database with sample data?
echo WARNING: This will create a sample organization and admin user
set /p SEED="Seed database? (y/n): "
if /i "%SEED%"=="y" (
    call pnpm prisma db seed
    if !errorlevel! neq 0 (
        echo [WARNING] Seeding failed or no seed script found
    ) else (
        echo [SUCCESS] Database seeded
    )
)
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Run 'pnpm dev' to start the dev server
echo   2. Visit http://localhost:3000
echo   3. Log in with your credentials
echo.
echo To view your database, run: pnpm prisma studio
echo.
pause
