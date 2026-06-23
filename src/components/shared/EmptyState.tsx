import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionUrl?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, actionUrl, onAction }: EmptyStateProps) {
  return (
    <Card className='border-[#E8EDF5] bg-white shadow-sm'>
      <CardContent className='text-center py-12 px-6 border-[#E8EDF5]'>
        <div className='text-blue-300 mb-4 flex justify-center'>{icon}</div>
        <h3 className='text-xl font-medium text-gray-900 mb-2'>{title}</h3>
        <p className='text-gray-600 mb-6 max-w-md mx-auto'>{description}</p>

        {actionLabel && (actionUrl || onAction) && (
          <div>
            {actionUrl ? (
              <a href={actionUrl}>
                <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white hover:from-[#071A49] hover:to-[#0A2463] hover:text-white'>
                  {actionLabel}
                </Button>
              </a>
            ) : (
              <Button
                onClick={onAction}
                className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white hover:from-[#071A49] hover:to-[#0A2463] hover:text-white'
              >
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
