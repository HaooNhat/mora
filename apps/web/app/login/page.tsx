"use client";

import { GoogleIcon } from "@/asset/icons/google.icon";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Loader2, Lock, Mail, Waves } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  } = useAuth();

  const [email, setEmail] = useState("");

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black from-5% dark:via-gray-700 to-95% dark:to-black">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="bg-gradient-to-br from-blue-600 to-pink-600 p-3 rounded-2xl">
                <Waves className="h-8 w-8 text-white" />
              </div>
            </motion.div>

            <h1 className="text-3xl font-semibold text-background-foreground mb-2">
              Welcome to{" "}
              <span className="font-bold bg-gradient-to-br from-blue-600 from-40% via-white to-60% to-pink-600 bg-clip-text text-transparent">
                Mora
              </span>
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

          {/* Sign In Informations */}
          <div className="space-y-3">
            {/* Sign in with Email and Password */}
            <div className="">
              <FieldSet>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor="email-login-input">
                      <Mail className="w-5 h-5" />
                      Email:
                    </FieldLabel>
                    <Input id="input-email-login" className="h-12" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="input-password-login">
                      <Lock className="w-5 h-5" />
                      Password:
                    </FieldLabel>
                    <Input
                      id="input-password-login"
                      type="password"
                      className="h-12"
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </div>

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
