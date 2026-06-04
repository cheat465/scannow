"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Loading from "../components/Loading";

interface LoadingContextType {
  setLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hide loading when pathname changes (navigation completed)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && isLoading) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Hide loading after a short delay to ensure smooth transition
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isLoading]);

  const setLoading = useCallback((loading: boolean) => {
    if (loading) {
      setIsLoading(true);
    } else {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsLoading(false);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ setLoading, isLoading }}>
      {children}
      <Loading isLoading={isLoading} />
    </LoadingContext.Provider>
  );
};

