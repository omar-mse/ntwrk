import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@/lib/generated/prisma/client"
import path from "path"
import { pathToFileURL } from "url"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function buildClient() {
  // DATABASE_URL is "file:./dev.db" — resolve to an absolute URL for libsql
  const raw = process.env.DATABASE_URL ?? "file:./dev.db"
  let url: string
  if (raw.startsWith("file:") && !raw.startsWith("file:///") && !raw.startsWith("file://")) {
    const relative = raw.slice("file:".length)
    url = pathToFileURL(path.resolve(process.cwd(), relative)).href
  } else {
    url = raw
  }
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
