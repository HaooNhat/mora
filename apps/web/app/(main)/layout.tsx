export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="relative w-full h-screen overflow-hidden">
        {children}
      </main>
    </>
  );
}
