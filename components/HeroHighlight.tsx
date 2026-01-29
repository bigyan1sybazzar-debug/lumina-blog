'use client';

import React from 'react';

interface HeroHighlightProps {
    children: React.ReactNode;
    className?: string;
    showGradient?: boolean;
}

export const HeroHighlight: React.FC<HeroHighlightProps> = ({
    children,
    className = "",
    showGradient = true
}) => {
    return (
        <section className={`relative overflow-hidden ${className}`}>
            {/* Animated Background Gradients */}
            {showGradient && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900"></div>
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-primary-400/20 md:from-primary-400/30 to-purple-600/20 md:to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-gradient-to-tr from-pink-400/15 to-primary-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </>
            )}

            <div className="max-w-7xl mx-auto relative z-10">
                {children}
            </div>

            {/* Custom Animations */}
            <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
        </section>
    );
};

export default HeroHighlight;
