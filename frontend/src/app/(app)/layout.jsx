// src/app/(app)/layout.jsx
// Chrome untuk halaman privat (Home, Add Photo, Account): Navbar sticky +
// konten + Footer — persis seperti perilaku sebelumnya.
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";

export default function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
