import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ProtectedRoute>{children} </ProtectedRoute>
    </>
  );
}
