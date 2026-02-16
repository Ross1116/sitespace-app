"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

function TopNav() {
  const navigationItems = [
    { title: "Home", href: "/" },
    { title: "Solutions", href: "/#solutions" },
    { title: "Pricing", href: "/#pricing" },
  ];

  const [isOpen, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-40 w-full overflow-x-clip border-b border-white/30 bg-[var(--teal-gradient)]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_30px_rgba(15,42,74,0.08)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent">
      <div className="container mx-auto flex min-h-[72px] min-w-0 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[var(--brand-blue)]"
            >
              {item.title}
              <span className="absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-[var(--brand-orange)] transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </div>

        <div className="flex items-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/full-logo.svg"
              alt="Sitespace"
              width={120}
              height={48}
              className="transition-all duration-200 hover:scale-[1.03]"
            />
          </Link>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="outline"
            className="h-9 border-white/50 bg-white/55 px-4 text-sm font-semibold text-[var(--navy)] hover:border-[var(--brand-blue)] hover:bg-white/75"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>

          <Button
            className="h-9 bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 hover:bg-[var(--navy-deep)]"
            asChild
          >
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        <div className="flex items-center lg:hidden">
          <Button
            variant="ghost"
            onClick={() => setOpen(!isOpen)}
            className="p-2 text-[var(--navy)] hover:bg-white/40"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {isOpen && (
          <div className="absolute left-0 top-full w-full border-t border-white/55 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(246,251,255,0.88))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_14px_36px_rgba(15,42,74,0.16)] backdrop-blur-[26px] lg:hidden">
            <div className="container mx-auto flex flex-col gap-2 px-4 py-4 sm:px-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-base font-semibold text-slate-700 transition-colors hover:bg-white/50 hover:text-[var(--brand-blue)]"
                >
                  {item.title}
                </Link>
              ))}

              <div className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-4">
                <Button
                  variant="outline"
                  className="border-white/60 bg-white/65 font-semibold text-[var(--navy)] hover:border-[var(--brand-blue)] hover:bg-white/85"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Sign in</Link>
                </Button>

                <Button
                  className="bg-[var(--brand-blue)] font-semibold text-white hover:bg-[var(--navy-deep)]"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export { TopNav };
