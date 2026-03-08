-- Rename SwipeAction enum value from PASS to UNLIKE (PostgreSQL)
ALTER TYPE "SwipeAction" RENAME VALUE 'PASS' TO 'UNLIKE';
