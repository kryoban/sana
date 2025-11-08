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
import { MoreVerticalIcon, Sparkles } from "lucide-react";
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
import { SignatureDialog } from "@/components/signature-dialog";

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
  signed?: boolean; // Whether the signature has been submitted
  showConfirmButton?: boolean;
  showSuccessButtons?: boolean;
  pdfData?: string; // Base64 PDF data for download
};

type ConversationFlowState =
  | null
  | "asking_reason"
  | "asking_new_address"
  | "asking_referral_specialty";

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

// Check if message is about referral (trimitere)
const isReferralMessage = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return normalized.includes("trimitere");
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
  status?: string; // Optional status for database requests
  requestId?: number; // Database request ID for downloading PDF
  requestType?: string; // Request type: "inscriere" or "trimitere"
};

// Static conversation history (fallback/example items)
const staticConversationHistory: ConversationHistoryItem[] = [
  {
    id: "1",
    date: new Date(2025, 7, 15), // August 15, 2025
    content:
      "Salut Andrei, am revenit pentru programarea unui set de analize anuale...",
    badgeText: "Programare",
    badgeColor: "gray",
  },
  {
    id: "2",
    date: new Date(2024, 11, 12), // December 12, 2024
    content: "Am nevoie de adeverință de asigurat de la CNAS...",
    badgeText: "Adeverință asigurat",
    badgeColor: "gray",
  },
  {
    id: "3",
    date: new Date(2024, 5, 10), // June 10, 2024
    content:
      "In ultima perioada m-a durut zona lombara foarte rau, fara a depun vreun efort semnificativ...",
    badgeText: "Trimitere RMN",
    badgeColor: "gray",
  },
  {
    id: "4",
    date: new Date(2023, 11, 8), // December 8, 2023
    content:
      "🎉 Buna Andrei, am programat prima vizita la noul medic de familie, dr. Dana Popescu.",
    badgeText: "Programare",
    badgeColor: "gray",
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
        lineHeight: "1.25",
        minHeight: "22px",
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
        lineHeight: "1.25",
        minHeight: "22px",
      };
    case "red":
      return {
        backgroundColor: "#250065",
        color: "#FFFFFF",
        fontWeight: 600,
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "8px",
        paddingRight: "8px",
        lineHeight: "1.25",
        minHeight: "22px",
      };
  }
};

