"use client";

// src/components/ui/AuroraBackground.jsx
// Background Aurora Spektrum sRGB pada Kanvas Warm Cream #FEFAF3
// - Memadukan trio gamut sRGB (#EF4444 Red, #10B981 Green, #3B82F6 Blue)
// - Berakar pada filosofi desain "Fluid Organic Canvas & Modern Editorial"
import { memo } from "react";
import "./AuroraBackground.css";

export const AuroraBackground = memo(function AuroraBackground({
  children,
  className = "",
  showGrid = true,
}) {
  return (
    <div className={`aurora-root ${className}`}>
      {/* Aurora Spectral Beams */}
      <div className="aurora-beam aurora-beam--blue" />
      <div className="aurora-beam aurora-beam--green" />
      <div className="aurora-beam aurora-beam--coral" />
      <div className="aurora-curtain-strip" />

      {/* Micro Photographic Grid Pattern */}
      {showGrid && <div className="aurora-grid-texture" />}

      {/* Content wrapper */}
      {children}
    </div>
  );
});

AuroraBackground.displayName = "AuroraBackground";

export default AuroraBackground;
