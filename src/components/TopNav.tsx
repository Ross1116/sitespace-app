"use client";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, MoveRight, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

function TopNav() {
  const navigationItems = [
    {
      title: "Home",
      href: "/",
      description: "",
    },
    {
      title: "Product",
      description: "Managing a small business today is already tough.",
      items: [
        { title: "Reports", href: "/reports" },
        { title: "Statistics", href: "/statistics" },
        { title: "Dashboards", href: "/dashboards" },
        { title: "Recordings", href: "/recordings" },
      ],
    },
    {
      title: "Company",
      description: "Managing a small business today is already tough.",
      items: [
        { title: "About us", href: "/about" },
        { title: "Fundraising", href: "/fundraising" },
        { title: "Investors", href: "/investors" },
        { title: "Contact us", href: "/contact" },
      ],
    },
  ];

  const [isOpen, setOpen] = useState(false);

  return (
    <header className="w-full z-40 top-0 left-0 fixed bg-teal-gradient/30 backdrop-blur-md border-b border-orange-200/40">
      <div className="container relative mx-auto min-h-20 flex flex-row justify-between items-center px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-3 lg:gap-4">
        {/* Desktop Left Navigation */}
        <div className="hidden lg:flex justify-start items-center gap-2 md:gap-4 lg:col-start-1">
          <NavigationMenu className="flex justify-start items-start">
            <NavigationMenuList className="flex justify-start gap-2 md:gap-4 flex-row">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    /* FIX 1: Add legacyBehavior passHref */
                    (<Link href={item.href}>
                      {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                      }
                      <NavigationMenuLink className="font-medium text-sm px-3 py-2 hover:bg-orange-200/50 rounded-md transition-colors">
                        {item.title}
                      </NavigationMenuLink>
                    </Link>)
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm bg-transparent hover:bg-orange-200/50 focus:bg-orange-200/50 data-[active]:bg-orange-200/50 data-[state=open]:bg-orange-200/50 transition-colors">
                        {item.title}
                      </NavigationMenuTrigger>

                      <NavigationMenuContent className="!w-[450px] p-4 bg-orange-100/90 backdrop-blur-md border border-orange-200/60 shadow-lg rounded-lg">
                        <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                          <div className="flex flex-col h-full justify-between">
                            <div className="flex flex-col">
                              <p className="text-base font-semibold">{item.title}</p>
                              <p className="text-muted-foreground text-sm">
                                {item.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="mt-10 bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              Book a call today
                            </Button>
                          </div>

                          <div className="flex flex-col text-sm h-full justify-end space-y-1">
                            {item.items?.map((subItem) => (
                              /* FIX 2: Add legacyBehavior passHref */
                              (<Link href={subItem.href} key={subItem.title}>
                                {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                                }
                                <NavigationMenuLink className="flex flex-row justify-between items-center hover:bg-orange-200/50 py-2 px-3 rounded-md transition-colors">
                                  <span>{subItem.title}</span>
                                  <MoveRight className="w-4 h-4 text-muted-foreground" />
                                </NavigationMenuLink>
                              </Link>)
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Logo/Brand */}
        <div className="flex items-center lg:justify-center lg:col-start-2">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/full-logo.svg"
              alt="Sitespace"
              width={120}
              height={48}
              className="cursor-pointer hover:scale-105 transition-all"
            />
          </Link>
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden lg:flex justify-end items-center gap-2 md:gap-3 lg:col-start-3">
          <Button variant="ghost" className="text-sm h-9 px-3 hover:bg-orange-200/50">
            Book a demo
          </Button>

          <div className="border-r h-6 hidden md:inline-block border-orange-300/70" />

          <Button
            variant="outline"
            className="cursor-pointer text-sm h-9 px-3 border-orange-300/70 hover:bg-orange-200/50 focus-visible:ring-orange-400"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>

          <Button
            className="cursor-pointer text-sm h-9 px-3 bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400 text-white"
            asChild
          >
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden flex items-center">
          <Button variant="ghost" onClick={() => setOpen(!isOpen)} className="p-2">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div
            className="absolute top-full left-0 w-full lg:hidden 
                         bg-orange-100/95 backdrop-blur-md shadow-xl 
                         border-t border-orange-200/60"
          >
            <div className="container mx-auto flex flex-col py-4 px-4 sm:px-6 gap-2">
              {navigationItems.map((item) => (
                <div key={item.title} className="py-2 border-b border-orange-200/40 last:border-b-0">
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex justify-between items-center py-2 text-gray-700 hover:text-orange-600"
                      >
                        <span className="text-lg font-medium">{item.title}</span>
                        <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                      </Link>
                    ) : (
                      <p className="text-lg font-medium text-gray-800 py-2">
                        {item.title}
                      </p>
                    )}

                    {item.items &&
                      item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          onClick={() => setOpen(false)}
                          className="flex justify-between items-center py-1.5 pl-3 text-gray-600 hover:text-orange-600 hover:bg-orange-100/50 rounded-md"
                        >
                          <span>{subItem.title}</span>
                          <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                        </Link>
                      ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-orange-200/40">
                <Button
                  variant="outline"
                  className="border-orange-300/70 hover:bg-orange-200/50 focus-visible:ring-orange-400 text-orange-700 hover:text-orange-800"
                >
                  Book a demo
                </Button>

                <Button
                  variant="outline"
                  className="border-orange-300/70 hover:bg-orange-200/50 focus-visible:ring-orange-400 text-orange-700 hover:text-orange-800"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Sign in</Link>
                </Button>

                <Button
                  className="bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400 text-white"
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