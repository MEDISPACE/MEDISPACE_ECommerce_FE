import { Sparkles } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="auth-header">
      {/* Logo with Sparkle Effect */}
      <div className="auth-logo-container">
        <div className="auth-logo">
          <Sparkles className="auth-logo-icon" size={24} />
          MEDISPACE
        </div>
        <div className="auth-logo-glow"></div>
      </div>
      
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </div>
  );
}