"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserIcon } from "lucide-react";

export function Message({
  from,
  className,
  children,
  ...props
}: {
  from: "user" | "assistant";
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group flex w-full gap-4",
        from === "user" ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      {from === "assistant" && (
        <MessageAvatar name="Ana" className="shrink-0" />
      )}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          from === "user" ? "items-end" : "items-start"
        )}
      >
        {children}
      </div>
      {from === "user" && <MessageAvatar name="You" className="shrink-0" />}
    </div>
  );
}

export function MessageAvatar({
  src,
  name,
  className,
  ...props
}: {
  src?: string;
  name: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [imageError, setImageError] = React.useState(false);
  const isAssistant =
    name === "Ana" || name.toLowerCase().includes("assistant");
  const shouldShowImage =
    src && (src.startsWith("http") || src.startsWith("/")) && !imageError;

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isAssistant
          ? "bg-transparent border-0"
          : "bg-secondary border border-border text-muted-foreground",
        className
      )}
      {...props}
    >
      {shouldShowImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : isAssistant ? (
        <Image
          src="/images/ana_avatar.svg"
          alt="Ana"
          width={32}
          height={32}
          className="h-8 w-8"
        />
      ) : (
        <UserIcon className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

export function MessageContent({
  from,
  className,
  children,
  ...props
}: {
  from: "user" | "assistant";
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
        from === "user"
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-foreground shadow-sm border border-border/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
