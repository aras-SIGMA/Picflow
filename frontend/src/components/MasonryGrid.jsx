// src/components/MasonryGrid.jsx
// Grid masonry responsif (CSS columns): 1 / 2 / 3 / 4 kolom pada
// 360 / 768 / 1024 / 1440px. Setiap PhotoCard mengatur spacing
// vertikalnya sendiri (mb-4) supaya tidak ada celah ganda.
export default function MasonryGrid({ children, className = "" }) {
  return (
    <div className={`columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 ${className}`}>
      {children}
    </div>
  );
}
