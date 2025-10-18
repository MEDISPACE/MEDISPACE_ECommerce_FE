import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface EnhancedPageTransitionProps {
  children: ReactNode
  variant?: 'default' | 'slide' | 'scale' | 'rotate' | 'flip'
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  delay?: number
}

const variants = {
  default: {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
      filter: 'blur(4px)',
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      filter: 'blur(4px)',
    },
  },
  slide: {
    initial: (direction: string) => ({
      opacity: 0,
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: (direction: string) => ({
      opacity: 0,
      x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
      y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0,
    }),
  },
  scale: {
    initial: {
      opacity: 0,
      scale: 0.8,
      rotateX: -15,
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      rotateX: 15,
    },
  },
  rotate: {
    initial: {
      opacity: 0,
      rotateY: -90,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      rotateY: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      rotateY: 90,
      scale: 0.8,
    },
  },
  flip: {
    initial: {
      opacity: 0,
      rotateX: -180,
      scale: 0.8,
      y: 50,
    },
    animate: {
      opacity: 1,
      rotateX: 0,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      rotateX: 180,
      scale: 0.8,
      y: -50,
    },
  },
}

export function EnhancedPageTransition({
  children,
  variant = 'default',
  direction = 'up',
  duration = 0.6,
  delay = 0,
}: EnhancedPageTransitionProps) {
  const selectedVariant = variants[variant]

  const getInitialState = () => {
    if (typeof selectedVariant.initial === 'function') {
      return selectedVariant.initial(direction)
    }
    return selectedVariant.initial
  }

  const getExitState = () => {
    if (typeof selectedVariant.exit === 'function') {
      return selectedVariant.exit(direction)
    }
    return selectedVariant.exit
  }

  return (
    <motion.div
      custom={direction}
      initial={getInitialState()}
      animate={selectedVariant.animate}
      exit={getExitState()}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
        opacity: { duration: duration * 0.6 },
        scale: { duration: duration * 0.8, ease: [0.34, 1.56, 0.64, 1] },
        filter: { duration: duration * 0.5 },
        rotateX: { duration: duration * 0.8, ease: 'anticipate' },
        rotateY: { duration: duration * 0.8, ease: 'anticipate' },
      }}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  )
}
