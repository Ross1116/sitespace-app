"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Map, BarChart3, Truck, Play, Pause, ChevronRight, ExternalLink } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Demo features data
const demoFeatures = [
  {
    id: "scheduling",
    title: "Smart Scheduling",
    icon: <Calendar className="h-5 w-5" />,
    description:
      "Our AI-powered scheduling system automatically optimizes delivery times based on asset availability, location, and priority.",
    benefits: ["Reduce scheduling time by 85%", "Eliminate double-bookings", "Optimize resource allocation"],
    image: "https://placehold.co/800x600.png?text=Scheduling+Interface",
    alt: "Scheduling Interface",
    color: "from-blue-500 to-indigo-600",
    demo: {
      steps: [
        { text: "Select asset from inventory", delay: 0 },
        { text: "Choose delivery date and time", delay: 2 },
        { text: "AI suggests optimal time slots", delay: 4 },
        { text: "Confirm booking with one click", delay: 6 },
      ],
    },
  },
  {
    id: "tracking",
    title: "Real-time Tracking",
    icon: <Map className="h-5 w-5" />,
    description:
      "Track your assets in real-time with accurate GPS location, status updates, and estimated arrival times.",
    benefits: ["Live location updates", "Accurate ETAs", "Status notifications"],
    image: "https://placehold.co/800x600.png?text=Tracking+Interface",
    alt: "Tracking Interface",
    color: "from-emerald-500 to-green-600",
    demo: {
      steps: [
        { text: "View all active deliveries on map", delay: 0 },
        { text: "Check real-time status updates", delay: 2 },
        { text: "Receive ETA notifications", delay: 4 },
        { text: "Share tracking link with customers", delay: 6 },
      ],
    },
  },
  {
    id: "analytics",
    title: "Analytics Dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
    description:
      "Gain valuable insights with comprehensive analytics that help you monitor performance and optimize operations.",
    benefits: ["Performance metrics", "Cost analysis", "Efficiency reports"],
    image: "https://placehold.co/800x600.png?text=Analytics+Dashboard",
    alt: "Analytics Dashboard",
    color: "from-purple-500 to-violet-600",
    demo: {
      steps: [
        { text: "View delivery performance metrics", delay: 0 },
        { text: "Analyze cost efficiency by route", delay: 2 },
        { text: "Generate custom reports", delay: 4 },
        { text: "Identify optimization opportunities", delay: 6 },
      ],
    },
  },
  {
    id: "routing",
    title: "Route Optimization",
    icon: <Truck className="h-5 w-5" />,
    description:
      "Optimize delivery routes to minimize travel time, reduce fuel consumption, and increase delivery capacity.",
    benefits: ["Reduce fuel costs by 30%", "Increase delivery capacity", "Minimize travel time"],
    image: "https://placehold.co/800x600.png?placeholder.svg?height=600&width=800&text=Route+Optimization",
    alt: "Route Optimization Interface",
    color: "from-amber-500 to-orange-600",
    demo: {
      steps: [
        { text: "Enter delivery locations", delay: 0 },
        { text: "AI calculates optimal routes", delay: 2 },
        { text: "Adjust for traffic conditions", delay: 4 },
        { text: "Save and dispatch to drivers", delay: 6 },
      ],
    },
  },
]

export default function ProductDemo() {
  const [activeTab, setActiveTab] = useState(demoFeatures[0].id)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-advance demo steps when playing
  useEffect(() => {
    if (!isPlaying) return

    const activeFeature = demoFeatures.find((feature) => feature.id === activeTab)
    if (!activeFeature) return

    const steps = activeFeature.demo.steps
    const interval = setTimeout(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : 0))
    }, 3000)

    return () => clearTimeout(interval)
  }, [isPlaying, currentStepIndex, activeTab])

  // Reset step index when changing tabs
  useEffect(() => {
    setCurrentStepIndex(0)
  }, [activeTab])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  if (!isClient) {
    return (
      <div className="w-full h-[600px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-slate-500 dark:text-slate-400">Loading demo...</span>
      </div>
    )
  }

  const activeFeature = demoFeatures.find((feature) => feature.id === activeTab) || demoFeatures[0]

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300" id="demo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border-none">
              Interactive Demo
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl mb-4">
              See sitespace in action
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Explore our platform&apos;s key features and see how they can transform your delivery operations.
            </p>
          </div>

          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value)
              setIsPlaying(true)
            }}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row gap-8 items-stretch h-full">
              <div className="w-full md:w-1/3">
                <TabsList className="flex flex-col space-y-2 bg-transparent w-full h-auto">
                  {demoFeatures.map((feature) => (
                    <TabsTrigger
                      key={feature.id}
                      value={feature.id}
                      className={cn(
                        "flex items-center justify-start px-4 py-3 w-full text-left rounded-lg border transition-all",
                        activeTab === feature.id
                          ? "border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                          : "border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 text-slate-700 dark:text-slate-300",
                      )}
                    >
                      <div
                        className={cn(
                          "mr-3 p-2 rounded-md",
                          activeTab === feature.id
                            ? `bg-gradient-to-r ${feature.color} text-white`
                            : "bg-slate-100 dark:bg-slate-800",
                        )}
                      >
                        {feature.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{feature.title}</div>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-8 space-y-6 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{activeFeature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{activeFeature.description}</p>

                  <div>
                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">KEY BENEFITS</h4>
                    <ul className="space-y-2">
                      {activeFeature.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <ChevronRight className="h-5 w-5 text-orange-500 dark:text-orange-400 mr-2 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Request Full Demo <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="w-full md:w-2/3 flex flex-col">
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg flex-1 flex flex-col">
                  {/* Demo header */}
                  <div className="bg-blue-100/70 dark:bg-slate-800 p-3 flex items-center border-b border-slate-200 dark:border-slate-700">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="mx-auto font-medium text-slate-700 dark:text-slate-300">
                      Sitespace - {activeFeature.title}
                    </div>
                    <div className="w-16"></div> {/* Spacer for alignment */}
                  </div>

                  {/* Demo content */}
                  <div className="relative bg-white dark:bg-slate-900 aspect-video flex-1 flex flex-col">
                    <Image
                      src={activeFeature.image || "https://placehold.co/800x600.png"}
                      alt={activeFeature.alt}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover"
                    />

                    {/* Demo overlay with steps */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activeTab}-${currentStepIndex}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="text-center"
                        >
                          <div className="text-white text-2xl md:text-3xl font-bold mb-4">
                            {activeFeature.demo.steps[currentStepIndex].text}
                          </div>
                          <div className="flex justify-center space-x-2 mt-6">
                            {activeFeature.demo.steps.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === currentStepIndex ? "bg-white scale-125" : "bg-white/50 scale-100"
                                  } transition-all duration-300`}
                              ></div>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Play/pause button */}
                    <button
                      onClick={togglePlayPause}
                      className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-full shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      aria-label={isPlaying ? "Pause demo" : "Play demo"}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Demo controls */}
                  <div className="bg-blue-100/70 dark:bg-slate-800 p-4 flex justify-between items-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Step {currentStepIndex + 1} of {activeFeature.demo.steps.length}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : activeFeature.demo.steps.length - 1))
                          setIsPlaying(false)
                        }}
                        className="border-slate-300 dark:border-slate-600"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentStepIndex((prev) => (prev < activeFeature.demo.steps.length - 1 ? prev + 1 : 0))
                          setIsPlaying(false)
                        }}
                        className="border-slate-300 dark:border-slate-600"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  )
}

