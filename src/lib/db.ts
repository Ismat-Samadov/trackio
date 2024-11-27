// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined
}

const prisma = 
  global.cachedPrisma || 
  new PrismaClient({
    log: ['info']
  })

if (process.env.NODE_ENV !== 'production') {
  global.cachedPrisma = prisma
}

export const db = prisma