import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"
import { siteContent } from "@/lib/landingData"

export default function Footer() {
  const { footer } = siteContent

  return (
    <footer className="bg-[var(--navy)] dark:bg-slate-950 text-slate-300 transition-colors duration-300" id="contact">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <Link href="/">
                {/* Ensure you have a white/light logo for dark backgrounds */}
                <Image src="/full-logo-dark.svg" alt="Sitespace" width={120} height={48} className="cursor-pointer hover:scale-105 transition-all brightness-0 invert" />
              </Link>
            </div>
            <p className="mb-4 text-slate-400">{footer.description}</p>
            <div className="flex space-x-4">
              <SocialLink href="#" icon={<Facebook className="h-5 w-5" />} ariaLabel="Facebook" />
              <SocialLink href="#" icon={<Twitter className="h-5 w-5" />} ariaLabel="Twitter" />
              <SocialLink href="#" icon={<Instagram className="h-5 w-5" />} ariaLabel="Instagram" />
              <SocialLink href="#" icon={<Linkedin className="h-5 w-5" />} ariaLabel="LinkedIn" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footer.quickLinks.map((link, index) => (
                <FooterLink key={index} href={link.href}>
                  {link.text}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              {footer.legalLinks.map((link, index) => (
                <FooterLink key={index} href={link.href}>
                  {link.text}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>{footer.contactInfo.address}</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" />
                <span>{footer.contactInfo.phone}</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" />
                <span>{footer.contactInfo.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500">
          <p className="text-sm">{footer.copyright}</p>
          <div className="mt-4 md:mt-0">
            <p className="text-sm">{footer.tagline}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon, ariaLabel }: { href: string; icon: React.ReactNode; ariaLabel: string }) {
  return (
    <Link
      href={href}
      className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors text-slate-300"
      aria-label={ariaLabel}
    >
      {icon}
    </Link>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-white transition-colors text-slate-400">
        {children}
      </Link>
    </li>
  )
}
