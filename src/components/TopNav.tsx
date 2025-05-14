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
    <header className="w-full z-40 top-0 left-0 fixed bg-orange-100/30 backdrop-blur-md">
      <div className="container relative mx-auto min-h-20 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center px-4 sm:px-6 lg:px-8">
        <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
          <NavigationMenu className="flex justify-start items-start">
            <NavigationMenuList className="flex justify-start gap-2 md:gap-4 flex-row">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className="font-medium text-sm px-3 py-2 hover:bg-amber-100/70 rounded-md transition-colors"
                      >
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm bg-transparent hover:bg-amber-100/70 focus:bg-amber-100/70 data-[active]:bg-amber-100/70 data-[state=open]:bg-amber-100/70 transition-colors">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[450px] p-4 bg-amber-50/90 backdrop-blur-md border border-amber-200/60 shadow-lg rounded-lg">
                        <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                          <div className="flex flex-col h-full justify-between">
                            <div className="flex flex-col">
                              <p className="text-base font-semibold">{item.title}</p>
                              <p className="text-muted-foreground text-sm">
                                {item.description}
                              </p>
                            </div>
                            <Button size="sm" className="mt-10">
                              Book a call today
                            </Button>
                          </div>
                          <div className="flex flex-col text-sm h-full justify-end space-y-1">
                            {item.items?.map((subItem) => (
                              <Link
                                href={subItem.href}
                                key={subItem.title}
                                legacyBehavior passHref
                              >
                                <NavigationMenuLink className="flex flex-row justify-between items-center hover:bg-amber-100/70 py-2 px-3 rounded-md transition-colors">
                                  <span>{subItem.title}</span>
                                  <MoveRight className="w-4 h-4 text-muted-foreground" />
                                </NavigationMenuLink>
                              </Link>
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
        <div className="flex lg:justify-center flex-grow lg:flex-grow-0">
          <Link href="/" passHref legacyBehavior>
            <a className="font-semibold text-xl hover:text-amber-700 transition-colors">Sitespace</a>
          </Link>
        </div>
        <div className="flex justify-end items-center w-auto lg:w-auto gap-2 md:gap-3">
          <Button variant="ghost" className="hidden md:inline-flex text-sm h-9 px-3">
            Book a demo
          </Button>
          <div className="border-r h-6 hidden md:inline-block border-amber-300/70"></div>
          <Link href="/login" passHref legacyBehavior>
            <Button variant="outline" className="cursor-pointer text-sm h-9 px-3 border-amber-300/70 hover:bg-amber-100/70 focus-visible:ring-amber-400">Sign in</Button>
          </Link>
          <Link href="/register" passHref legacyBehavior>
            <Button className="cursor-pointer text-sm h-9 px-3 bg-orange-500 hover:bg-amber-600 focus-visible:ring-amber-400">Get Started</Button>
          </Link>
        </div>
        <div className="flex lg:hidden items-center justify-end ml-auto">
          <Button variant="ghost" onClick={() => setOpen(!isOpen)} className="p-2">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {isOpen && (
          <div
            className="absolute top-full left-0 w-full lg:hidden 
                     bg-amber-50/95 backdrop-blur-md shadow-xl 
                     border-t border-amber-200/60"
          >
            <div className="container mx-auto flex flex-col py-4 px-4 sm:px-6 gap-4">
              {navigationItems.map((item) => (
                <div key={item.title} className="py-2 border-b border-amber-200/40 last:border-b-0">
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex justify-between items-center py-2 text-gray-700 hover:text-amber-600"
                      >
                        <span className="text-lg font-medium">{item.title}</span>
                        <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                      </Link>
                    ) : (
                      <p className="text-lg font-medium text-gray-800 py-2">{item.title}</p>
                    )}
                    {item.items &&
                      item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          onClick={() => setOpen(false)}
                          className="flex justify-between items-center py-1.5 pl-3 text-gray-600 hover:text-amber-600 hover:bg-amber-100/50 rounded-md"
                        >
                          <span>{subItem.title}</span>
                          <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-amber-200/40">
                <Button variant="outline" className="border-amber-300/70 hover:bg-amber-100/70 focus-visible:ring-amber-400">Book a demo</Button>
                {/* Add other mobile specific buttons if needed, like Sign In / Get Started */}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export { TopNav };
