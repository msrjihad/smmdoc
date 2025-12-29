import React from 'react';

interface GradientSpinnerProps {
  size?: string;
  className?: string;
}

export const GradientSpinner: React.FC<GradientSpinnerProps> = ({ 
  size = 'w-16 h-16', 
  className = '' 
}) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

export default GradientSpinner;
