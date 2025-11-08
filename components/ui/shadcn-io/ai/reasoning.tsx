"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Reasoning({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Popover>
      <ReasoningTrigger className={className} />
      <PopoverContent className="w-96 p-4 text-sm" align="start">
        <div className="space-y-2">
          <div className="font-medium text-sm text-popover-foreground">
            Reasoning
          </div>
          <div className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
            {children}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ReasoningTrigger({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-auto p-2 text-xs text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      >
        <span>Show reasoning</span>
        <ChevronDownIcon className="ml-1 h-3 w-3" />
      </Button>
    </PopoverTrigger>
  );
}

export function ReasoningContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-96 p-4 text-sm", className)} {...props}>
      <div className="space-y-2">
        <div className="font-medium text-popover-foreground">Reasoning</div>
        <div className="text-muted-foreground whitespace-pre-wrap">
          {children}
        </div>
      </div>
    </div>
  );
}
