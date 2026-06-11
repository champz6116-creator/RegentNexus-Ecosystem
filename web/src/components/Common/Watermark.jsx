import React from "react";
import RegentLogo from "/src/assets/RegentLogo.png";

export default function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 select-none flex items-center justify-center overflow-hidden">
      <img 
        src={RegentLogo} 
        alt="Portal Background Watermark" 
        className="
          /* 1. SIZING: Increased from 50vw to 65vw, max-width bumped to 550px */
          w-[65vw] max-w-[550px] object-contain 
          
          /* 2. OPACITY: Increased visibility significantly (from 0.03 to 0.12) */
          opacity-[0.12] dark:opacity-[0.18] 
          
          /* 3. ANGLE: Removed '-rotate-12' completely so it is perfectly straight and still */
        "
      />
    </div>
  );
}