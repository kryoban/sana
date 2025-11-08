"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ConversationContext = React.createContext<{
  scrollToBottom: () => void;
  isAtBottom: boolean;
  setIsAtBottom: (value: boolean) => void;
}>({
  scrollToBottom: () => {},
  isAtBottom: true,
  setIsAtBottom: () => {},
});

export function Conversation({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = React.useCallback(() => {
    if (!viewportRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return (
    <ConversationContext.Provider
      value={{ scrollToBottom, isAtBottom, setIsAtBottom }}
    >
      <ScrollAreaPrimitive.Root
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden",
          className
        )}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className="size-full rounded-[inherit] focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          onScroll={handleScroll}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.ScrollAreaScrollbar
          orientation="vertical"
          className="flex touch-none select-none transition-colors h-full w-2.5 border-l border-l-transparent p-[1px]"
        >
          <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border/50 hover:bg-border" />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </ConversationContext.Provider>
  );
}

export function ConversationContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-full flex-col gap-6 px-4 py-6 md:px-8",
        className
      )}
      {...props}
    />
  );
}

export function ConversationScrollButton({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { scrollToBottom, isAtBottom } = React.useContext(ConversationContext);

  if (isAtBottom) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute bottom-4 right-4 z-10 h-8 w-8 rounded-full shadow-md",
        className
      )}
      onClick={scrollToBottom}
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4" />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  );
}
