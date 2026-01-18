"use client";

import { useAuthOld } from "@/hooks/use-auth";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Loader2, Mail, Waves } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Login Page
 *
 * Features:
 * - Google OAuth
 * - GitHub OAuth (optional)
 * - Magic Link Email (optional)
 * - Auto-redirect if authenticated
 */
export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    clearError,
  } = useAuthOld();

  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };

  const handleGithubSignIn = async () => {
    clearError();
    await signInWithGithub();
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    clearError();
    await signInWithEmail(email.trim());
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl">
                <Waves className="h-8 w-8 text-white" />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome to Mora
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to start your focused journey
            </p>
          </div>

          {/* Error Message */}
          {error && error.code !== "EMAIL_SENT" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">
                {error.message}
              </p>
            </motion.div>
          )}

          {/* Success Message (Email Sent) */}
          {error && error.code === "EMAIL_SENT" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <p className="text-sm text-green-600 dark:text-green-400">
                {error.message}
              </p>
            </motion.div>
          )}

          {/* Sign In Buttons */}
          <div className="space-y-3">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium relative overflow-hidden group"
              variant="outline"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5 mr-2" />
                  Continue with Google
                </>
              )}
            </Button>

            {/* GitHub Sign In (Optional) */}
            {/* <Button
              onClick={handleGithubSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Github className="h-5 w-5 mr-2" />
                  Continue with GitHub
                </>
              )}
            </Button> */}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
                  or
                </span>
              </div>
            </div>

            {/* Email Sign In Toggle */}
            {!showEmailForm ? (
              <Button
                onClick={() => setShowEmailForm(true)}
                variant="ghost"
                className="w-full h-12 text-base font-medium"
              >
                <Mail className="h-5 w-5 mr-2" />
                Continue with Email
              </Button>
            ) : (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleEmailSignIn}
                className="space-y-3"
              >
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="flex-1 h-12"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Send Magic Link"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEmailForm(false)}
                    disabled={isLoading}
                    className="h-12"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
        >
          <p>✨ Focus better, achieve more</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

const GoogleIcon = ({ className }: { className?: string }) => {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        height="48"
        width="48"
        className={className}
      >
        <defs>
          <linearGradient
            id="a"
            x1="3.2173"
            y1="15"
            x2="44.7812"
            y2="15"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#d93025" />
            <stop offset="1" stopColor="#ea4335" />
          </linearGradient>
          <linearGradient
            id="b"
            x1="20.7219"
            y1="47.6791"
            x2="41.5039"
            y2="11.6837"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#fcc934" />
            <stop offset="1" stopColor="#fbbc04" />
          </linearGradient>
          <linearGradient
            id="c"
            x1="26.5981"
            y1="46.5015"
            x2="5.8161"
            y2="10.506"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#1e8e3e" />
            <stop offset="1" stopColor="#34a853" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="23.9947" r="12" fill="#fff" />
        <path
          d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z"
          fill="none"
        />
        <path
          d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z"
          fill="url(#a)"
        />
        <circle cx="24" cy="24" r="9.5" fill="#1a73e8" />
        <path
          d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z"
          fill="url(#b)"
        />
        <path
          d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z"
          fill="url(#c)"
        />
      </svg>
    </>
  );
};
