"use client";

import * as React from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  useConversation,
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
import {
  DoctorSelectionMap,
  type Doctor,
} from "@/components/doctor-selection-map";
import { Progress } from "@/components/ui/progress";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  reasoning?: string;
  sources?: Array<{ title: string; url: string }>;
  isStreaming?: boolean;
  options?: Array<{ label: string; value: string }>;
  mapAddress?: string; // Address to show in the map
  doctorSelected?: boolean; // Whether a doctor has been selected from this map
  selectedDoctor?: {
    name: string;
    specialty?: string;
  }; // Doctor info for formatting
  progressBar?: {
    label: string;
    progress: number;
    completed: boolean;
    completedText?: string;
  };
  showSignButton?: boolean;
};

type ConversationFlowState = null | "asking_reason" | "asking_new_address";

const USER_ADDRESS =
  "Sector 6, Mun.Bucureşti, Str.Dezrobirii, nr. 25, bl. 1, sc. 2, et. 7, ap. 91";

// Check if message is about changing family doctor
const isChangingDoctorMessage = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("medic") ||
    normalized.includes("medic familie") ||
    normalized.includes("medic de familie") ||
    normalized.includes("medicul de familie") ||
    normalized.includes("doctor") ||
    normalized.includes("doctor familie") ||
    normalized.includes("doctor de familie") ||
    normalized.includes("doctorul de familie")
  );
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

// Component to handle auto-scroll when user sends messages
function AutoScrollHandler({ messages }: { messages: ChatMessage[] }) {
  const { enableAutoScroll } = useConversation();
  const lastUserMessageIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    // Get all user message IDs
    const currentUserMessageIds = new Set(
      messages.filter((msg) => msg.role === "user").map((msg) => msg.id)
    );

    // Check if there are new user messages
    const hasNewUserMessage = Array.from(currentUserMessageIds).some(
      (id) => !lastUserMessageIdsRef.current.has(id)
    );

    // If a new user message was added, enable auto-scroll
    if (hasNewUserMessage) {
      enableAutoScroll();
    }

    // Update ref
    lastUserMessageIdsRef.current = currentUserMessageIds;
  }, [messages, enableAutoScroll]);

  return null;
}

