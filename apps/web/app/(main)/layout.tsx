import Header from "@/components/Header/Header";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="w-full h-full overflow-hidden">{children}</main>
    </>
  );
}
