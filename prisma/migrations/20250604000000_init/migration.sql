-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "targetAngles" JSONB NOT NULL,
    "refVideoUrl" TEXT,
    "dayOfWeek" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "weekNumber" INTEGER NOT NULL,
    "dayType" TEXT,
    "totalDuration" INTEGER,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "setsCompleted" INTEGER NOT NULL DEFAULT 0,
    "repsCompleted" INTEGER NOT NULL DEFAULT 0,
    "avgAmplitude" DOUBLE PRECISION,
    "peakAmplitude" DOUBLE PRECISION,
    "compensations" JSONB,
    "signalData" JSONB,
    "coachMessages" JSONB,
    "durationSeconds" INTEGER,

    CONSTRAINT "SessionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT NOT NULL,
    "summary" JSONB NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progression" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bodyPart" TEXT NOT NULL,
    "angleDegrees" DOUBLE PRECISION NOT NULL,
    "exerciseId" TEXT NOT NULL,

    CONSTRAINT "Progression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_sessionId_key" ON "Report"("sessionId");

-- CreateIndex
CREATE INDEX "SessionExercise_sessionId_idx" ON "SessionExercise"("sessionId");

-- CreateIndex
CREATE INDEX "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "Progression_exerciseId_idx" ON "Progression"("exerciseId");

-- CreateIndex
CREATE INDEX "Progression_date_idx" ON "Progression"("date");

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progression" ADD CONSTRAINT "Progression_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
