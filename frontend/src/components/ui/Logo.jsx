// src/components/ui/Logo.jsx
// Logo resmi PicFlow: Tiga batang histogram / prisma RGB (Merah, Hijau, Biru)
// dengan wordmark "Pic" + "F" (Red) + "l" (Green) + "ow" (Blue)
// dan subtext opsional "PHOTOGRAPHY" (tracking +3.5px).
// Sumber spesifikasi resmi: assets/images/picflow_logo_assets/picflow_logo/picflow-brand-guidelines.txt

export default function Logo({
  variant = "lockup", // "mark" | "lockup" | "icon"
  size = 32,
  className = "",
  showTagline = false,
  inverted = false, // true jika di atas latar gelap, false jika di atas latar terang
}) {
  const red = inverted ? "#F05555" : "#D62B2B";
  const green = inverted ? "#34D672" : "#16A34A";
  const blue = inverted ? "#60A5FA" : "#2563EB";
  const textDark = inverted ? "#F5F5F5" : "#111318";
  const subtextColor = inverted ? "#888888" : "#999999";

  if (variant === "mark") {
    return (
      <Mark
        size={size}
        className={className}
        red={red}
        green={green}
        blue={blue}
      />
    );
  }

  if (variant === "icon") {
    return (
      <IconCard
        size={size}
        className={className}
        red={red}
        green={green}
        blue={blue}
        inverted={inverted}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark
        size={size}
        red={red}
        green={green}
        blue={blue}
      />
      <span className="flex flex-col select-none">
        <span className="flex items-baseline text-[1.28em] font-extrabold leading-none tracking-tight">
          <span style={{ color: textDark }}>Pic</span>
          <span style={{ color: red }}>F</span>
          <span style={{ color: green }}>l</span>
          <span style={{ color: blue }}>ow</span>
        </span>
        {showTagline && (
          <span
            className="mt-1 font-mono text-[0.45em] font-medium uppercase tracking-[3.5px]"
            style={{ color: subtextColor }}
          >
            PHOTOGRAPHY
          </span>
        )}
      </span>
    </span>
  );
}

// 3 Bar Histogram / RGB Prism Mark
export function Mark({ size = 32, className = "", red = "#D62B2B", green = "#16A34A", blue = "#2563EB" }) {
  // Aspek rasio 54 lebar : 60 tinggi (0.9)
  const width = Math.round((size * 54) / 60);

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 54 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="PicFlow Histogram RGB Prism Logo"
    >
      {/* Red Bar */}
      <rect x="0" y="0" width="14" height="60" rx="7" fill={red} />
      {/* Green Bar */}
      <rect x="20" y="10" width="14" height="50" rx="7" fill={green} />
      {/* Blue Bar */}
      <rect x="40" y="4" width="14" height="56" rx="7" fill={blue} />
    </svg>
  );
}

// App Icon dengan squircle container
export function IconCard({
  size = 48,
  className = "",
  red = "#D62B2B",
  green = "#16A34A",
  blue = "#2563EB",
  inverted = false,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="PicFlow App Icon"
    >
      <rect
        width="64"
        height="64"
        rx="16"
        fill={inverted ? "#181B22" : "#F8F8F8"}
      />
      <rect x="13" y="10" width="10" height="44" rx="5" fill={red} />
      <rect x="27" y="18" width="10" height="36" rx="5" fill={green} />
      <rect x="41" y="12" width="10" height="40" rx="5" fill={blue} />
    </svg>
  );
}
