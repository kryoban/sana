"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

export default function MedicPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    return {
      from: thirtyDaysAgo,
      to: today,
    };
  });

  return (
    <SidebarProvider>
      <AppSidebar variant="medic" />
      <SidebarInset>
        <div className="flex h-screen w-full flex-col bg-background">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-6">
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <div className="flex items-center gap-4">
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>
            </div>
          </header>
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {/* Dashboard content will go here */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
