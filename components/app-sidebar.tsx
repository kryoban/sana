"use client";

import Image from "next/image";
import { BookUser, FileSpreadsheet, Search, Sparkles, User } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
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
          <SidebarInput
            type="search"
            placeholder="Caută..."
            className="pl-8"
          />
        </div>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Activitate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <BookUser />
                    <span>Fișa mea</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <FileSpreadsheet />
                    <span>Documente eliberate</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <Sparkles />
                    <span>Discută cu Ana</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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

