"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MONTHS } from "@/lib/constants";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingCalendar({ currentYear, currentMonth, selectedDate, onPrevMonth, onNextMonth, onSelectDate, }) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const blankCells = Array(firstDayIndex).fill(null);
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold">
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onPrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blankCells.map((_, idx) => (
          <div key={`blank-${idx}`} className="aspect-square" />
        ))}

        {dayCells.map((day) => {
          const dateVal = new Date(currentYear, currentMonth, day);
          const isPast = dateVal < today;
          const isWeekend = dateVal.getDay() === 0 || dateVal.getDay() === 6;
          const isSelectable = !isPast && !isWeekend;

          const isSelected = selectedDate && selectedDate.getFullYear() === currentYear && selectedDate.getMonth() === currentMonth && selectedDate.getDate() === day;

          return (
            <button
              key={day}
              type="button"
              disabled={!isSelectable}
              onClick={() => onSelectDate(day)}
              className={cn(
                "aspect-square w-full rounded-lg text-sm font-medium transition-colors",
                isSelected && "bg-primary text-primary-foreground shadow-sm",
                !isSelected && isSelectable && "text-primary hover:bg-primary/10",
                !isSelectable && "cursor-not-allowed text-muted-foreground/40"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
