"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sources({
  sources,
  className,
}: {
  sources: Array<{ title: string; url: string }>;
  className?: string;
}) {
  if (!sources || sources.length === 0) return null;

  return (
    <Popover>
      <SourcesTrigger count={sources.length} className={className} />
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-2">
          <div className="font-medium text-sm text-popover-foreground">
            Sources
          </div>
          <div className="space-y-1">
            {sources.map((source, index) => (
              <Source key={index} title={source.title} url={source.url} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SourcesTrigger({
  count,
  className,
  ...props
}: {
  count: number;
} & React.HTMLAttributes<HTMLButtonElement>) {
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
        <span>
          Used {count} {count === 1 ? "source" : "sources"}
        </span>
      </Button>
    </PopoverTrigger>
  );
}

export function SourcesContent({
  sources,
  className,
  ...props
}: {
  sources: Array<{ title: string; url: string }>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-80 p-4", className)} {...props}>
      <div className="space-y-2">
        <div className="font-medium text-sm text-popover-foreground">
          Sources
        </div>
        <div className="space-y-1">
          {sources.map((source, index) => (
            <Source key={index} title={source.title} url={source.url} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Source({
  title,
  url,
  className,
  ...props
}: {
  title: string;
  url: string;
} & React.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "cursor-pointer flex items-center gap-2 rounded-md p-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      {...props}
    >
      <ExternalLinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{title}</span>
    </a>
  );
}
