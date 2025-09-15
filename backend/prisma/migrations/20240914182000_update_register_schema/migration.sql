-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- DropForeignKey
ALTER TABLE "registers" DROP CONSTRAINT "registers_activityId_fkey";
ALTER TABLE "registers" DROP CONSTRAINT "registers_venueId_fkey";

-- AlterTable
ALTER TABLE "registers" DROP COLUMN "activityId",
DROP COLUMN "venueId",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "attendance_registerId_idx" ON "attendance"("registerId");
CREATE INDEX "attendance_childId_idx" ON "attendance"("childId");
CREATE INDEX "attendance_bookingId_idx" ON "attendance"("bookingId");

-- AddForeignKey
ALTER TABLE "registers" ADD CONSTRAINT "registers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
