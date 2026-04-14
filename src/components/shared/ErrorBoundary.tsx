import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {}

  public render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-8 text-center'>
            <div className='mb-6'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <AlertTriangle className='w-8 h-8 text-red-600' />
              </div>
              <h2 className='text-xl font-medium text-gray-900 mb-2'>Có lỗi xảy ra</h2>
              <p className='text-gray-600 mb-4'>
                Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
              </p>
              {this.state.error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-left mb-4'>
                  <p className='text-sm text-red-800 font-mono'>{this.state.error.message}</p>
                </div>
              )}
            </div>

            <div className='space-y-3'>
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              >
                <RotateCcw className='w-4 h-4 mr-2' />
                Thử lại
              </Button>
              <Button onClick={() => (window.location.href = '/')} variant='outline' className='w-full'>
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
