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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

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
      "Aș fi fericit să te ajut cu asta! React este o bibliotecă JavaScript puternică pentru construirea interfețelor utilizator. Ce aspect specific ai dori să explorăm?",
    reasoning:
      "Utilizatorul întreabă despre React, care este un subiect larg. Ar trebui să ofer un rezumat util în timp ce cer mai multe informații specifice pentru a da un răspuns mai țintit.",
    sources: [
      { title: "Documentația Oficială React", url: "https://react.dev" },
      {
        title: "Instrumente pentru Dezvoltatori React",
        url: "https://react.dev/learn",
      },
    ],
  },
  {
    content:
      "Next.js este un framework excelent construit pe React care oferă rendering pe server, generare de site-uri statice și multe alte funcții puternice din cutie.",
    reasoning:
      "Utilizatorul a menționat Next.js, așa că ar trebui să explic relația sa cu React și să evidențiez beneficiile sale cheie pentru dezvoltarea web modernă.",
    sources: [
      { title: "Documentația Next.js", url: "https://nextjs.org/docs" },
      {
        title: "Ghidul Vercel Next.js",
        url: "https://vercel.com/guides/nextjs",
      },
    ],
  },
  {
    content:
      "TypeScript adaugă verificarea statică a tipurilor la JavaScript, ceea ce ajută la identificarea erorilor din timp și îmbunătățește calitatea codului. Este deosebit de valoros în aplicații mai mari.",
    reasoning:
      "TypeScript devine din ce în ce mai important în dezvoltarea modernă. Ar trebui să explic beneficiile sale păstrând explicația accesibilă.",
    sources: [
      {
        title: "Manualul TypeScript",
        url: "https://www.typescriptlang.org/docs",
      },
      {
        title: "TypeScript cu React",
        url: "https://react.dev/learn/typescript",
      },
    ],
  },
];

type ConversationHistoryItem = {
  id: string;
  date: Date;
  content: string;
  badgeText: string;
  badgeColor: "gray" | "yellow" | "red";
};

const conversationHistory: ConversationHistoryItem[] = [
  {
    id: "1",
    date: new Date(2024, 0, 15), // January 15, 2024
    content:
      "Salut Andrei, am revenit pentru programarea unui set de analize anuale...",
    badgeText: "Programare",
    badgeColor: "gray",
  },
  {
    id: "2",
    date: new Date(2024, 0, 12), // January 12, 2024
    content: "Am nevoie de adeverință de asigurat de la CNAS...",
    badgeText: "Adeverință asigurat",
    badgeColor: "yellow",
  },
  {
    id: "3",
    date: new Date(2024, 0, 10), // January 10, 2024
    content:
      "In ultima perioada m-a durut zona lombara foarte rau, fara a depun vreun efort semnificativ...",
    badgeText: "Trimitere RMN",
    badgeColor: "gray",
  },
  {
    id: "4",
    date: new Date(2024, 0, 8), // January 8, 2024
    content:
      "🎉 Buna Andrei, am programat prima vizita la noul medic de familie, dr. Dana Popescu.",
    badgeText: "Programare",
    badgeColor: "gray",
  },
  {
    id: "5",
    date: new Date(2024, 0, 5), // January 5, 2024
    content:
      "Doresc să schimb doctorul de familie deoarece mi-am schimbat domiciliul...",
    badgeText: "Schimbare doctor",
    badgeColor: "red",
  },
];

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const getBadgeStyles = (color: "gray" | "yellow" | "red") => {
  switch (color) {
    case "gray":
      return {
        backgroundColor: "#F4F4F5",
        color: "#3F3F46",
        fontWeight: 600,
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "8px",
        paddingRight: "8px",
        borderRadius: "6px",
      };
    case "yellow":
      return {
        backgroundColor: "#E8C46880",
        color: "#3F3F46",
        fontWeight: 600,
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "8px",
        paddingRight: "8px",
        borderRadius: "6px",
      };
    case "red":
      return {
        backgroundColor: "#DC2626",
        color: "#FFFFFF",
        fontWeight: 600,
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "8px",
        paddingRight: "8px",
        borderRadius: "6px",
      };
  }
};

export default function ClientPage() {
  const [mounted, setMounted] = React.useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  // Initialize after hydration to avoid SSR mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show history only when there are no messages (history hides after first message is submitted)
  const showHistory = mounted && messages.length === 0;

  const simulateTyping = useCallback(
    (
      messageId: string,
      content: string,
      reasoning?: string,
      sources?: Array<{ title: string; url: string }>
    ) => {
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        // Type 2-3 characters at a time for moderate typing speed
        const charsToAdd = Math.floor(Math.random() * 2) + 2; // 2-3 characters
        currentIndex += charsToAdd;

        // Ensure we don't exceed the content length
        if (currentIndex > content.length) {
          currentIndex = content.length;
        }

        // Update the message with current progress
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              const isComplete = currentIndex >= content.length;
              return {
                ...msg,
                content: content.slice(0, currentIndex),
                isStreaming: !isComplete,
                reasoning: isComplete ? reasoning : undefined,
                sources: isComplete ? sources : undefined,
              };
            }
            return msg;
          })
        );

        // If complete, clean up and stop
        if (currentIndex >= content.length) {
          clearInterval(typeInterval);
          setIsTyping(false);
          setStreamingMessageId(null);
        }
      }, 30); // 30ms interval for moderate typing speed
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen w-full flex-col bg-background">
          {/* Conversation Area */}
          <Conversation className="flex-1">
            <ConversationContent>
              {showHistory ? (
                <div className="flex flex-col gap-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Discutii anterioare
                  </h2>
                  <div className="flex flex-col overflow-hidden rounded-lg border border-border">
                    {conversationHistory.map((item, index) => {
                      const isFirst = index === 0;
                      const isLast = index === conversationHistory.length - 1;
                      const badgeStyles = getBadgeStyles(item.badgeColor);

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-4 border-b border-border bg-card px-4 hover:bg-accent/50 transition-colors h-[52px]",
                            isFirst && "rounded-t-lg",
                            isLast && "rounded-b-lg border-b-0"
                          )}
                        >
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(item.date)}
                          </span>
                          <span className="flex-1 text-sm text-foreground">
                            {item.content}
                          </span>
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap border-0"
                            style={badgeStyles}
                          >
                            {item.badgeText}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                              >
                                <MoreVerticalIcon className="h-4 w-4" />
                                <span className="sr-only">
                                  Mai multe opțiuni
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Vizualizare</DropdownMenuItem>
                              <DropdownMenuItem>Ștergere</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {mounted &&
                    messages.map((message) => (
                      <Message key={message.id} from={message.role}>
                        <MessageContent from={message.role}>
                          {message.content}
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
                </>
              )}
            </ConversationContent>
            {!showHistory && <ConversationScrollButton />}
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
      </SidebarInset>
    </SidebarProvider>
  );
}
