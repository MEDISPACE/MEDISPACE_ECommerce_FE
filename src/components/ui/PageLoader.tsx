import { Sparkles } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import '../../style/LoadingSpinner.css';

interface PageLoaderProps {
  message?: string;
  variant?: 'pill' | 'cross' | 'activity' | 'pulse';
}

export default function PageLoader({ 
  message = "Đang tải...", 
  variant = "pill" 
}: PageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-orb-float-1" />
      <div className="absolute bottom-[30%] right-[15%] w-48 h-48 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full blur-3xl animate-orb-float-2" />
      
      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles size={32} className="text-cyan-500 animate-sparkle" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              MEDISPACE
            </span>
          </div>
          <p className="text-blue-600 text-sm opacity-80">Nền tảng mua thuốc trực tuyến</p>
        </div>
        
        {/* Loading Spinner */}
        <div className="mb-6">
          <LoadingSpinner size="lg" variant={variant} />
        </div>
        
        {/* Loading Message */}
        <p className="text-slate-600 font-medium">{message}</p>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );
}