-- CreateTable
CREATE TABLE "BusinessCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "aiDescription" TEXT NOT NULL,
    "userNotes" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT,
    "accent" TEXT,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
