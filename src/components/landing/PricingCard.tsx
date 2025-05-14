"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  title: string
  price: number
  description: string
  features: string[]
  buttonText: string
  popular?: boolean
}

export default function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  popular = false,
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
      <Card
        className={cn(
          "border overflow-hidden h-full relative transition-all duration-300",
          popular
            ? "border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-950"
            : "border-slate-200 dark:border-slate-700",
          isHovered && !popular && "border-blue-300 dark:border-blue-700",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        {popular && (
          <div className="absolute top-0 inset-x-0">
            <Badge className="bg-blue-600 text-white hover:bg-blue-700 rounded-t-none rounded-b-md mx-auto block w-fit">
              Most Popular
            </Badge>
          </div>
        )}

        <CardHeader className={`pb-0 pt-${popular ? "8" : "6"} dark:bg-slate-800`}>
          <div className="text-center">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</CardTitle>
            <div className="mb-2 relative">
              <motion.span
                className="text-4xl font-bold text-slate-900 dark:text-white"
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.3 }}
              >
                ${price}
              </motion.span>
              <span className="text-slate-600 dark:text-slate-300">/month</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{description}</p>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex flex-col h-full dark:bg-slate-800">
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { delay: 0.05 * index },
                }}
                whileHover={{ x: 3 }}
              >
                <div className="flex-shrink-0 mt-1">
                  <Check
                    className={cn(
                      "h-5 w-5",
                      popular || isHovered ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400",
                    )}
                  />
                </div>
                <span className="ml-3 text-slate-700 dark:text-slate-300">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-auto">
            <Button
              className={cn(
                "cursor-pointer w-full transition-all duration-300",
                popular || isHovered
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600",
              )}
            >
              {buttonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

