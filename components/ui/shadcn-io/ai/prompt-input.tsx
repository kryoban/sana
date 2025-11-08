"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SendIcon, PaperclipIcon, MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PromptInput({
  className,
  children,
  onSubmit,
  value: controlledValue,
  onValueChange,
  ...props
}: {
  onSubmit?: (value: string) => void;
  value?: string;
  onValueChange?: (value: string) => void;
} & Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit">) {
  const [internalValue, setInternalValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const setValue = isControlled
    ? onValueChange || (() => {})
    : setInternalValue;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim() && onSubmit) {
      onSubmit(value.trim());
      if (!isControlled) {
        setInternalValue("");
      } else if (onValueChange) {
        onValueChange("");
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(
        100,
        Math.min(textarea.scrollHeight, 200)
      )}px`;
    }
  }, [value]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-3 bg-background p-4", className)}
      {...props}
    >
      {children}
      <div className="flex justify-center">
        <div className="relative flex items-end gap-2 w-full max-w-[768px]">
          <div className="relative flex-1">
            <PromptInputTextarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              className="pr-12"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <PromptInputTools />
            </div>
            <PromptInputSubmit
              disabled={!value.trim()}
              className="absolute bottom-2 right-2"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>(({ className, ...props }, ref) => {
  return (
    <Textarea
      ref={ref}
      className={cn(
        "min-h-[100px] max-h-[200px] resize-none py-3 pr-12 text-sm leading-relaxed focus-visible:border-[#FF008C] focus-visible:ring-[#FF008C]/50 focus-visible:shadow-xl",
        className
      )}
      placeholder="Bună, Andrei! Cu ce te pot ajuta?"
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

export function PromptInputToolbar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PromptInputTools({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
        <PaperclipIcon className="h-4 w-4 text-[#FF008C]" />
        <span className="sr-only">Atașează fișier</span>
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
        <MicIcon className="h-4 w-4 text-[#FF008C]" />
        <span className="sr-only">Intrare vocală</span>
      </Button>
    </div>
  );
}

export function PromptInputSubmit({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      size="sm"
      disabled={disabled}
      className={cn(
        "h-8 bg-[#FF008C] hover:bg-[#E6007A] text-white",
        className
      )}
      {...props}
    >
      <SendIcon className="h-4 w-4 text-white" />
      <span className="sr-only">Trimite mesaj</span>
    </Button>
  );
}

export function PromptInputModelSelect({
  value,
  onValueChange,
  models,
  className,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
  models: Array<{ id: string; name: string }>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn("w-[180px] h-8", className)}
        {...(props as React.ComponentProps<typeof SelectTrigger>)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Re-export select components for convenience
export const PromptInputModelSelectContent = SelectContent;
export const PromptInputModelSelectItem = SelectItem;
export const PromptInputModelSelectTrigger = SelectTrigger;
export const PromptInputModelSelectValue = SelectValue;
