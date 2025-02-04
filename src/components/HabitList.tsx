// src/components/HabitList.tsx
"use client";

import { useState, useCallback } from "react";
import type { Habit, HabitStats, HabitUpdateInput } from "@/types/habit";
import { OptimisticProvider } from "./providers/OptimisticProvider";
import { motion } from "framer-motion";
import { Plus, ListPlus } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOptimisticHabits } from "./providers/OptimisticProvider";
import CalendarView from "./CalendarHabitView";

interface HabitListProps {
  habits: Habit[];
  initialStats?: Record<string, HabitStats>;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function HabitList({ 
  habits: initialHabits,
  onPageChange,
  onLimitChange 
}: HabitListProps): JSX.Element {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toggleHabit } = useOptimisticHabits();

  const handleDelete = useCallback(async (habitId: string): Promise<void> => {
    setHabits(current => current.filter(h => h.id !== habitId));
    const toastId = toast.loading("Deleting habit...");
    
    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete habit");
      }
      
      toast.success("Habit deleted successfully", { id: toastId });
      router.refresh();
    } catch (error) {
      console.error("Error deleting habit:", error);
      setHabits(initialHabits);
      toast.error(error instanceof Error ? error.message : "Failed to delete habit", { id: toastId });
      setError("Failed to delete habit. Please try again.");
    }
  }, [initialHabits, router]);

  const handleUpdate = useCallback(async (habitId: string, data: Partial<HabitUpdateInput>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    const toastId = toast.loading("Updating habit...");

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update habit");
      }

      const result = await response.json();
      
      setHabits(current =>
        current.map(habit =>
          habit.id === habitId ? result.habit : habit
        )
      );

      toast.success("Habit updated successfully", { id: toastId });
      router.refresh();
    } catch (error) {
      console.error("Error updating habit:", error);
      setHabits(initialHabits);
      toast.error(error instanceof Error ? error.message : "Failed to update habit", { id: toastId });
      setError("Failed to update habit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [initialHabits, router]);

  const handleCreateHabit = useCallback(() => {
    const element = document.getElementById('new-habit-trigger');
    element?.click();
  }, []);

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8"
        role="region"
        aria-label="Empty habits list"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6"
        >
          <ListPlus className="w-8 h-8 text-gray-400" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-300 mb-3">
          No habits tracked yet
        </h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Start building better habits by creating your first habit tracker.
          Click the + button above to begin.
        </p>
        <Button 
          size="lg"
          className="rounded-xl bg-gray-800 hover:bg-gray-700"
          onClick={handleCreateHabit}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Your First Habit
        </Button>
      </motion.div>
    );
  }

  return (
    <OptimisticProvider habits={habits}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <CalendarView habits={habits} onToggleHabit={toggleHabit} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center py-4 border-t border-gray-800"
        >
          <Button
            variant="ghost"
            className="text-gray-500 hover:text-gray-400"
            onClick={handleCreateHabit}
            aria-label="Add another habit"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Habit
          </Button>
        </motion.div>
      </motion.div>
    </OptimisticProvider>
  );
}