import { Pill, Cross, Activity, Heart, Shield, Stethoscope } from 'lucide-react';

export default function MedicalBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-cyan-50" />
      
      {/* Floating Medical Icons */}
      <div className="absolute inset-0">
        {/* Pills */}
        <div className="absolute top-[10%] left-[5%] animate-float-slow opacity-20">
          <div className="medical-icon-glow">
            <Pill size={24} className="text-blue-400 rotate-45" />
          </div>
        </div>
        <div className="absolute top-[60%] left-[15%] animate-float-medium opacity-15">
          <div className="medical-icon-glow">
            <Pill size={32} className="text-cyan-400 rotate-12" />
          </div>
        </div>
        <div className="absolute top-[20%] right-[10%] animate-float-fast opacity-25">
          <div className="medical-icon-glow">
            <Pill size={20} className="text-blue-500 -rotate-30" />
          </div>
        </div>
        <div className="absolute bottom-[30%] right-[5%] animate-float-slow opacity-20">
          <div className="medical-icon-glow">
            <Pill size={28} className="text-cyan-500 rotate-60" />
          </div>
        </div>

        {/* Medical Crosses */}
        <div className="absolute top-[15%] left-[80%] animate-pulse-slow opacity-30">
          <div className="medical-icon-glow">
            <Cross size={18} className="text-red-400" />
          </div>
        </div>
        <div className="absolute bottom-[40%] left-[10%] animate-pulse-medium opacity-25">
          <div className="medical-icon-glow">
            <Cross size={22} className="text-red-500" />
          </div>
        </div>
        <div className="absolute top-[70%] right-[20%] animate-pulse-fast opacity-35">
          <div className="medical-icon-glow">
            <Cross size={16} className="text-red-400" />
          </div>
        </div>

        {/* Hearts */}
        <div className="absolute top-[40%] left-[20%] animate-heartbeat opacity-20">
          <div className="medical-icon-glow">
            <Heart size={20} className="text-pink-400" />
          </div>
        </div>
        <div className="absolute bottom-[20%] right-[15%] animate-heartbeat-slow opacity-25">
          <div className="medical-icon-glow">
            <Heart size={24} className="text-pink-500" />
          </div>
        </div>

        {/* Activity/ECG Lines */}
        <div className="absolute top-[25%] left-[70%] animate-float-medium opacity-30">
          <div className="medical-icon-glow">
            <Activity size={26} className="text-green-400" />
          </div>
        </div>
        <div className="absolute bottom-[60%] left-[30%] animate-float-fast opacity-25">
          <div className="medical-icon-glow">
            <Activity size={22} className="text-green-500" />
          </div>
        </div>

        {/* Shields (Protection/Health) */}
        <div className="absolute top-[50%] right-[25%] animate-float-slow opacity-20">
          <div className="medical-icon-glow">
            <Shield size={24} className="text-blue-400" />
          </div>
        </div>
        <div className="absolute bottom-[10%] left-[60%] animate-float-medium opacity-25">
          <div className="medical-icon-glow">
            <Shield size={20} className="text-cyan-400" />
          </div>
        </div>

        {/* Stethoscopes */}
        <div className="absolute top-[80%] left-[40%] animate-float-fast opacity-15">
          <div className="medical-icon-glow">
            <Stethoscope size={28} className="text-blue-500 rotate-15" />
          </div>
        </div>
        <div className="absolute top-[35%] right-[40%] animate-float-slow opacity-20">
          <div className="medical-icon-glow">
            <Stethoscope size={24} className="text-cyan-500 -rotate-20" />
          </div>
        </div>
      </div>

      {/* Geometric Medical Patterns */}
      <div className="absolute inset-0">
        {/* DNA-like helixes */}
        <div className="absolute top-[30%] left-[85%] w-2 h-32 opacity-10">
          <div className="w-full h-full bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full animate-rotate-slow" />
        </div>
        <div className="absolute bottom-[25%] left-[5%] w-2 h-24 opacity-15">
          <div className="w-full h-full bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full animate-rotate-medium" />
        </div>

        {/* Molecular structures */}
        <div className="absolute top-[10%] left-[45%] opacity-10">
          <div className="relative">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-float-slow" />
            <div className="absolute top-4 left-2 w-2 h-2 bg-cyan-400 rounded-full animate-float-medium" />
            <div className="absolute -top-2 -left-1 w-2 h-2 bg-blue-500 rounded-full animate-float-fast" />
            <div className="absolute top-1 left-5 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-float-slow" />
          </div>
        </div>
        
        <div className="absolute bottom-[40%] right-[35%] opacity-15">
          <div className="relative">
            <div className="w-4 h-4 bg-green-400 rounded-full animate-float-medium" />
            <div className="absolute top-3 left-3 w-2.5 h-2.5 bg-blue-400 rounded-full animate-float-fast" />
            <div className="absolute -top-1 -left-2 w-2 h-2 bg-cyan-400 rounded-full animate-float-slow" />
          </div>
        </div>
      </div>

      {/* Enhanced Background Patterns */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-orb-float-1" />
        <div className="absolute bottom-[30%] right-[15%] w-48 h-48 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full blur-3xl animate-orb-float-2" />
        <div className="absolute top-[60%] left-[70%] w-32 h-32 bg-gradient-to-r from-blue-500/20 to-cyan-300/20 rounded-full blur-2xl animate-orb-float-3" />
        
        {/* Light rays */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-blue-300/30 to-transparent animate-light-ray-1" />
        <div className="absolute top-0 right-1/3 w-px h-24 bg-gradient-to-b from-cyan-300/25 to-transparent animate-light-ray-2" />
        <div className="absolute bottom-0 left-2/3 w-px h-28 bg-gradient-to-t from-blue-400/35 to-transparent animate-light-ray-3" />
      </div>
    </div>
  );
}