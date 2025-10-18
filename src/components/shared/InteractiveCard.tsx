import { motion } from 'framer-motion'
import { useState } from 'react'
import type { ReactNode } from 'react'

interface InteractiveCardProps {
  children: ReactNode
  hoverScale?: number
  hoverRotate?: number
  tapScale?: number
  glowEffect?: boolean
  floatEffect?: boolean
  className?: string
  onClick?: () => void
}

export function InteractiveCard({
  children,
  hoverScale = 1.03,
  hoverRotate = 0,
  tapScale = 0.98,
  glowEffect = false,
  floatEffect = false,
  className = '',
  onClick,
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      whileHover={{
        scale: hoverScale,
        rotate: hoverRotate,
        y: floatEffect ? -8 : 0,
        transition: {
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      whileTap={{
        scale: tapScale,
        transition: {
          duration: 0.1,
          ease: 'easeOut',
        },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        transformOrigin: 'center center',
      }}
    >
      {/* Glow effect */}
      {glowEffect && (
        <motion.div
          className='absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-600/20 rounded-2xl blur-xl'
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1.1 : 0.8,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Main content */}
      <motion.div
        className='relative z-10'
        animate={{
          rotateX: isHovered ? 5 : 0,
          rotateY: isHovered ? 2 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        {children}
      </motion.div>

      {/* Shadow effect */}
      <motion.div
        className='absolute inset-0 bg-black/5 rounded-2xl -z-10'
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.05 : 1,
          y: isHovered ? 10 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        style={{
          filter: isHovered ? 'blur(20px)' : 'blur(0px)',
        }}
      />
    </motion.div>
  )
}
