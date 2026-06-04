"use client";

import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock auth session
    setUser(null);
    setLoading(false);
  }, []);

  const signOut = async () => {
    console.log("Sign out called (no-op)");
  };

  return {
    user,
    loading,
    signOut,
  };
}
