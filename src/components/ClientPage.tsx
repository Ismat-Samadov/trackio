// src/components/ClientPage.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type { Habit } from "@/types/habit";
import NewHabitButton from "./NewHabitButton";
import { SignOutButton } from "./SignOutButton";
import { Suspense } from "react";
import Loading from "@/app/loading";
import MonthlyView from "./MonthlyHabitTracker";
import { OptimisticProvider } from "./providers/OptimisticProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function MonthlyViewWithOptimistic({ habits }: { habits: Habit[] }) {
  const router = useRouter();

  const handleToggleHabit = useCallback(async (habitId: string, date: string) => {
    const toastId = toast.loading("Updating habit...");

    try {
      const response = await fetch(`/api/habits/${habitId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle habit");
      }

      const data = await response.json();
      toast.success(
        data.entry?.completed ? "Habit completed" : "Habit uncompleted", 
        { id: toastId }
      );

      router.refresh();
    } catch (error) {
      console.error("Error toggling habit:", error);
      toast.error("Failed to update habit", { id: toastId });
    }
  }, [router]);

  return (
    <OptimisticProvider habits={habits}>
      <MonthlyView 
        habits={habits}
        onToggleHabit={handleToggleHabit}
      />
    </OptimisticProvider>
  );
}

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-red-500">Error</h1>
      <p className="text-gray-400 mt-2">{error.message}</p>
      <p className="text-gray-400 mt-1">Please try again later.</p>
      <SignOutButton className="mt-4" />
    </div>
  );
}

export default function ClientPage({ 
  habits: initialHabits,
  error 
}: { 
  habits: Habit[],
  error?: Error | null 
}) {
  const router = useRouter();
  const [habits, setHabits] = useState(initialHabits);

  // Update local state when props change
  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  // Auto-refresh when window gains focus
  useEffect(() => {
    function handleFocus() {
      router.refresh();
    }

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [router]);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <main className="container mx-auto max-w-[1200px] p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Habit Tracker</h1>
          <p className="text-gray-400">Track your daily habits</p>
        </div>
        <div className="flex items-center space-x-4">
          <NewHabitButton />
          <SignOutButton />
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        <div className="space-y-8">
          {habits.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-400 mb-4">
                No habits tracked yet
              </h3>
              <p className="text-gray-500">
                Create your first habit to start tracking your progress
              </p>
            </div>
          ) : (
            <MonthlyViewWithOptimistic habits={habits} />
          )}
        </div>
      </Suspense>
    </main>
  );
}