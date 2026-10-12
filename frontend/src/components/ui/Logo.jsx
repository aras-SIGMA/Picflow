// src/components/ui/Logo.jsx
// Logo resmi PicFlow: Lensa aperture 4 blade (Merah, Hijau, Biru, Slate)
// dengan barrel optik presisi, wordmark "Pic" + "Flow" (gradien sRGB spektrum),
// dan micro dots kalibrasi warna R-G-B.
// Sumber spesifikasi: assets/images/stitch_picflow_brand_design_system/code.html
export default function Logo({
  variant = "lockup",
  size = 36,
  className = "",
  showTagline = false,
  inverted = false, // true jika di atas latar gelap, false jika di atas latar terang
}) {
  const uid = `picflow-logo-${variant}-${size}`;

  if (variant === "mark") {
    return <Mark size={size} className={className} uid={uid} />;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={size} uid={uid} />
      <span className="flex flex-col">
        <span className="flex items-baseline text-[1.35em] font-extrabold leading-none tracking-tight">
          <span className={inverted ? "text-white" : "text-slate-900"}>Pic</span>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #EF4444 0%, #10B981 50%, #3B82F6 100%)",
            }}
          >
            Flow
          </span>
        </span>
        {showTagline && (
          <span className="mt-1 flex items-center gap-1.5">
            <span className="flex items-center gap-[3px]" aria-hidden="true">
              <i className="h-[4px] w-[4px] rounded-full bg-[#EF4444]" />
              <i className="h-[4px] w-[4px] rounded-full bg-[#10B981]" />
              <i className="h-[4px] w-[4px] rounded-full bg-[#3B82F6]" />
            </span>
            <span
              className={`font-mono text-[0.52em] font-semibold uppercase tracking-[0.16em] ${
                inverted ? "text-slate-400" : "text-slate-500"
              }`}
            >
              sRGB Standard &amp; Craft
            </span>
          </span>
        )}
      </span>
    </span>
  );
}

function Mark({ size = 36, className = "", uid }) {
  const red = `${uid}-red`;
  const green = `${uid}-green`;
  const blue = `${uid}-blue`;
  const slate = `${uid}-slate`;
  const glass = `${uid}-glass`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      fill="none"
      className={className}
      role="img"
      aria-label="PicFlow Aperture Logo"
    >
      <defs>
        <linearGradient id={red} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={green} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={blue} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={slate} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={glass} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer Neutral Precision Lens Barrel */}
      <circle
        cx="44"
        cy="44"
        r="41.5"
        stroke="#CBD5E1"
        strokeWidth="1.75"
        fill="none"
      />
      <circle cx="44" cy="44" r="35" fill="#0F172A" />

      {/* 4 Aperture Blades: Blue, Green, Red, Slate */}
      <path
        d="M 44 18 C 58 18 70 29 70 44 C 56 42 46 32 44 18 Z"
        fill={`url(#${blue})`}
      />
      <path
        d="M 70 44 C 70 58 59 70 44 70 C 46 56 56 46 70 44 Z"
        fill={`url(#${green})`}
      />
      <path
        d="M 44 70 C 30 70 18 59 18 44 C 32 46 42 56 44 70 Z"
        fill={`url(#${red})`}
      />
      <path
        d="M 18 44 C 18 30 29 18 44 18 C 42 32 32 42 18 44 Z"
        fill={`url(#${slate})`}
      />

      {/* Optical Core Lens */}
      <circle
        cx="44"
        cy="44"
        r="11"
        fill="#0B0F19"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      <ellipse
        cx="41"
        cy="40"
        rx="3.5"
        ry="2"
        fill={`url(#${glass})`}
        transform="rotate(-30 41 40)"
      />
    </svg>
  );
}
