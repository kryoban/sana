"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Loader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-center py-2", className)}
      {...props}
    >
      <div className="flex gap-1.5">
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
      </div>
    </div>
  );
}
