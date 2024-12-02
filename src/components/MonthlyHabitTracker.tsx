// src/components/MonthlyHabitTracker.tsx
"use client";

import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Pencil, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Habit } from "@/types/habit";
import { motion } from "framer-motion";

interface MonthlyViewProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, date: string) => Promise<void>;
  onEdit?: (habit: Habit) => void;
  onDelete?: (id: string) => Promise<void>;
  className?: string;
  isLoading?: boolean;
}

interface DayButtonProps {
  day: Date;
  habit: Habit;
  isCompleted: boolean;
  isFuture: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

function DayButton({ day, habit, isCompleted, isFuture, onToggle, isLoading }: DayButtonProps) {
  const isDisabled = isFuture || isLoading;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={!isDisabled ? { scale: 1.1 } : undefined}
            whileTap={!isDisabled ? { scale: 0.95 } : undefined}
            onClick={onToggle}
            className={cn(
              "w-full h-12 flex items-center justify-center",
              "transition-all duration-200",
              !isDisabled && "hover:bg-gray-800",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ color: habit.color }}
            disabled={isDisabled}
            aria-label={`${habit.name} for ${format(day, 'MMMM d, yyyy')}`}
            aria-pressed={isCompleted}
            aria-disabled={isDisabled}
          >
            {isCompleted ? (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: habit.color }}
              >
                ✓
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-current opacity-25" />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{format(day, 'MMMM d, yyyy')}</p>
            <p className={cn(
              isCompleted ? 'text-green-400' : 'text-gray-400',
              isFuture && 'text-gray-500'
            )}>
              {isFuture ? 'Future date' : isCompleted ? 'Completed' : 'Not completed'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function MonthlyView({ 
  habits, 
  onToggleHabit,
  onEdit,
  onDelete,
  className,
  isLoading 
}: MonthlyViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handleDateChange = useCallback((increment: number) => {
    setCurrentDate(date => {
      const newDate = new Date(date);
      newDate.setMonth(date.getMonth() + increment);
      return newDate;
    });
  }, []);

  const handleToggle = useCallback((habit: Habit, day: Date) => {
    if (isBefore(startOfDay(new Date()), startOfDay(day))) return;
    onToggleHabit(habit.id, day.toISOString());
  }, [onToggleHabit]);

  const today = new Date();

  return (
    <div 
      className={cn("w-full overflow-x-auto", className)}
      role="region"
      aria-label="Monthly habit tracker"
    >
      <div className="flex items-center justify-between mb-4 sticky left-0 z-10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(-1)}
            className="h-8 w-8 p-0"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(today)}
            className="h-8 px-2 text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(1)}
            className="h-8 w-8 p-0"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-gray-800 rounded-lg overflow-hidden"
      >
        <table className="w-full border-collapse" role="grid">
          <thead>
            <tr className="bg-gray-900">
              <th 
                className="p-3 text-left border-b border-r border-gray-800 min-w-[200px] sticky left-0 bg-gray-900 z-20"
                scope="col"
              >
                Habit
              </th>
              {daysInMonth.map((day) => (
                <th 
                  key={day.getTime()} 
                  className={cn(
                    "p-3 text-center border-b border-r border-gray-800 w-12",
                    isToday(day) && "bg-gray-800"
                  )}
                  scope="col"
                  aria-label={format(day, 'EEEE')}
                >
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr 
                key={habit.id} 
                className="border-b border-gray-800 group"
                role="row"
              >
                <td className="p-3 border-r border-gray-800 sticky left-0 bg-gray-900 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.span 
                        whileHover={{ scale: 1.1 }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: habit.color }}
                      >
                        {habit.icon}
                      </motion.span>
                      <div>
                        <div className="font-medium">{habit.name}</div>
                        <div className="text-sm text-gray-500">{habit.description}</div>
                      </div>
                    </div>
                    {(onEdit || onDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(habit)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onEdit && onDelete && <DropdownMenuSeparator />}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(habit.id)}
                              className="text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </td>
                {daysInMonth.map((day) => {
                  const isCompleted = habit.entries.some(
                    entry => isSameDay(new Date(entry.date), day) && entry.completed
                  );
                  const isFuture = day > today;
                  
                  return (
                    <td 
                      key={day.getTime()} 
                      className={cn(
                        "border-r border-gray-800",
                        isToday(day) && "bg-gray-800/50"
                      )}
                      role="gridcell"
                    >
                      <DayButton
                        day={day}
                        habit={habit}
                        isCompleted={isCompleted}
                        isFuture={isFuture}
                        onToggle={() => handleToggle(habit, day)}
                        isLoading={isLoading}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}