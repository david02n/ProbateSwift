import React from "react";
import logoPath from "@/assets/logo_lite_wide_full.png";

interface SwiftLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

// Logo only component (swift bird) using the PNG logo
export const SwiftLogo: React.FC<SwiftLogoProps> = ({ 
  className = "", 
  size = 40,
  color = "#002B49" // Dark blue color from the logo (not used with PNG)
}) => {
  return (
    <div className={className}>
      <img 
        src={logoPath} 
        alt="ProbateSwift" 
        style={{ 
          height: `${size}px`,
          width: 'auto',
        }} 
      />
    </div>
  );
};

// Logo with text component (using the provided image)
export const SwiftLogoWithText: React.FC<SwiftLogoProps & { height?: number }> = ({
  className = "",
  height = 50
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoPath} 
        alt="ProbateSwift" 
        style={{ 
          height: `${height}px`,
          width: 'auto',
        }} 
      />
    </div>
  );
};