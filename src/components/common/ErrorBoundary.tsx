import React, { Component } from 'react'
import type { ErrorInfo } from 'react'

type ReactNode = React.ReactNode
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white/95 backdrop-blur-xl border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg'>
            <div className='flex justify-center mb-4'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-8 h-8 text-red-600' />
              </div>
            </div>

            <h2 className='text-xl font-semibold text-red-800 mb-2'>Đã xảy ra lỗi</h2>

            <p className='text-red-600 mb-6 text-sm'>
              Ứng dụng đã gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
            </p>

            <button
              onClick={this.handleReload}
              className='inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium'
            >
              <RefreshCw size={16} />
              Tải lại trang
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mt-4 text-left'>
                <summary className='cursor-pointer text-sm text-red-700 font-medium'>
                  Chi tiết lỗi (Development)
                </summary>
                <pre className='mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 overflow-auto'>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
