import ConfigDock from "@/components/Dock/ConfigDock";
import Header from "@/components/Header/Header";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-dvh md:h-screen">
      <Header />
      <main className="flex-1 overflow-auto">{children}</main>
      <ConfigDock />
    </div>
  );
}
