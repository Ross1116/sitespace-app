"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function ValuePropIllustration() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="relative w-full max-w-lg mx-auto h-[400px] flex items-center justify-center">
        <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative z-10 bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-3 w-24 bg-blue-200 rounded mb-2"></div>
            <div className="h-6 w-40 bg-blue-600 rounded"></div>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <div className="h-5 w-5 rounded-full bg-orange-500"></div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 * i }}
              className="flex items-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <div className="h-5 w-5 rounded-full bg-blue-500"></div>
              </div>
              <div>
                <div className="h-2.5 w-24 bg-blue-300 rounded mb-2"></div>
                <div className="h-2 w-32 bg-slate-200 rounded"></div>
              </div>
              <div className="ml-auto">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-slate-300"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="h-32 bg-slate-100 rounded-lg w-full mb-4 flex items-center justify-center">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <div className="h-2.5 w-20 bg-blue-200 rounded mb-2"></div>
            <div className="h-2 w-24 bg-slate-200 rounded"></div>
          </div>
          <div className="h-8 w-20 bg-blue-600 rounded"></div>
        </div>
      </div>

      {/* Animated elements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute -bottom-10 -right-10 z-20"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
          <div className="flex items-center mb-2">
            <div className="h-8 w-8 rounded-full bg-orange-100 mr-3 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-orange-500"></div>
            </div>
            <div>
              <div className="h-2.5 w-20 bg-blue-300 rounded mb-1"></div>
              <div className="h-2 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="h-2 w-full bg-blue-100 rounded mb-2"></div>
          <div className="h-2 w-3/4 bg-blue-100 rounded"></div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute -top-10 -left-10 z-20"
      >
        <div className="bg-white rounded-lg shadow-lg p-3 border border-slate-200">
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-blue-100 mr-2 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            </div>
            <div className="h-2 w-16 bg-blue-200 rounded"></div>
          </div>
        </div>
      </motion.div>

      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 rounded-full filter blur-3xl opacity-5"></div>
      </div>
    </div>
  )
}

