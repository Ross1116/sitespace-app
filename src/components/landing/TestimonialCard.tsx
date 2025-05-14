"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  company: string
  rating: number
}

export default function TestimonialCard({ quote, author, role, company, rating }: TestimonialCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
      <Card
        className={cn(
          "border border-slate-200 dark:border-slate-700 overflow-hidden h-full transition-all duration-300",
          isHovered ? "shadow-md" : "",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <CardContent className="p-6 flex flex-col h-full dark:bg-slate-800">
          <div className="flex items-center mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4 transition-colors duration-300",
                  i < rating
                    ? isHovered
                      ? "text-orange-500 fill-current"
                      : "text-orange-500 fill-current"
                    : "text-slate-300 dark:text-slate-600",
                )}
              />
            ))}
          </div>

          <blockquote className="text-slate-700 dark:text-slate-300 mb-6 flex-grow">"{quote}"</blockquote>

          <div className="flex items-center mt-auto">
            <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">{author.charAt(0)}</span>
            </div>
            <div>
              <div className="font-medium text-slate-900 dark:text-white">{author}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {role}, {company}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

