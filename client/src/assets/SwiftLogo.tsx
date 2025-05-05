import React from "react";
import logoPath from "./logo_lite_wide_full.png";

interface SwiftLogoProps {
  className?: string;
  textColor?: string;
  height?: number;
}

// Swift bird logo using the png instead of SVG
export const SwiftLogo: React.FC<SwiftLogoProps> = ({ 
  className = "", 
  height = 40
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

// Logo with text component using directly imported image
export const SwiftLogoWithText: React.FC<SwiftLogoProps> = ({
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