// Get status badge component (matching type badge dimensions, keeping outline variant with border)
// All badges use consistent padding for same height (matching "Schimbare doctor")
const getStatusBadge = (status: string) => {
  const statusLabels: Record<string, string> = {
    pending: "În așteptare",
    approved: "Aprobată",
    rejected: "Respinsă",
  };

  // For pending status, use the same yellow style as "Adeverință asigurat"
  // For approved status, use the same green style as available pins (#06A600)
  // All badges use consistent padding for same height (matching "Schimbare doctor")
  const badgeStyles =
    status === "pending"
      ? {
          backgroundColor: "#E8C46880",
          color: "#3F3F46",
          fontWeight: 600,
          paddingTop: "4px",
          paddingBottom: "4px",
          paddingLeft: "8px",
          paddingRight: "8px",
          lineHeight: "1.25",
          minHeight: "22px",
        }
      : status === "approved"
      ? {
          backgroundColor: "#06A600",
          color: "#FFFFFF",
          fontWeight: 600,
          paddingTop: "4px",
          paddingBottom: "4px",
          paddingLeft: "8px",
          paddingRight: "8px",
          lineHeight: "1.25",
          minHeight: "22px",
        }
      : status === "rejected"
      ? {
          backgroundColor: "#DC2626",
          color: "#FFFFFF",
          fontWeight: 600,
          paddingTop: "4px",
          paddingBottom: "4px",
          paddingLeft: "8px",
          paddingRight: "8px",
          lineHeight: "1.25",
          minHeight: "22px",
        }
      : {
          fontWeight: 600,
          paddingTop: "4px",
          paddingBottom: "4px",
          paddingLeft: "8px",
          paddingRight: "8px",
          lineHeight: "1.25",
          minHeight: "22px",
        };

  const badgeClassName = "whitespace-nowrap border-0";

  return (
    <Badge variant="outline" className={badgeClassName} style={badgeStyles}>
      {statusLabels[status] || status}
    </Badge>
  );
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
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<{
    name: string;
    specialty?: string;
  } | null>(null);
  const [pendingRequestData, setPendingRequestData] = useState<{
    signatureDataUrl: string;
    userData: any;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInscriereDoctor, setLastInscriereDoctor] = useState<{
    name: string;
    specialty?: string;
  } | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationHistoryItem[]
  >(staticConversationHistory);

  // Initialize after hydration to avoid SSR mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Function to fetch requests and update conversation history
  const refreshConversationHistory = useCallback(async () => {
    try {
      // Use the patient CNP from the userData
      const patientCnp = "1901213254491"; // This matches the CNP used in the signature dialog
      const response = await fetch(`/api/requests?cnp=${patientCnp}`);
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }
      const data = await response.json();
      const requests = data.requests || [];

      // Find the last inscriere doctor
      const inscriereRequests = requests.filter(
        (req: any) => req.type === "inscriere"
      );
      if (inscriereRequests.length > 0) {
        const lastInscriere = inscriereRequests[0]; // Already sorted by createdAt desc
        setLastInscriereDoctor({
          name: lastInscriere.doctorName,
          specialty: lastInscriere.doctorSpecialty || undefined,
        });
      }

      // Convert requests to ConversationHistoryItem format
      const requestHistoryItems: ConversationHistoryItem[] = requests.map(
        (request: any) => {
          if (request.type === "trimitere") {
            return {
              id: `request-${request.id}`,
              date: new Date(request.createdAt),
              content: `Cerere de trimitere la ${request.referralSpecialty} trimisă către ${request.doctorName}`,
              badgeText: "Trimitere",
              badgeColor: "gray" as const,
              status: request.status,
              requestId: request.id,
              requestType: request.type,
            };
          } else {
            return {
              id: `request-${request.id}`,
              date: new Date(request.createdAt),
              content:
                "Cerere de schimbare medic trimisă către " + request.doctorName,
              badgeText: "Schimbare doctor",
              badgeColor: "red" as const,
              status: request.status,
              requestId: request.id,
              requestType: request.type,
            };
          }
        }
      );

      // Combine request items with static history, then sort by date (newest first)
      const allItems = [...requestHistoryItems, ...staticConversationHistory];
      allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

      setConversationHistory(allItems);
    } catch (error) {
      console.error("Error fetching requests:", error);
      // On error, just use static history
      setConversationHistory(staticConversationHistory);
    }
  }, []);

  // Fetch requests from database and add them to conversation history
  React.useEffect(() => {
    if (!mounted) return;
    refreshConversationHistory();
  }, [mounted, refreshConversationHistory]);

  // Handle PDF download from base64 data
  const handleDownloadPDF = useCallback((pdfData: string) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cerere-inscriere-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  }, []);

  // Handle PDF download from API (for approved requests)
  const handleDownloadRequestPDF = useCallback(
    async (requestId: number, requestType?: string) => {
      try {
        const response = await fetch(`/api/requests/${requestId}/pdf`);
        if (!response.ok) {
          throw new Error("Failed to fetch PDF");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const typePrefix =
          requestType === "trimitere" ? "trimitere" : "inscriere";
        link.download = `cerere-${typePrefix}-${requestId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading PDF:", error);
        alert("Eroare la descărcarea PDF-ului");
      }
    },
    []
  );

  // Handle starting new conversation
  const handleStartNewConversation = useCallback(() => {
    setMessages([]);
    setInputValue("");
    setFlowState(null);
    setSelectedDoctor(null);
    setPendingRequestData(null);
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
        // Store selected doctor for PDF generation
        setSelectedDoctor({
          name: doctor.name,
          specialty: doctor.specialty,
        });

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
    async (optionValue: string) => {
      // Add user message with selected option
      const userMessage: ChatMessage = {
        id: nanoid(),
        content: optionValue,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsTyping(true);

      setTimeout(async () => {
        if (flowState === "asking_reason") {
          if (optionValue === "Mi-am schimbat domiciliul") {
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
        } else if (flowState === "asking_referral_specialty") {
          // Handle referral specialty selection
          if (!lastInscriereDoctor) {
            // No doctor found, show error
            const errorMessageId = nanoid();
            const errorMessage: ChatMessage = {
              id: errorMessageId,
              content:
                "Nu am găsit un medic de familie asociat. Te rog să te înscrii mai întâi la un medic de familie.",
              role: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setIsTyping(false);
            setFlowState(null);
            return;
          }

          try {
            // Prepare user data (same as for inscriere)
            const addressParts = USER_ADDRESS.split(",").map((s) => s.trim());
            const sectorMatch = addressParts.find((p) =>
              p.startsWith("Sector")
            );
            const streetMatch = addressParts.find((p) => p.startsWith("Str."));
            const numberMatch = addressParts.find((p) => p.startsWith("nr."));
            const blockMatch = addressParts.find((p) => p.startsWith("bl."));
            const entranceMatch = addressParts.find((p) => p.startsWith("sc."));
            const apartmentMatch = addressParts.find((p) =>
              p.startsWith("ap.")
            );

            const sector = sectorMatch
              ? sectorMatch.replace("Sector", "").trim()
              : "";
            const street = streetMatch
              ? streetMatch.replace("Str.", "").trim()
              : "";
            const number = numberMatch
              ? numberMatch.replace("nr.", "").trim()
              : "";
            const block = blockMatch
              ? blockMatch.replace("bl.", "").trim()
              : "";
            const entrance = entranceMatch
              ? entranceMatch.replace("sc.", "").trim()
              : "";
            const apartment = apartmentMatch
              ? apartmentMatch.replace("ap.", "").trim()
              : "";

            const userData = {
              name: "GEORGESCU ANDREI",
              cnp: "1901213254491",
              birthDate: "13.12.1990",
              citizenship: "romana",
              address: {
                street: street || "Dezrobirii",
                number: number || "25",
                block: block || "1",
                entrance: entrance || "2",
                apartment: apartment || "91",
                sector: `Sector ${sector || "6"}`,
              },
              idType: "Carte de identitate",
              idSeries: "AX",
              idNumber: "123456",
              idIssuedBy: "SPCLEP Sector 6",
              idIssueDate: "15.03.2020",
            };

            // Submit trimitere request
            setIsSubmitting(true);
            const response = await fetch("/api/requests", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "trimitere",
                patientName: userData.name,
                patientCnp: userData.cnp,
                patientBirthDate: userData.birthDate,
                patientCitizenship: userData.citizenship,
                patientAddress: userData.address,
                patientIdType: userData.idType,
                patientIdSeries: userData.idSeries,
                patientIdNumber: userData.idNumber,
                patientIdIssuedBy: userData.idIssuedBy,
                patientIdIssueDate: userData.idIssueDate,
                doctorName: lastInscriereDoctor.name,
                doctorSpecialty: lastInscriereDoctor.specialty,
                referralSpecialty: optionValue,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to save trimitere request");
            }

            // Refresh conversation history
            refreshConversationHistory();

            // Show success message
            const successMessageId = nanoid();
            const successMessage: ChatMessage = {
              id: successMessageId,
              content: `Cererea de trimitere la ${optionValue} a fost trimisă cu succes către medicul tău de familie, ${lastInscriereDoctor.name}. Vei primi o notificare când trimiterea este gata.`,
              role: "assistant",
              timestamp: new Date(),
              showSuccessButtons: true,
            };
            setMessages((prev) => [...prev, successMessage]);
            setFlowState(null);
          } catch (error) {
            console.error("Error submitting trimitere request:", error);
            const errorMessageId = nanoid();
            const errorMessage: ChatMessage = {
              id: errorMessageId,
              content:
                "A apărut o eroare la trimiterea cererii. Te rog încearcă din nou.",
              role: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          } finally {
            setIsSubmitting(false);
            setIsTyping(false);
          }
        }
      }, 800);
    },
    [flowState, simulateTyping, lastInscriereDoctor, refreshConversationHistory]
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

      // Check if this is about referral (trimitere) - only if not in another flow
      if (flowState === null && isReferralMessage(value.trim())) {
        setTimeout(() => {
          const assistantMessageId = nanoid();
          const responseContent =
            "Pentru ce specializare ai nevoie de trimitere?";
          const options = [
            {
              label: "Cardiologie",
              value: "Cardiologie",
            },
            {
              label: "Dermatologie",
              value: "Dermatologie",
            },
            {
              label: "Endocrinologie",
              value: "Endocrinologie",
            },
            {
              label: "Gastroenterologie",
              value: "Gastroenterologie",
            },
            {
              label: "Neurologie",
              value: "Neurologie",
            },
            {
              label: "Oftalmologie",
              value: "Oftalmologie",
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
          setFlowState("asking_referral_specialty");

          // Start typing simulation
          simulateTyping(assistantMessageId, responseContent);
        }, 800);
        return;
      }

      // Check if this is about changing family doctor
      if (flowState === null && isChangingDoctorMessage(value.trim())) {
        setTimeout(() => {
          const assistantMessageId = nanoid();
          const responseContent = "De ce vrei să schimbi medicul de familie?";
          const options = [
            {
              label: "Mi-am schimbat domiciliul",
              value: "Mi-am schimbat domiciliul",
            },
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
      <AppSidebar variant="pacient" activeMenuItem="Discută cu Ana" />
      <SidebarInset>
        <div className="flex h-screen w-full flex-col bg-background">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center px-6">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Sparkles className="size-6 text-[#FF008C]" /> Discută cu Ana
              </h1>
            </div>
          </header>
          {/* Conversation Area */}
          <Conversation className="flex-1">
            <AutoScrollHandler messages={messages} />
            <ConversationContent>
              {showHistory ? (
                <div className="flex flex-col gap-6">
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
                          <div className="flex items-center gap-2">
                            {item.status && getStatusBadge(item.status)}
                            <Badge
                              variant="outline"
                              className="whitespace-nowrap border-0"
                              style={badgeStyles}
                            >
                              {item.badgeText}
                            </Badge>
                          </div>
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
                              {item.requestId && item.status === "approved" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownloadRequestPDF(
                                      item.requestId!,
                                      item.requestType
                                    )
                                  }
                                >
                                  Descarcă PDF
                                </DropdownMenuItem>
                              )}
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

                      const formatSuccessMessage = (
                        content: string
                      ): React.ReactNode => {
                        const successText = "Cererea a fost trimisă cu succes!";
                        const nextStepsText = "Ce urmează:";

                        // Helper to convert text with newlines to React nodes
                        const textWithNewlines = (
                          text: string,
                          keyPrefix: string
                        ): React.ReactNode[] => {
                          if (!text) return [];
                          const lines = text.split("\n");
                          const nodes: React.ReactNode[] = [];
                          lines.forEach((line, idx) => {
                            if (idx > 0) {
                              nodes.push(<br key={`${keyPrefix}-br-${idx}`} />);
                            }
                            if (line) {
                              nodes.push(line);
                            }
                          });
                          return nodes;
                        };

                        const parts: React.ReactNode[] = [];

                        // Split content into segments
                        const successIndex = content.indexOf(successText);
                        const nextStepsIndex = content.indexOf(nextStepsText);

                        if (successIndex !== -1) {
                          // Text before success message
                          if (successIndex > 0) {
                            parts.push(
                              ...textWithNewlines(
                                content.slice(0, successIndex),
                                "before-success"
                              )
                            );
                          }
                          // Bold success text
                          parts.push(
                            <strong key="success">{successText}</strong>
                          );

                          if (
                            nextStepsIndex !== -1 &&
                            nextStepsIndex > successIndex
                          ) {
                            // Text between success and next steps
                            const betweenText = content.slice(
                              successIndex + successText.length,
                              nextStepsIndex
                            );
                            parts.push(
                              ...textWithNewlines(betweenText, "between")
                            );
                            // Bold next steps text
                            parts.push(
                              <strong key="next-steps">{nextStepsText}</strong>
                            );
                            // Text after next steps
                            const afterText = content.slice(
                              nextStepsIndex + nextStepsText.length
                            );
                            parts.push(...textWithNewlines(afterText, "after"));
                          } else {
                            // No next steps text found, just add remaining content
                            const afterText = content.slice(
                              successIndex + successText.length
                            );
                            parts.push(...textWithNewlines(afterText, "after"));
                          }
                        } else if (nextStepsIndex !== -1) {
                          // Only next steps text found (unlikely but handle it)
                          if (nextStepsIndex > 0) {
                            parts.push(
                              ...textWithNewlines(
                                content.slice(0, nextStepsIndex),
                                "before-next"
                              )
                            );
                          }
                          parts.push(
                            <strong key="next-steps">{nextStepsText}</strong>
                          );
                          const afterText = content.slice(
                            nextStepsIndex + nextStepsText.length
                          );
                          parts.push(...textWithNewlines(afterText, "after"));
                        } else {
                          // Neither found, return content as is
                          return content;
                        }

                        return <>{parts}</>;
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
                                  className="h-1 w-full"
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
                                  : message.content.includes(
                                      "Cererea a fost trimisă cu succes!"
                                    )
                                  ? formatSuccessMessage(message.content)
                                  : formatMessageContent(message.content)}
                              </MessageContent>
                            )
                          )}
                          {message.options &&
                            message.options.length > 0 &&
                            !message.isStreaming && (
                              <div className="mt-3 flex flex-col gap-2">
                                {message.options.map((option, index) => {
                                  // All options are clickable now
                                  // For referral specialty flow, all options are clickable
                                  // For other flows, we can make all clickable or keep specific logic
                                  const isClickable = true; // Make all options clickable
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
                                      disabled={!isClickable || isSubmitting}
                                    >
                                      {option.label}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
                          {message.mapAddress && !message.isStreaming && (
                            <div
                              className={`mt-4`}
                              style={
                                message.doctorSelected
                                  ? {}
                                  : {
                                      position: "relative",
                                      width: "100%",
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
                          {message.showSuccessButtons && (
                            <div className="mt-3 flex gap-2">
                              {message.pdfData && (
                                <Button
                                  onClick={() => {
                                    handleDownloadPDF(message.pdfData!);
                                  }}
                                  variant="outline"
                                  className="flex-1 bg-[#FF008C] hover:bg-[#E6007A] text-white hover:text-white border-[#FF008C] hover:border-[#E6007A]"
                                >
                                  Descarcă cererea
                                </Button>
                              )}
                              <Button
                                onClick={handleStartNewConversation}
                                variant="outline"
                                className="flex-1"
                              >
                                Începe conversație nouă
                              </Button>
                            </div>
                          )}
                          {message.showSignButton && !message.signed && (
                            <div className="mt-3">
                              <Button
                                onClick={() => {
                                  setIsSignatureDialogOpen(true);
                                }}
                                className="w-full bg-[#FF008C] hover:bg-[#E6007A] text-white"
                              >
                                Semnează cererea
                              </Button>
                            </div>
                          )}
                          {message.signed && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              Cerere semnată cu succes
                            </div>
                          )}
                          {message.showConfirmButton && (
                            <div className="mt-3">
                              <Button
                                onClick={async () => {
                                  if (!pendingRequestData || !selectedDoctor)
                                    return;

                                  // Show user confirmation message
                                  const userConfirmMessage: ChatMessage = {
                                    id: nanoid(),
                                    content:
                                      "Confirm ca vreau sa trimit cererea",
                                    role: "user",
                                    timestamp: new Date(),
                                  };
                                  setMessages((prev) => [
                                    ...prev,
                                    userConfirmMessage,
                                  ]);

                                  setIsSubmitting(true);
                                  try {
                                    // Generate PDF on the server
                                    const pdfResponse = await fetch(
                                      "/api/generate-pdf",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          signatureDataUrl:
                                            pendingRequestData.signatureDataUrl,
                                          doctorName: selectedDoctor.name,
                                          userData: pendingRequestData.userData,
                                        }),
                                      }
                                    );

                                    if (!pdfResponse.ok) {
                                      throw new Error("Failed to generate PDF");
                                    }

                                    const pdfResult = await pdfResponse.json();
                                    const pdfBase64 = pdfResult.pdfData;

                                    // Save to database
                                    const response = await fetch(
                                      "/api/requests",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          patientName:
                                            pendingRequestData.userData.name,
                                          patientCnp:
                                            pendingRequestData.userData.cnp,
                                          patientBirthDate:
                                            pendingRequestData.userData
                                              .birthDate,
                                          patientCitizenship:
                                            pendingRequestData.userData
                                              .citizenship,
                                          patientAddress:
                                            pendingRequestData.userData.address,
                                          patientIdType:
                                            pendingRequestData.userData.idType,
                                          patientIdSeries:
                                            pendingRequestData.userData
                                              .idSeries,
                                          patientIdNumber:
                                            pendingRequestData.userData
                                              .idNumber,
                                          patientIdIssuedBy:
                                            pendingRequestData.userData
                                              .idIssuedBy,
                                          patientIdIssueDate:
                                            pendingRequestData.userData
                                              .idIssueDate,
                                          doctorName: selectedDoctor.name,
                                          doctorSpecialty:
                                            selectedDoctor.specialty,
                                          pdfData: pdfBase64,
                                          signatureDataUrl:
                                            pendingRequestData.signatureDataUrl,
                                        }),
                                      }
                                    );

                                    if (!response.ok) {
                                      throw new Error("Failed to save request");
                                    }

                                    // Refresh conversation history to show the new request
                                    refreshConversationHistory();

                                    // Show success message
                                    const successMessageId = nanoid();
                                    const successMessage: ChatMessage = {
                                      id: successMessageId,
                                      content: `Cererea a fost trimisă cu succes!\nAi trimis în format digital solicitarea de înscriere la ${selectedDoctor.name}. Acum, medicul va revizui cererea cu ajutorul Ana.\n\nCe urmează:\nMedicul de familie are la dispoziție legal 15 zile pentru a aproba cererea. Vei primi o notificare imediată prin Ana când înscrierea este confirmată. Nu este necesară nicio deplasare fizică.`,
                                      role: "assistant",
                                      timestamp: new Date(),
                                      showSuccessButtons: true,
                                      pdfData: pdfBase64,
                                    };
                                    setMessages((prev) => [
                                      ...prev,
                                      successMessage,
                                    ]);

                                    // Clear pending data
                                    setPendingRequestData(null);

                                    // Remove confirm button from the message
                                    setMessages((prev) =>
                                      prev.map((msg) =>
                                        msg.id === message.id
                                          ? { ...msg, showConfirmButton: false }
                                          : msg
                                      )
                                    );
                                  } catch (error) {
                                    console.error(
                                      "Error submitting request:",
                                      error
                                    );
                                    const errorMessageId = nanoid();
                                    const errorMessage: ChatMessage = {
                                      id: errorMessageId,
                                      content:
                                        "A apărut o eroare la trimiterea cererii. Te rog încearcă din nou.",
                                      role: "assistant",
                                      timestamp: new Date(),
                                    };
                                    setMessages((prev) => [
                                      ...prev,
                                      errorMessage,
                                    ]);
                                  } finally {
                                    setIsSubmitting(false);
                                  }
                                }}
                                className="w-full bg-[#FF008C] hover:bg-[#E6007A] text-white"
                                disabled={isSubmitting}
                              >
                                {isSubmitting
                                  ? "Se trimite..."
                                  : "Trimite solicitarea"}
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
          <div className="border-border bg-card">
            <PromptInput
              onSubmit={handleSubmit}
              value={inputValue}
              onValueChange={setInputValue}
              placeholder={
                showHistory ? "Bună, Andrei! Cu ce te pot ajuta?" : undefined
              }
            />
          </div>
        </div>
      </SidebarInset>
      <SignatureDialog
        open={isSignatureDialogOpen}
        onOpenChange={setIsSignatureDialogOpen}
        onSignatureSubmit={(dataUrl) => {
          // Store the signature in pending request data

          // Parse user address from USER_ADDRESS constant
          // Format: "Sector 6, Mun.Bucureşti, Str.Dezrobirii, nr. 25, bl. 1, sc. 2, et. 7, ap. 91"
          const addressParts = USER_ADDRESS.split(",").map((s) => s.trim());
          const sectorMatch = addressParts.find((p) => p.startsWith("Sector"));
          const streetMatch = addressParts.find((p) => p.startsWith("Str."));
          const numberMatch = addressParts.find((p) => p.startsWith("nr."));
          const blockMatch = addressParts.find((p) => p.startsWith("bl."));
          const entranceMatch = addressParts.find((p) => p.startsWith("sc."));
          const apartmentMatch = addressParts.find((p) => p.startsWith("ap."));

          // Extract values
          const sector = sectorMatch
            ? sectorMatch.replace("Sector", "").trim()
            : "";
          const street = streetMatch
            ? streetMatch.replace("Str.", "").trim()
            : "";
          const number = numberMatch
            ? numberMatch.replace("nr.", "").trim()
            : "";
          const block = blockMatch ? blockMatch.replace("bl.", "").trim() : "";
          const entrance = entranceMatch
            ? entranceMatch.replace("sc.", "").trim()
            : "";
          const apartment = apartmentMatch
            ? apartmentMatch.replace("ap.", "").trim()
            : "";

          // Prepare user data for PDF
          const userData = {
            name: "GEORGESCU ANDREI",
            cnp: "1901213254491",
            birthDate: "13.12.1990",
            citizenship: "romana",
            address: {
              street: street || "Dezrobirii",
              number: number || "25",
              block: block || "1",
              entrance: entrance || "2",
              apartment: apartment || "91",
              sector: `Sector ${sector || "6"}`,
            },
            idType: "Carte de identitate",
            idSeries: "AX",
            idNumber: "123456",
            idIssuedBy: "SPCLEP Sector 6",
            idIssueDate: "15.03.2020",
          };

          // Store pending request data
          setPendingRequestData({
            signatureDataUrl: dataUrl,
            userData: userData,
          });

          // Mark the message with sign button as signed and hide the button
          setMessages((prev) =>
            prev.map((msg) =>
              msg.showSignButton
                ? { ...msg, showSignButton: false, signed: true }
                : msg
            )
          );

          // Show confirmation message with button
          const confirmMessageId = nanoid();
          const confirmMessage: ChatMessage = {
            id: confirmMessageId,
            content:
              "Am colectat toate informațiile necesare. Te rog confirmă că vrei să trimiți solicitarea.",
            role: "assistant",
            timestamp: new Date(),
            showConfirmButton: true,
          };
          setMessages((prev) => [...prev, confirmMessage]);
        }}
      />
    </SidebarProvider>
  );
}
