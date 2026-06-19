import { Check } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
}

interface ProgressStepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function ProgressStepper({ steps, currentStep, className = '' }: ProgressStepperProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className='flex items-center justify-between mb-8'>
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div key={step.id} className='flex items-center flex-1'>
              {/* Step Circle */}
              <div className='flex flex-col items-center'>
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200
                    ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isCurrent
                          ? 'bg-[#1E40AF] border-[#1E40AF] text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? <Check className='w-5 h-5' /> : <span className='font-medium'>{stepNumber}</span>}
                </div>

                <div className='mt-2 text-center'>
                  <div
                    className={`
                      font-medium text-sm
                      ${isCompleted || isCurrent ? 'text-blue-900' : 'text-gray-500'}
                    `}
                  >
                    {step.title}
                  </div>
                  {step.description && <div className='text-xs text-gray-500 mt-1'>{step.description}</div>}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className='flex-1 mx-4'>
                  <div
                    className={`
                      h-0.5 transition-all duration-200
                      ${isCompleted ? 'bg-emerald-500' : 'bg-gray-300'}
                    `}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
