import Navbar from "@/components/Navbar";

export default function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
