import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ToastProvider from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata = {
  title: "PicFlow",
  description: "Vault pribadi untuk karya fotografi terbaikmu (Next.js + Express)",
};

// Root layout TIDAK memasang Navbar/Footer lagi: chrome halaman privat
// hidup di route group (app), shell auth di route group (auth).
export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <ToastProvider>
            <div className="grain-overlay" aria-hidden="true" />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
