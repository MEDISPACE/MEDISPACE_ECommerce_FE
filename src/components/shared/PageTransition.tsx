import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

// Smooth page transition với spring physics và blur effect
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.98,
        filter: 'blur(4px)',
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      exit={{
        opacity: 0,
        y: -20,
        scale: 0.98,
        filter: 'blur(4px)',
      }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1], // Custom cubic-bezier for smooth easing
        opacity: { duration: 0.3 },
        scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }, // Slight bounce
        filter: { duration: 0.3 },
      }}
    >
      {children}
    </motion.div>
  )
}
