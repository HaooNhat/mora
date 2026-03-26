"use client";

import router from "next/router";
import { useEffect, useState } from "react";

type User = {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
};

export default function AuthCallbackClient() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const initAuth = async () => {
          try {
            const res = await fetch("http://localhost:3001/auth/me", {
              credentials: "include",
            });

            console.log(res);

            if (!res.ok) {
              throw new Error("Failed to fetch user");
            }

            const data = await res.json();
            setUser(data);
          } catch (err: unknown) {
            if (err instanceof Error) {
              setError(err.message);
            } else {
              setError("Unknown error");
            }
          }
        };

        void initAuth();
      } catch {
        setError("Authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, []);

  if (error) return <div>{error}</div>;
  if (!user) return <div>Loading...</div>;

  return <div>Welcome {user.firstName}</div>;
}
