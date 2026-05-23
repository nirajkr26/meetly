-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "inviteeAnswers" JSONB;

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customQuestions" JSONB NOT NULL DEFAULT '[]';