export default function ClientPage() {
  const [mounted, setMounted] = React.useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [flowState, setFlowState] = useState<ConversationFlowState>(null);

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
      let typeInterval: NodeJS.Timeout | null = null;

      // Ensure message starts with empty content immediately
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: "",
              isStreaming: true,
            };
          }
          return msg;
        })
      );

      // Use setTimeout with 0 delay to ensure the empty content is rendered before starting animation
      const startTimeout = setTimeout(() => {
        typeInterval = setInterval(() => {
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
            if (typeInterval) {
              clearInterval(typeInterval);
            }
            setIsTyping(false);
            setStreamingMessageId(null);
          }
        }, 30); // 30ms interval for moderate typing speed
      }, 0);

      // Return cleanup function
      return () => {
        clearTimeout(startTimeout);
        if (typeInterval) {
          clearInterval(typeInterval);
        }
      };
    },
    []
  );

  // Handle doctor selection from map
  const handleDoctorSelected = useCallback(
    (doctor: Doctor) => {
      // Mark the map message as having a selected doctor
      setMessages((prev) =>
        prev.map((msg) =>
          msg.mapAddress ? { ...msg, doctorSelected: true } : msg
        )
      );

      // Create user message with doctor name and specialty
      const doctorName = doctor.name;
      const doctorMessage = doctor.specialty
        ? `${doctorName}, ${doctor.specialty}`
        : doctorName;

      const userMessage: ChatMessage = {
        id: nanoid(),
        content: doctorMessage,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsTyping(true);

      // First assistant message: confirmation
      setTimeout(() => {
        const confirmationMessageId = nanoid();
        const specialtyText = doctor.specialty ? `, ${doctor.specialty}` : "";
        const confirmationContent = `Ai ales ${doctorName}${specialtyText}. Pregătim documentația necesară pentru tine.`;

        const confirmationMessage: ChatMessage = {
          id: confirmationMessageId,
          content: "", // Start with empty content for typing animation
          role: "assistant",
          timestamp: new Date(),
          isStreaming: true,
          selectedDoctor: {
            name: doctor.name,
            specialty: doctor.specialty,
          },
        };
        setMessages((prev) => [...prev, confirmationMessage]);
        setStreamingMessageId(confirmationMessageId);

        // Start typing animation immediately
        simulateTyping(confirmationMessageId, confirmationContent);

        // After confirmation message completes, start progress messages
        setTimeout(() => {
          // Step 1: Carte de identitate
          const step1Id = nanoid();
          const step1Message: ChatMessage = {
            id: step1Id,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            progressBar: {
              label:
                "[Verificare 1/3] Preluăm cartea de identitate din ghiseul.ro/ROeID.",
              progress: 0,
              completed: false,
              completedText:
                "[Verificare 1/3] Preluăm cartea de identitate din ghiseul.ro/ROeID.",
            },
          };
          setMessages((prev) => [...prev, step1Message]);

          // Animate progress bar for step 1 (3-4 seconds)
          let progress1 = 0;
          const progressInterval1 = setInterval(() => {
            progress1 += 0.8; // ~3.75 seconds to complete (100 / 0.8 * 30ms ≈ 3750ms)
            if (progress1 >= 100) {
              clearInterval(progressInterval1);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === step1Id
                    ? {
                        ...msg,
                        content: "",
                        progressBar: {
                          label:
                            "[Verificare 1/3] Preluăm cartea de identitate din ghiseul.ro/ROeID.",
                          progress: 100,
                          completed: true,
                          completedText:
                            "✓ Preluăm cartea de identitate din ghiseul.ro/ROeID.",
                        },
                      }
                    : msg
                )
              );

              // Step 2: CNAS check
              setTimeout(() => {
                const step2Id = nanoid();
                const step2Message: ChatMessage = {
                  id: step2Id,
                  content: "",
                  role: "assistant",
                  timestamp: new Date(),
                  progressBar: {
                    label:
                      "[Verificare 2/3] Confirmăm statutul de asigurat în timp real cu CNAS.",
                    progress: 0,
                    completed: false,
                    completedText:
                      "[Verificare 2/3] Confirmăm statutul de asigurat în timp real cu CNAS.",
                  },
                };
                setMessages((prev) => [...prev, step2Message]);

                // Animate progress bar for step 2 (3-4 seconds)
                let progress2 = 0;
                const progressInterval2 = setInterval(() => {
                  progress2 += 0.8; // ~3.75 seconds to complete
                  if (progress2 >= 100) {
                    clearInterval(progressInterval2);
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === step2Id
                          ? {
                              ...msg,
                              content: "",
                              progressBar: {
                                label:
                                  "[Verificare 2/3] Confirmăm statutul de asigurat în timp real cu CNAS.",
                                progress: 100,
                                completed: true,
                                completedText:
                                  "✓ Confirmăm statutul de asigurat în timp real cu CNAS.",
                              },
                            }
                          : msg
                      )
                    );

                    // Step 3: Generate request
                    setTimeout(() => {
                      const step3Id = nanoid();
                      const step3Message: ChatMessage = {
                        id: step3Id,
                        content: "",
                        role: "assistant",
                        timestamp: new Date(),
                        progressBar: {
                          label:
                            "[Verificare 3/3] Completăm cererea de înscriere",
                          progress: 0,
                          completed: false,
                          completedText:
                            "[Verificare 3/3] Completăm cererea de înscriere",
                        },
                        showSignButton: false,
                      };
                      setMessages((prev) => [...prev, step3Message]);

                      // Animate progress bar for step 3 (3-4 seconds)
                      let progress3 = 0;
                      const progressInterval3 = setInterval(() => {
                        progress3 += 0.8; // ~3.75 seconds to complete
                        if (progress3 >= 100) {
                          clearInterval(progressInterval3);
                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === step3Id
                                ? {
                                    ...msg,
                                    content: "",
                                    progressBar: {
                                      label:
                                        "[Verificare 3/3] Completăm cererea de înscriere",
                                      progress: 100,
                                      completed: true,
                                      completedText:
                                        "✓ Completăm cererea de înscriere",
                                    },
                                    showSignButton: true,
                                  }
                                : msg
                            )
                          );
                          setIsTyping(false);
                        } else {
                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === step3Id
                                ? {
                                    ...msg,
                                    progressBar: {
                                      ...msg.progressBar!,
                                      progress: progress3,
                                    },
                                  }
                                : msg
                            )
                          );
                        }
                      }, 30);
                    }, 500);
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === step2Id
                          ? {
                              ...msg,
                              progressBar: {
                                ...msg.progressBar!,
                                progress: progress2,
                              },
                            }
                          : msg
                      )
                    );
                  }
                }, 30);
              }, 500);
            } else {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === step1Id
                    ? {
                        ...msg,
                        progressBar: {
                          ...msg.progressBar!,
                          progress: progress1,
                        },
                      }
                    : msg
                )
              );
            }
          }, 30);
        }, 2000);
      }, 800);
    },
    [simulateTyping]
  );

  // Handle option selection from buttons
  const handleOptionSelect = useCallback(
    (optionValue: string) => {
      // Add user message with selected option
      const userMessage: ChatMessage = {
        id: nanoid(),
        content: optionValue,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsTyping(true);

      setTimeout(() => {
        if (flowState === "asking_reason") {
          if (optionValue === "Mi-am schimbat adresa") {
            const assistantMessageId = nanoid();
            const responseContent = `Adresa ta actuală în platformă este ${USER_ADDRESS}.\n\nCare este noua ta adresă? Te rog include strada și număr pentru a îți fi cât mai de ajutor.`;

            const assistantMessage: ChatMessage = {
              id: assistantMessageId,
              content: "",
              role: "assistant",
              timestamp: new Date(),
              isStreaming: true,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingMessageId(assistantMessageId);
            setFlowState("asking_new_address");

            // Start typing simulation
            simulateTyping(assistantMessageId, responseContent);
          } else {
            // Handle other options (for now, just random response)
            const responseData =
              sampleResponses[
                Math.floor(Math.random() * sampleResponses.length)
              ];
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
            setFlowState(null);

            simulateTyping(
              assistantMessageId,
              responseData.content,
              responseData.reasoning,
              responseData.sources
            );
          }
        }
      }, 800);
    },
    [flowState, simulateTyping]
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

      // Check if this is about changing family doctor
      if (isChangingDoctorMessage(value.trim())) {
        setTimeout(() => {
          const assistantMessageId = nanoid();
          const responseContent = "De ce vrei să schimbi medicul de familie?";
          const options = [
            { label: "Mi-am schimbat adresa", value: "Mi-am schimbat adresa" },
            {
              label: "Actualul medic nu e disponibil",
              value: "Actualul medic nu e disponibil",
            },
            {
              label: "Nu sunt mulțumit de medicul actual",
              value: "Nu sunt mulțumit de medicul actual",
            },
          ];

          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            isStreaming: true,
            options,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingMessageId(assistantMessageId);
          setFlowState("asking_reason");

          // Start typing simulation
          simulateTyping(assistantMessageId, responseContent);
        }, 800);
        return;
      }

      // Handle new address input if in asking_new_address flow
      if (flowState === "asking_new_address") {
        setTimeout(() => {
          // Show map with the entered address
          const assistantMessageId = nanoid();

          const assistantMessageContent =
            "Am găsit adresa ta. Te rog selectează adresa corectă din hartă și vei vedea medicii de familie disponibili în apropiere.";
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            isStreaming: true,
            mapAddress: value.trim(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingMessageId(assistantMessageId);
          setFlowState(null);

          // Start typing simulation
          simulateTyping(assistantMessageId, assistantMessageContent);
        }, 800);
        return;
      }

      // Default: random response
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
    [isTyping, simulateTyping, flowState]
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen w-full flex-col bg-background">
          {/* Conversation Area */}
          <Conversation className="flex-1">
            <AutoScrollHandler messages={messages} />
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
                    messages.map((message) => {
                      // Format message content to make address bold
                      const formatMessageContent = (content: string) => {
                        if (content.includes(USER_ADDRESS)) {
                          const parts = content.split(USER_ADDRESS);
                          return (
                            <>
                              {parts[0]}
                              <strong>{USER_ADDRESS}</strong>
                              {parts[1]}
                            </>
                          );
                        }
                        return content;
                      };

                      const formatDoctorMessage = (
                        message: ChatMessage,
                        content: string
                      ): React.ReactNode => {
                        if (message.selectedDoctor) {
                          const { name, specialty } = message.selectedDoctor;

                          // Create parts array to build the formatted message
                          const parts: React.ReactNode[] = [];
                          let remainingContent = content;

                          // Find and replace doctor name
                          const nameIndex = remainingContent.indexOf(name);
                          if (nameIndex !== -1) {
                            // Add text before name
                            if (nameIndex > 0) {
                              parts.push(remainingContent.slice(0, nameIndex));
                            }
                            // Add bold name
                            parts.push(<strong key="name">{name}</strong>);
                            remainingContent = remainingContent.slice(
                              nameIndex + name.length
                            );
                          }

                          // Find and replace specialty if exists
                          if (specialty) {
                            const specialtyIndex =
                              remainingContent.indexOf(specialty);
                            if (specialtyIndex !== -1) {
                              // Add text between name and specialty (should be ", ")
                              if (specialtyIndex > 0) {
                                parts.push(
                                  remainingContent.slice(0, specialtyIndex)
                                );
                              }
                              // Add bold specialty
                              parts.push(
                                <strong key="specialty">{specialty}</strong>
                              );
                              remainingContent = remainingContent.slice(
                                specialtyIndex + specialty.length
                              );
                            }
                          }

                          // Add remaining content
                          if (remainingContent) {
                            parts.push(remainingContent);
                          }

                          // If no replacements were made, return formatted content
                          if (parts.length === 0) {
                            return formatMessageContent(content);
                          }

                          return <>{parts}</>;
                        }
                        return formatMessageContent(content);
                      };

                      return (
                        <Message key={message.id} from={message.role}>
                          {message.progressBar ? (
                            <MessageContent from={message.role}>
                              <div
                                className="space-y-2"
                                style={{ width: "500px" }}
                              >
                                <div className="text-sm font-medium">
                                  {message.progressBar.completed
                                    ? message.progressBar.completedText
                                    : message.progressBar.label}
                                </div>
                                <Progress
                                  value={message.progressBar.progress}
                                  className="h-2 w-full"
                                />
                              </div>
                            </MessageContent>
                          ) : (
                            message.content && (
                              <MessageContent from={message.role}>
                                {message.selectedDoctor
                                  ? formatDoctorMessage(
                                      message,
                                      message.content
                                    )
                                  : formatMessageContent(message.content)}
                              </MessageContent>
                            )
                          )}
                          {message.options &&
                            message.options.length > 0 &&
                            !message.isStreaming && (
                              <div className="mt-3 flex flex-col gap-2">
                                {message.options.map((option, index) => {
                                  const isClickable =
                                    option.value === "Mi-am schimbat adresa";
                                  return (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
                                      onClick={() => {
                                        if (isClickable) {
                                          handleOptionSelect(option.value);
                                        }
                                      }}
                                      style={
                                        !isClickable
                                          ? { pointerEvents: "none" }
                                          : undefined
                                      }
                                    >
                                      {option.label}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
                          {message.mapAddress && !message.isStreaming && (
                            <div
                              className={`mt-4 ${
                                message.doctorSelected ? "" : "px-8"
                              }`}
                              style={
                                message.doctorSelected
                                  ? {}
                                  : {
                                      position: "relative",
                                      left: "50%",
                                      right: "50%",
                                      marginLeft: "calc(-50vw + 50%)",
                                      marginRight: "calc(-50vw + 50%)",
                                      width: "100vw",
                                      maxWidth:
                                        "calc(100vw - var(--sidebar-width, 16rem))",
                                    }
                              }
                            >
                              <DoctorSelectionMap
                                initialAddress={message.mapAddress}
                                onDoctorSelected={handleDoctorSelected}
                                readonly={message.doctorSelected || false}
                              />
                            </div>
                          )}
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
                          {message.showSignButton && (
                            <div className="mt-3">
                              <Button
                                onClick={() => {
                                  // Handle sign button click
                                  const signMessageId = nanoid();
                                  const signMessage: ChatMessage = {
                                    id: signMessageId,
                                    content:
                                      "Cererea a fost semnată cu succes!",
                                    role: "assistant",
                                    timestamp: new Date(),
                                  };
                                  setMessages((prev) => [...prev, signMessage]);
                                }}
                                className="w-full"
                              >
                                Semnează cererea
                              </Button>
                            </div>
                          )}
                        </Message>
                      );
                    })}
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
