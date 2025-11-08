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
  enableAutoScroll: () => void;
  disableAutoScroll: () => void;
  autoScrollEnabled: boolean;
}>({
  scrollToBottom: () => {},
  isAtBottom: true,
  setIsAtBottom: () => {},
  enableAutoScroll: () => {},
  disableAutoScroll: () => {},
  autoScrollEnabled: true,
});

export function useConversation() {
  return React.useContext(ConversationContext);
}

export function Conversation({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const lastScrollTopRef = React.useRef<number>(0);
  const lastScrollHeightRef = React.useRef<number>(0);
  const isUserScrollingRef = React.useRef(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const autoScrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = React.useCallback((instant = false) => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: instant ? "auto" : "smooth",
      });
    }
  }, []);

  const enableAutoScroll = React.useCallback(() => {
    setAutoScrollEnabled(true);
    // Scroll to bottom immediately when re-enabling
    scrollToBottom(true);
  }, [scrollToBottom]);

  const disableAutoScroll = React.useCallback(() => {
    setAutoScrollEnabled(false);
  }, []);

  const handleScroll = React.useCallback(() => {
    if (!viewportRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);

    // Detect if user scrolled up manually (only if scrollTop decreased significantly)
    const scrollDelta = lastScrollTopRef.current - scrollTop;
    if (scrollDelta > 10 && !isNearBottom) {
      // User scrolled up significantly and is not near bottom - disable auto-scroll
      if (autoScrollEnabled) {
        setAutoScrollEnabled(false);
      }
    }

    lastScrollTopRef.current = scrollTop;
    lastScrollHeightRef.current = scrollHeight;

    // Track user scrolling activity
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  }, [autoScrollEnabled]);

  // Observe content changes to detect new messages and auto-scroll
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Initialize scroll height
    lastScrollHeightRef.current = viewport.scrollHeight;

    // Function to check and handle auto-scroll
    const checkAndAutoScroll = () => {
      if (!viewportRef.current || !autoScrollEnabled) return;

      const currentScrollHeight = viewportRef.current.scrollHeight;
      const heightIncreased = currentScrollHeight > lastScrollHeightRef.current;

      // If content grew and user is not actively scrolling, auto-scroll
      if (heightIncreased && !isUserScrollingRef.current) {
        // Clear any pending auto-scroll
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
        }

        // Small delay to ensure DOM has fully updated
        autoScrollTimeoutRef.current = setTimeout(() => {
          if (autoScrollEnabled && viewportRef.current) {
            scrollToBottom();
          }
        }, 50);
      }

      lastScrollHeightRef.current = currentScrollHeight;
    };

    // Use MutationObserver to detect DOM changes
    const mutationObserver = new MutationObserver(() => {
      checkAndAutoScroll();
    });

    // Observe the viewport for child additions and text changes
    mutationObserver.observe(viewport, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: true,
    });

    return () => {
      mutationObserver.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, [autoScrollEnabled, scrollToBottom]);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      // Initialize scroll position
      lastScrollTopRef.current = viewport.scrollTop;
      lastScrollHeightRef.current = viewport.scrollHeight;
      return () => {
        viewport.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  return (
    <ConversationContext.Provider
      value={{
        scrollToBottom,
        isAtBottom,
        setIsAtBottom,
        enableAutoScroll,
        disableAutoScroll,
        autoScrollEnabled,
      }}
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
