"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarClock, Link2, Menu, ArrowLeft, } from "lucide-react";
import { MeetlyLogo } from "@/components/meetly-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Event Types", href: "/dashboard/event-types", icon: Link2 },
  { name: "Availability", href: "/dashboard/availability", icon: Calendar },
  { name: "Scheduled Meetings", href: "/dashboard/meetings", icon: CalendarClock, },
];

function NavLinks({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <MeetlyLogo href="/" />
        <Badge variant="secondary" className="ml-auto text-[10px] uppercase">
          Admin
        </Badge>
      </div>

      <NavLinks onNavigate={onNavigate} />

      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              NK
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Niraj Kumar</p>
            <p className="truncate text-xs text-muted-foreground">
              nirajkumargupta2642006@gmail.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function DashboardShell({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activePage =
    navItems.find((item) => pathname.startsWith(item.href))?.name ||
    "Dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-backdrop-filter:bg-card/80 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" className="md:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="truncate text-base font-semibold sm:text-lg">
            {activePage}
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden text-[10px] font-normal sm:inline-flex"
            >
              Demo mode
            </Badge>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/">
                <ArrowLeft className="size-3.5" />
                Portal
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
