"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

export function HeroIllustration() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="relative w-full max-w-lg mx-auto h-[500px] flex items-center justify-center">
        <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="relative shadow-xl rounded-2xl">
          <Image
            // src="https://placehold.co/600x500.png?text=Dashboard+Preview"
            src="/static/images/truck-2.jpg"
            alt="Dashboard Preview"
            width={500}
            height={600}
            className="h-[600px] w-full rounded-2xl opacity-80"
          />
          <div
            className="absolute inset-0 bg-slate-50/40 rounded-2xl"
            aria-hidden="true"
          ></div>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute top-1/2 -right-16 transform -translate-y-1/2 z-0"
      >
        <div className="w-32 h-32 rounded-full bg-orange-500 opacity-20 filter blur-xl"></div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-1/4 -left-12 z-0"
      >
        <div className="w-24 h-24 rounded-full bg-blue-500 opacity-20 filter blur-xl"></div>
      </motion.div>

      {/* Floating elements */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute top-10 -left-20 z-20"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 w-40">
          <div className="h-2 w-20 bg-blue-200 rounded mb-2"></div>
          <div className="h-2 w-16 bg-blue-100 rounded mb-2"></div>
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-orange-100 mr-2"></div>
            <div className="h-2 w-12 bg-blue-100 rounded"></div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-10 -right-10 z-20"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 w-40">
          <div className="flex items-center justify-between mb-2">
            <div className="h-2 w-10 bg-blue-200 rounded"></div>
            <div className="h-4 w-4 rounded-full bg-orange-100"></div>
          </div>
          <div className="h-2 w-full bg-blue-100 rounded mb-2"></div>
          <div className="h-2 w-3/4 bg-blue-100 rounded"></div>
        </div>
      </motion.div>
    </div>
  )
}

