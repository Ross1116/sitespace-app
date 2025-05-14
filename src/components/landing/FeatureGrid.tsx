"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface FeatureGridProps {
  className?: string
}

export default function FeatureGrid({ className }: FeatureGridProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const features = [
    {
      id: "efficiency",
      title: "Efficiency",
      description:
        "Our advanced booking engine allows you to manage all your assets in one place, reducing scheduling conflicts and maximizing utilization.",
      image: "https://placehold.co/300x300?text=Efficiency+Screenshot",
    },
    {
      id: "knowledge",
      title: "Knowledge",
      description:
        "Keep all your asset information organized and accessible. Find exactly what you need when you need it with our powerful search capabilities.",
      image: "https://placehold.co/300x300?text=Knowledge+Screenshot",
    },
    {
      id: "management",
      title: "Management",
      description:
        "From resource tracking to user access control, our comprehensive management tools give you complete visibility and control.",
      image: "https://placehold.co/300x300?text=Management+Screenshot",
    },
  ]

  return (
    <section className={cn("py-20 bg-white dark:bg-slate-950", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border-none">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-4">
            Your details have the potential to be your firm&apos;s <span className="text-orange-500">superpower</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            sitespace transforms how you manage asset deliveries with powerful tools designed for modern businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div key={feature.id} className="flex flex-col">
              <Card
                className={cn(
                  "overflow-hidden transition-all duration-300 h-full",
                  activeFeature === feature.id
                    ? "border-orange-500 dark:border-orange-400 shadow-lg"
                    : "border-slate-200 dark:border-slate-700",
                )}
                onMouseEnter={() => setActiveFeature(feature.id)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">{feature.description}</p>

                  <div className="mt-auto relative overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                    <Image
                      src={feature.image || "/placeholder.svg"}
                      alt={`${feature.title} screenshot`}
                      width={300}
                      height={300}
                      className="w-full h-auto"
                    />

                    {activeFeature === feature.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-orange-500/80 to-transparent flex items-end justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="text-white font-medium">Learn more</span>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

