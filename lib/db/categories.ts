import { prisma } from "@/lib/prisma"
import type { CustomCategory } from "@/lib/types"

export async function listCategories(userId: string): Promise<CustomCategory[]> {
  return prisma.userCategory.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { name: true, accent: true },
  })
}

export async function upsertCategory(
  userId: string,
  name: string,
  accent: string
): Promise<CustomCategory> {
  return prisma.userCategory.upsert({
    where: { userId_name: { userId, name } },
    update: { accent },
    create: { userId, name, accent },
    select: { name: true, accent: true },
  })
}

export async function upsertCategoriesIgnoreDuplicates(
  userId: string,
  tags: CustomCategory[]
): Promise<void> {
  if (tags.length === 0) return
  await Promise.all(
    tags.map((t) =>
      prisma.userCategory.upsert({
        where: { userId_name: { userId, name: t.name } },
        update: {},
        create: { userId, name: t.name, accent: t.accent },
      })
    )
  )
}

export async function deleteCategory(userId: string, name: string): Promise<void> {
  await prisma.userCategory.deleteMany({ where: { userId, name } })
}
