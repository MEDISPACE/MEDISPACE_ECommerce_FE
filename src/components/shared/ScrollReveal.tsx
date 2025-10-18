import type { ReactNode } from 'react'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
  className?: string
}

const variants = {
  up: {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  down: {
    hidden: { opacity: 0, y: -60, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  left: {
    hidden: { opacity: 0, x: -60, scale: 0.9 },
    visible: { opacity: 1, x: 0, scale: 1 },
  },
  right: {
    hidden: { opacity: 0, x: 60, scale: 0.9 },
    visible: { opacity: 1, x: 0, scale: 1 },
  },
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  once = true,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    amount: threshold,
    once,
    margin: '-100px 0px',
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants[direction]}
      initial='hidden'
      animate={isInView ? 'visible' : 'hidden'}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
        scale: {
          duration: duration * 0.8,
          ease: [0.34, 1.56, 0.64, 1],
        },
      }}
    >
      {children}
    </motion.div>
  )
}
