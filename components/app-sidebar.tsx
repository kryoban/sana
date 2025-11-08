"use client";

import Image from "next/image";
import {
  Calendar,
  CalendarClock,
  Search,
  User,
  AlertTriangle,
  UserPlus,
  FileText,
  Users,
  FileEdit,
  History,
  Settings,
  CreditCard,
  TrendingUp,
  BarChart,
  UserCog,
  CalendarPlus,
  FileSearch,
  Stethoscope,
  Baby,
  List,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

type SubMenuItem = {
  label: string;
  href?: string;
  badge?: number | string;
};

type MenuItem = {
  icon?: LucideIcon;
  label: string;
  href?: string;
  badge?: number | string;
  subItems?: SubMenuItem[];
};

type MenuSection = {
  label: string;
  items: MenuItem[];
};

type SidebarVariant = "pacient" | "medic";

const pacientMenuSections: MenuSection[] = [
  {
    label: "Acțiuni rapide",
    items: [
      {
        icon: CalendarPlus,
        label: "Programare nouă",
        href: "#",
      },
      {
        icon: FileSearch,
        label: "Solicită document",
        href: "#",
      },
      {
        icon: UserPlus,
        label: "Înscriere/schimbare medic",
        href: "#",
      },
    ],
  },
  {
    label: "Sănătatea Mea",
    items: [
      {
        icon: History,
        label: "Istoric medical",
        href: "#",
      },
      {
        icon: FileText,
        label: "Documentele mele",
        href: "#",
      },
      {
        icon: Stethoscope,
        label: "Medicul meu",
        href: "#",
      },
    ],
  },
  {
    label: "Familia mea",
    items: [
      {
        icon: Baby,
        label: "Înscrie un nou născut",
        href: "#",
      },
      {
        icon: UserPlus,
        label: "Adaugă un membru de familie",
        href: "#",
      },
    ],
  },
  {
    label: "Programări",
    items: [
      {
        icon: CalendarPlus,
        label: "Programează o consultație",
        href: "#",
      },
      {
        icon: List,
        label: "Lista programărilor mele",
        href: "#",
      },
    ],
  },
  {
    label: "Cont & Setări",
    items: [
      {
        icon: Settings,
        label: "Setări cont",
        href: "#",
      },
    ],
  },
];

const medicMenuSections: MenuSection[] = [
  {
    label: "Prioritățile Zilei",
    items: [
      {
        icon: CalendarClock,
        label: "Programarile de azi",
        href: "#",
      },
      {
        icon: AlertTriangle,
        label: "Alerte AI (pacienți risc înalt)",
        href: "#",
      },
      {
        icon: UserPlus,
        label: "Cereri de inscriere noi",
        href: "#",
        badge: "3",
      },
      {
        icon: FileText,
        label: "Cereri documente/rețete",
        href: "#",
        badge: "5",
      },
    ],
  },
  {
    label: "Pacienți & Documente",
    items: [
      {
        icon: Users,
        label: "Lista pacienti",
        href: "#",
        badge: "42",
      },
      {
        icon: FileEdit,
        label: "Emite document",
        href: "#",
      },
      {
        icon: History,
        label: "Istoric documente",
        href: "#",
      },
    ],
  },
  {
    label: "Calendar",
    items: [
      {
        icon: Calendar,
        label: "Programari",
        href: "#",
      },
      {
        icon: Settings,
        label: "Setări program",
        href: "#",
      },
    ],
  },
  {
    label: "Administrare cabinet",
    items: [
      {
        icon: CreditCard,
        label: "Taxe",
        href: "#",
      },
      {
        icon: TrendingUp,
        label: "Rapoarte financiare",
        href: "#",
      },
      {
        icon: BarChart,
        label: "Statistici",
        href: "#",
      },
    ],
  },
  {
    label: "Cont & Setări",
    items: [
      {
        icon: UserCog,
        label: "Setări cont",
        href: "#",
      },
    ],
  },
];

interface AppSidebarProps {
  variant?: SidebarVariant;
}

export function AppSidebar({ variant = "pacient" }: AppSidebarProps) {
  const menuSections =
    variant === "medic" ? medicMenuSections : pacientMenuSections;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemKey: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
            <Image
              src="/images/logo_ana.svg"
              alt="ANA Logo"
              width={40}
              height={40}
              className="h-full w-full"
              priority
            />
          </div>
          <div className="flex flex-col justify-center min-h-[2.5rem]">
            <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
              ANA
            </h1>
            <span className="text-xs text-sidebar-foreground/70 leading-tight">
              v1.0.0
            </span>
          </div>
        </div>
      </SidebarHeader>
      <div className="p-2 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-sidebar-foreground/50" />
          <SidebarInput type="search" placeholder="Caută..." className="pl-8" />
        </div>
      </div>
      <SidebarContent>
        {menuSections.map((section, sectionIndex) => (
          <SidebarGroup key={sectionIndex}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item, itemIndex) => {
                  const itemKey = `${sectionIndex}-${itemIndex}`;
                  const isExpanded = expandedItems.has(itemKey);
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={itemIndex}>
                      <SidebarMenuButton
                        asChild={!hasSubItems}
                        onClick={
                          hasSubItems
                            ? (e) => {
                                e.preventDefault();
                                toggleItem(itemKey);
                              }
                            : undefined
                        }
                      >
                        {hasSubItems ? (
                          <div className="flex items-center w-full">
                            {Icon && <Icon />}
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-auto shrink-0 h-5 min-w-5 px-1.5 text-xs mr-2"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="size-4 shrink-0" />
                            ) : (
                              <ChevronRight className="size-4 shrink-0" />
                            )}
                          </div>
                        ) : (
                          <a href={item.href || "#"}>
                            {Icon && <Icon />}
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-auto shrink-0 h-5 min-w-5 px-1.5 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </a>
                        )}
                      </SidebarMenuButton>
                      {hasSubItems && isExpanded && (
                        <SidebarMenuSub>
                          {item.subItems!.map((subItem, subIndex) => (
                            <SidebarMenuSubItem key={subIndex}>
                              <SidebarMenuSubButton asChild>
                                <a href={subItem.href || "#"}>
                                  <span className="flex-1 truncate">
                                    {subItem.label}
                                  </span>
                                  {subItem.badge && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-auto shrink-0 h-5 min-w-5 px-1.5 text-xs"
                                    >
                                      {subItem.badge}
                                    </Badge>
                                  )}
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 w-full">
          <Avatar className="size-8 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              <User className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
              GEORGESCU ANDREI
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate leading-tight">
              1901213254491
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
