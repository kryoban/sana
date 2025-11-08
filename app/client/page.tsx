"use client";

import * as React from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation";
import { Loader } from "@/components/ui/shadcn-io/ai/loader";
import { Message, MessageContent } from "@/components/ui/shadcn-io/ai/message";
import { PromptInput } from "@/components/ui/shadcn-io/ai/prompt-input";
import { Reasoning } from "@/components/ui/shadcn-io/ai/reasoning";
import { Sources } from "@/components/ui/shadcn-io/ai/source";
import { Button } from "@/components/ui/button";
import { RotateCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  reasoning?: string;
  sources?: Array<{ title: string; url: string }>;
  isStreaming?: boolean;
};

const sampleResponses = [
  {
    content:
      "I'd be happy to help you with that! React is a powerful JavaScript library for building user interfaces. What specific aspect would you like to explore?",
    reasoning:
      "The user is asking about React, which is a broad topic. I should provide a helpful overview while asking for more specific information to give a more targeted response.",
    sources: [
      { title: "React Official Documentation", url: "https://react.dev" },
      { title: "React Developer Tools", url: "https://react.dev/learn" },
    ],
  },
  {
    content:
      "Next.js is an excellent framework built on top of React that provides server-side rendering, static site generation, and many other powerful features out of the box.",
    reasoning:
      "The user mentioned Next.js, so I should explain its relationship to React and highlight its key benefits for modern web development.",
    sources: [
      { title: "Next.js Documentation", url: "https://nextjs.org/docs" },
      {
        title: "Vercel Next.js Guide",
        url: "https://vercel.com/guides/nextjs",
      },
    ],
  },
  {
    content:
      "TypeScript adds static type checking to JavaScript, which helps catch errors early and improves code quality. It's particularly valuable in larger applications.",
    reasoning:
      "TypeScript is becoming increasingly important in modern development. I should explain its benefits while keeping the explanation accessible.",
    sources: [
      {
        title: "TypeScript Handbook",
        url: "https://www.typescriptlang.org/docs",
      },
      {
        title: "TypeScript with React",
        url: "https://react.dev/learn/typescript",
      },
    ],
  },
];

const getInitialMessage = (): ChatMessage => ({
  id: nanoid(),
  content:
    "Hello! I'm Ana, your AI assistant. I can help you with coding questions, explain concepts, and provide guidance on web development topics. What would you like to know?",
  role: "assistant",
  timestamp: new Date(),
});

export default function ClientPage() {
  const [mounted, setMounted] = React.useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  // Initialize with welcome message after hydration to avoid SSR mismatch
  React.useEffect(() => {
    setMounted(true);
    setMessages([getInitialMessage()]);
  }, []);

  const simulateTyping = useCallback(
    (
      messageId: string,
      content: string,
      reasoning?: string,
      sources?: Array<{ title: string; url: string }>
    ) => {
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              const currentContent = content.slice(0, currentIndex);
              return {
                ...msg,
                content: currentContent,
                isStreaming: currentIndex < content.length,
                reasoning:
                  currentIndex >= content.length ? reasoning : undefined,
                sources: currentIndex >= content.length ? sources : undefined,
              };
            }
            return msg;
          })
        );
        currentIndex += Math.random() > 0.1 ? 1 : 0; // Simulate variable typing speed

        if (currentIndex >= content.length) {
          clearInterval(typeInterval);
          setIsTyping(false);
          setStreamingMessageId(null);
        }
      }, 50);
      return () => clearInterval(typeInterval);
    },
    []
  );

  const handleSubmit = useCallback(
    (value: string) => {
      if (!value.trim() || isTyping) return;
      // Add user message
      const userMessage: ChatMessage = {
        id: nanoid(),
        content: value.trim(),
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);
      // Simulate AI response with delay
      setTimeout(() => {
        const responseData =
          sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
        const assistantMessageId = nanoid();

        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
          isStreaming: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingMessageId(assistantMessageId);

        // Start typing simulation
        simulateTyping(
          assistantMessageId,
          responseData.content,
          responseData.reasoning,
          responseData.sources
        );
      }, 800);
    },
    [isTyping, simulateTyping]
  );

  // Auto-scroll when messages change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const viewport = document.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement;
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleReset = useCallback(() => {
    setMessages([getInitialMessage()]);
    setInputValue("");
    setIsTyping(false);
    setStreamingMessageId(null);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-card-foreground">
              Ana
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-3 text-xs"
        >
          <RotateCcwIcon className="size-3.5" />
          <span className="ml-1.5">Reset</span>
        </Button>
      </div>

      {/* Conversation Area */}
      <Conversation className="flex-1">
        <ConversationContent>
          {mounted &&
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent from={message.role}>
                  {message.content}
                  {message.isStreaming && (
                    <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-current" />
                  )}
                </MessageContent>
                {message.reasoning && (
                  <div className="mt-2">
                    <Reasoning>{message.reasoning}</Reasoning>
                  </div>
                )}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2">
                    <Sources sources={message.sources} />
                  </div>
                )}
              </Message>
            ))}
          {mounted && isTyping && !streamingMessageId && (
            <Message from="assistant">
              <MessageContent from="assistant">
                <Loader />
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="border-t border-border bg-card">
        <PromptInput
          onSubmit={handleSubmit}
          value={inputValue}
          onValueChange={setInputValue}
        />
      </div>
    </div>
  );
}
