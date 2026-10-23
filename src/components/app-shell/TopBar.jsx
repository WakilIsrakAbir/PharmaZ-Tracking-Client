"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react";

import { AccountMenu } from "@/components/app-shell/AccountMenu";
import { MainMenu } from "@/components/app-shell/MainMenu";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Phones and tablets only.
export function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-2 backdrop-blur-md lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open the menu">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetHeader className="h-14 justify-center border-b px-5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
          </SheetHeader>
          <nav aria-label="Main" className="px-3 py-4">
            <MainMenu onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <Link href="/" aria-label="PharmaZ247 Tracker, go to the dashboard">
        <Logo />
      </Link>

      <div className="ml-auto pr-1">
        <AccountMenu compact />
      </div>
    </header>
  );
}
