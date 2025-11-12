import Sidebar from "../admin/components/Sidebar";

export default function CoordinadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
