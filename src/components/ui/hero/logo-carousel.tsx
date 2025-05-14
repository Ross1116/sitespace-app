"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LogoCarouselProps {
  logos: { name: string; logo: string }[]
  className?: string
}

export default function LogoCarousel({ logos, className }: LogoCarouselProps) {
  const [width, setWidth] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (carouselRef.current) {
        setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [logos])

  // Duplicate logos for infinite effect
  const extendedLogos = [...logos, ...logos]

  if (isMobile) {
    // Static grid for mobile
    return (
      <div className={cn("grid grid-cols-2 gap-6", className)}>
        {logos.map((logo, index) => (
          <div
            key={index}
            className="flex h-12 items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <Image
              src={logo.logo || "https://placehold.co/120x48.png"}
              alt={logo.name}
              width={120}
              height={48}
              className="max-h-12 w-auto dark:invert dark:brightness-200"
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Gradient fade effect on left */}
      <div className="absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-slate-50/90  from-30% dark:from-slate-950 to-transparent"></div>

      {/* Carousel container */}
      <div ref={carouselRef} className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: -width / 2 }}
          transition={{
            x: {
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
              duration: 15,
              ease: "linear",
            },
          }}
        >
          {extendedLogos.map((logo, index) => (
            <div
              key={index}
              className="mx-8 flex h-12 w-[120px] flex-shrink-0 items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={logo.logo || "https://placehold.co/120x48.png"}
                alt={logo.name}
                width={120}
                height={48}
                className="max-h-12 w-auto dark:invert dark:brightness-200"
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Gradient fade effect on right */}
      <div className="absolute from-30% right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-slate-50/90 dark:from-slate-950 to-transparent"></div>
    </div>
  )
}

