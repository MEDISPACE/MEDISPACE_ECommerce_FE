import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'wave' | 'gradient'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export function LoadingSpinner({ size = 'md', variant = 'default', className = '' }: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 justify-center items-center ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className='w-2 h-2 bg-blue-600 rounded-full'
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={`${sizeMap[size]} bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full ${className}`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    )
  }

  if (variant === 'wave') {
    return (
      <div className={`flex space-x-1 justify-center items-center ${className}`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className='w-1 bg-blue-600 rounded-full'
            animate={{
              height: ['10px', '30px', '10px'],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <motion.div
        className={`${sizeMap[size]} rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 ${className}`}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
        }}
      >
        <div
          className='w-full h-full rounded-full bg-white'
          style={{
            margin: '2px',
            width: 'calc(100% - 4px)',
            height: 'calc(100% - 4px)',
          }}
        />
      </motion.div>
    )
  }

  // Default spinner
  return (
    <motion.div
      className={`${sizeMap[size]} border-2 border-gray-200 border-t-blue-600 rounded-full ${className}`}
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}
