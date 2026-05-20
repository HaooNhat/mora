import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950 text-center px-4">
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white">404</h1>
      <p className="text-gray-500 dark:text-gray-400">Page not found.</p>
      <Link
        href="/"
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Go home
      </Link>
    </div>
  );
}
