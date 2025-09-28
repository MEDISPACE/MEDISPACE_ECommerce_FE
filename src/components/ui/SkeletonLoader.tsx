import '../../style/LoadingSpinner.css';

interface SkeletonLoaderProps {
  variant?: 'form' | 'text' | 'input' | 'button' | 'custom';
  lines?: number;
  className?: string;
  width?: string;
  height?: string;
}

export default function SkeletonLoader({ 
  variant = 'text', 
  lines = 3, 
  className = '',
  width,
  height 
}: SkeletonLoaderProps) {
  const customStyle = {
    ...(width && { width }),
    ...(height && { height })
  };

  switch (variant) {
    case 'form':
      return (
        <div className={`space-y-4 ${className}`}>
          {/* Logo skeleton */}
          <div className="skeleton" style={{ height: '2rem', width: '60%', margin: '0 auto 2rem' }} />
          
          {/* Subtitle skeleton */}
          <div className="skeleton" style={{ height: '1rem', width: '80%', margin: '0 auto 2rem' }} />
          
          {/* Input skeletons */}
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index}>
              <div className="skeleton" style={{ height: '1rem', width: '30%', marginBottom: '0.5rem' }} />
              <div className="skeleton skeleton-input" />
            </div>
          ))}
          
          {/* Button skeleton */}
          <div className="skeleton skeleton-button" />
          
          {/* Social login skeleton */}
          <div className="skeleton" style={{ height: '1px', width: '100%', margin: '2rem 0 1rem' }} />
          <div className="skeleton" style={{ height: '3rem', width: '100%' }} />
          
          {/* Link skeleton */}
          <div className="skeleton" style={{ height: '1rem', width: '50%', margin: '1rem auto 0' }} />
        </div>
      );
      
    case 'input':
      return <div className={`skeleton skeleton-input ${className}`} style={customStyle} />;
      
    case 'button':
      return <div className={`skeleton skeleton-button ${className}`} style={customStyle} />;
      
    case 'text':
      return (
        <div className={className}>
          {Array.from({ length: lines }).map((_, index) => (
            <div 
              key={index} 
              className="skeleton skeleton-text" 
              style={{
                ...customStyle,
                ...(index === lines - 1 && { width: '60%' })
              }} 
            />
          ))}
        </div>
      );
      
    case 'custom':
      return <div className={`skeleton ${className}`} style={customStyle} />;
      
    default:
      return (
        <div className={className}>
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className="skeleton skeleton-text" style={customStyle} />
          ))}
        </div>
      );
  }
}