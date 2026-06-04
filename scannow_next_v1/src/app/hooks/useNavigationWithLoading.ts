"use client";

import { useRouter } from "next/navigation";
import { useLoading } from "../contexts/LoadingContext";
import { useCallback } from "react";

export const useNavigationWithLoading = () => {
  const router = useRouter();
  const { setLoading } = useLoading();

  const navigateWithLoading = useCallback(
    (path: string, delay: number = 300) => {
      setLoading(true);
      
      // Use setTimeout to delay hiding the loader (in case of fast navigation)
      // This ensures the loader is visible for at least `delay` ms
      const timer = setTimeout(() => {
        router.push(path);
        // Hide loading after navigation completes (next.js navigation is async)
        // We'll use a timeout as a fallback since Next.js App Router doesn't have route events
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }, delay > 0 ? delay : 0);

      return () => clearTimeout(timer);
    },
    [router, setLoading]
  );

  return { navigateWithLoading };
};

