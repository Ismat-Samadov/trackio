// src/lib/actions.ts
"use server"

import { verifyAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schemas
const habitSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default("#E040FB"),
  icon: z.string().min(1).max(2).default("📝"),
})

const toggleSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().datetime(),
})

export async function createHabit(formData: FormData) {
  try {
    const userId = await verifyAuth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      color: formData.get("color") || "#E040FB",
      icon: formData.get("icon") || "📝",
    }

    // Validate input
    const validatedData = habitSchema.parse(data)

    // Check for duplicate habit names among non-deleted habits
    const existingHabit = await db.habit.findFirst({
      where: {
        userId,
        name: validatedData.name,
        isDeleted: false,
      },
    })

    if (existingHabit) {
      throw new Error("A habit with this name already exists")
    }

    await db.habit.create({
      data: {
        ...validatedData,
        userId,
        isDeleted: false,
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error creating habit:", error)
    if (error instanceof z.ZodError) {
      throw new Error("Invalid habit data")
    }
    throw error
  }
}

export async function toggleHabit(habitId: string, date: string) {
  try {
    // Validate input
    const validated = toggleSchema.parse({ habitId, date })
    
    const userId = await verifyAuth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Check if habit exists, belongs to user, and is not deleted
    const habit = await db.habit.findFirst({
      where: {
        id: validated.habitId,
        userId,
        isDeleted: false,
      },
    })

    if (!habit) {
      throw new Error("Habit not found")
    }

    // Find existing entry
    const entry = await db.habitEntry.findUnique({
      where: {
        habitId_date: {
          habitId: validated.habitId,
          date: new Date(validated.date),
        },
      },
    })

    let result;
    
    if (entry) {
      // Delete existing entry
      result = await db.habitEntry.delete({
        where: {
          id: entry.id,
        },
      })
    } else {
      // Create new entry
      result = await db.habitEntry.create({
        data: {
          habitId: validated.habitId,
          date: new Date(validated.date),
          completed: true,
        },
      })
    }

    revalidatePath("/")
    return { 
      success: true, 
      action: entry ? 'deleted' : 'created',
      entry: result 
    }
  } catch (error) {
    console.error("Error toggling habit:", error)
    if (error instanceof z.ZodError) {
      throw new Error("Invalid input data")
    }
    throw error
  }
}

// Soft delete habit
export async function deleteHabit(habitId: string) {
  try {
    const userId = await verifyAuth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Verify the habit exists and isn't already deleted
    const habit = await db.habit.findFirst({
      where: {
        id: habitId,
        userId,
        isDeleted: false,
      },
    })

    if (!habit) {
      throw new Error("Habit not found")
    }

    // Perform soft delete
    await db.habit.update({
      where: {
        id: habitId,
        userId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting habit:", error)
    throw error
  }
}

// Update habit
export async function updateHabit(habitId: string, data: z.infer<typeof habitSchema>) {
  try {
    const userId = await verifyAuth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Validate input
    const validatedData = habitSchema.parse(data)

    // Check if habit exists and isn't deleted
    const habit = await db.habit.findFirst({
      where: {
        id: habitId,
        userId,
        isDeleted: false,
      },
    })

    if (!habit) {
      throw new Error("Habit not found")
    }

    // Check for name conflict if name is being updated
    if (validatedData.name !== habit.name) {
      const existingHabit = await db.habit.findFirst({
        where: {
          userId,
          name: validatedData.name,
          isDeleted: false,
          NOT: {
            id: habitId,
          },
        },
      })

      if (existingHabit) {
        throw new Error("A habit with this name already exists")
      }
    }

    // Update the habit
    await db.habit.update({
      where: {
        id: habitId,
        userId,
      },
      data: validatedData,
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating habit:", error)
    if (error instanceof z.ZodError) {
      throw new Error("Invalid habit data")
    }
    throw error
  }
}