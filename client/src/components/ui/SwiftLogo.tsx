import React from "react";

interface SwiftLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

// Logo only component (swift bird)
export const SwiftLogo: React.FC<SwiftLogoProps> = ({ 
  className = "", 
  size = 40,
  color = "#002B49" // Dark blue color from the logo
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Swift bird silhouette based on the provided PNG logo */}
      <path
        d="M244.8 88.2C289.7 111.3 334.5 155.9 311.6 177.1C303 184.9 290.1 187.2 277 186.5C256.4 185.5 236.1 178.6 217.5 170.7C192.9 160.2 168.5 147.9 138.4 152C132.3 152.9 126.1 154.3 120.3 156.9C114.3 159.5 108.7 163.6 104.4 168.9C100.1 174.2 97.2 180.7 96.1 187.5C95 194.4 95.8 201.7 98.3 208.3C106.1 228.6 128.1 242.8 150.9 252.1C173.7 261.4 199.3 266.3 224.7 269.3C235.1 270.5 245.5 271.4 256 271.4C266.5 271.4 277 270.4 287.3 268.6C297.5 266.8 307.5 264.2 317.2 260.8C63.1 309.5 69.8 174.8 68.7 153.3C67.6 131.8 84.2 105.3 114.3 117.1C136.8 125.8 159.3 148.8 159.3 148.8C159.3 148.8 111.6 74.3 244.8 88.2Z"
        fill={color}
      />
      {/* Eye of the bird */}
      <circle cx="282" cy="177" r="4" fill="white" />
    </svg>
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
        src="/assets/logo_lite_wide_full.png" 
        alt="ProbateSwift" 
        style={{ 
          height: `${height}px`,
          width: 'auto',
        }} 
      />
    </div>
  );
};