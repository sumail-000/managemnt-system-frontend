import React from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Floating Dots with Ripple Effects */}
        <div className="absolute inset-0">
          {/* Large ripple circles */}
          <div className="ripple-circle ripple-1"></div>
          <div className="ripple-circle ripple-2"></div>
          <div className="ripple-circle ripple-3"></div>
          <div className="ripple-circle ripple-4"></div>
          <div className="ripple-circle ripple-5"></div>
          
          {/* Floating dots */}
          <div className="floating-dot dot-1"></div>
          <div className="floating-dot dot-2"></div>
          <div className="floating-dot dot-3"></div>
          <div className="floating-dot dot-4"></div>
          <div className="floating-dot dot-5"></div>
          <div className="floating-dot dot-6"></div>
          <div className="floating-dot dot-7"></div>
          <div className="floating-dot dot-8"></div>
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10"></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* CSS Styles */}
      <style jsx>{`
        .ripple-circle {
          position: absolute;
          border: 2px solid rgba(34, 197, 94, 0.2);
          border-radius: 50%;
          animation: ripple 6s infinite ease-out;
        }
        
        .ripple-1 {
          width: 200px;
          height: 200px;
          top: 10%;
          left: 15%;
          animation-delay: 0s;
        }
        
        .ripple-2 {
          width: 300px;
          height: 300px;
          top: 60%;
          right: 10%;
          animation-delay: 1.5s;
        }
        
        .ripple-3 {
          width: 150px;
          height: 150px;
          top: 30%;
          right: 25%;
          animation-delay: 3s;
        }
        
        .ripple-4 {
          width: 250px;
          height: 250px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4.5s;
        }
        
        .ripple-5 {
          width: 180px;
          height: 180px;
          top: 5%;
          right: 40%;
          animation-delay: 2s;
        }
        
        .floating-dot {
          position: absolute;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.4));
          border-radius: 50%;
          animation: float 8s infinite ease-in-out;
        }
        
        .dot-1 {
          width: 8px;
          height: 8px;
          top: 20%;
          left: 25%;
          animation-delay: 0s;
        }
        
        .dot-2 {
          width: 12px;
          height: 12px;
          top: 45%;
          right: 30%;
          animation-delay: 1s;
        }
        
        .dot-3 {
          width: 6px;
          height: 6px;
          top: 70%;
          left: 40%;
          animation-delay: 2s;
        }
        
        .dot-4 {
          width: 10px;
          height: 10px;
          top: 15%;
          right: 15%;
          animation-delay: 3s;
        }
        
        .dot-5 {
          width: 14px;
          height: 14px;
          bottom: 25%;
          left: 15%;
          animation-delay: 4s;
        }
        
        .dot-6 {
          width: 8px;
          height: 8px;
          top: 35%;
          left: 60%;
          animation-delay: 5s;
        }
        
        .dot-7 {
          width: 16px;
          height: 16px;
          bottom: 40%;
          right: 20%;
          animation-delay: 6s;
        }
        
        .dot-8 {
          width: 10px;
          height: 10px;
          top: 80%;
          right: 45%;
          animation-delay: 7s;
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
          50% {
            transform: translateY(-10px) translateX(-15px);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-25px) translateX(5px);
            opacity: 0.9;
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .ripple-circle {
            transform: scale(0.7);
          }
          
          .floating-dot {
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};