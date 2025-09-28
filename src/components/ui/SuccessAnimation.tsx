import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles, Heart, Pill } from 'lucide-react'

interface SuccessAnimationProps {
  isVisible: boolean
  title: string
  subtitle?: string
  type: 'login' | 'register' | 'forgot-password'
  onComplete?: () => void
  duration?: number
}

export default function SuccessAnimation({
  isVisible,
  title,
  subtitle,
  type,
  onComplete,
  duration = 3000,
}: SuccessAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true)
      const timer = setTimeout(() => {
        setShowConfetti(false)
        onComplete?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onComplete])

  const getIcon = () => {
    switch (type) {
      case 'login':
        return <Heart className='w-8 h-8' />
      case 'register':
        return <Pill className='w-8 h-8' />
      default:
        return <CheckCircle className='w-8 h-8' />
    }
  }

  const getGradient = () => {
    switch (type) {
      case 'login':
        return 'from-cyan-400 via-blue-500 to-purple-600'
      case 'register':
        return 'from-green-400 via-cyan-500 to-blue-600'
      default:
        return 'from-blue-400 via-cyan-500 to-teal-600'
    }
  }

  // Confetti particles
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    color: ['#0066CC', '#4A90E2', '#00BFFF', '#10B981', '#8B5CF6'][Math.floor(Math.random() * 5)],
    shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
  }))

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
        >
          {/* Confetti */}
          {showConfetti && (
            <div className='absolute inset-0 pointer-events-none overflow-hidden'>
              {confettiParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{
                    x: `${particle.x}vw`,
                    y: '-10vh',
                    rotate: 0,
                    scale: 0,
                  }}
                  animate={{
                    y: '110vh',
                    rotate: particle.rotation,
                    scale: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                  className='absolute'
                >
                  <div
                    className={`w-3 h-3 ${
                      particle.shape === 'circle'
                        ? 'rounded-full'
                        : particle.shape === 'square'
                          ? 'rounded-sm'
                          : 'clip-triangle'
                    }`}
                    style={{ backgroundColor: particle.color }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Success Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: 0.2,
            }}
            className='relative max-w-md w-full mx-4'
          >
            {/* Glow Effect */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${getGradient()} rounded-3xl blur-xl opacity-30 animate-pulse`}
            />

            {/* Main Card */}
            <div className='relative bg-white/95 backdrop-blur-xl border-2 border-white/50 rounded-3xl p-8 text-center shadow-2xl'>
              {/* Background Pattern */}
              <div className='absolute inset-0 opacity-5'>
                <div className='absolute top-4 left-4'>
                  <Sparkles className='w-6 h-6 text-cyan-600' />
                </div>
                <div className='absolute top-4 right-4'>
                  <Pill className='w-6 h-6 text-blue-600' />
                </div>
                <div className='absolute bottom-4 left-4'>
                  <Heart className='w-6 h-6 text-purple-600' />
                </div>
                <div className='absolute bottom-4 right-4'>
                  <Sparkles className='w-6 h-6 text-cyan-600' />
                </div>
              </div>

              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                  delay: 0.4,
                }}
                className='relative mb-6'
              >
                <div
                  className={`w-20 h-20 mx-auto bg-gradient-to-r ${getGradient()} rounded-full flex items-center justify-center text-white shadow-lg`}
                >
                  {getIcon()}
                </div>

                {/* Pulse Ring */}
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={`absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r ${getGradient()} rounded-full`}
                />
              </motion.div>

              {/* MEDISPACE Logo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='mb-4'
              >
                <div className='inline-flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-cyan-600' />
                  <span className='bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent text-lg font-bold tracking-wide'>
                    MEDISPACE
                  </span>
                  <Sparkles className='w-5 h-5 text-cyan-600' />
                </div>
              </motion.div>

              {/* Success Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className='text-2xl font-bold text-blue-800 mb-2'
              >
                {title}
              </motion.h2>

              {/* Subtitle */}
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className='text-blue-600 text-sm mb-6'
                >
                  {subtitle}
                </motion.p>
              )}

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className='w-full bg-blue-100 rounded-full h-1 mb-4'
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: duration / 1000,
                    ease: 'linear',
                  }}
                  className={`h-1 bg-gradient-to-r ${getGradient()} rounded-full`}
                />
              </motion.div>

              {/* Loading Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className='text-xs text-blue-500'
              >
                Đang chuyển hướng...
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
