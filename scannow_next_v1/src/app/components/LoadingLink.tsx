"use client";

import Link from "next/link";
import { useLoading } from "../contexts/LoadingContext";
import { useCallback } from "react";

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const LoadingLink: React.FC<LoadingLinkProps> = ({ href, children, className, onClick }) => {
  const { setLoading } = useLoading();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }
    
    // Show loading when link is clicked
    setLoading(true);
    
    // Hide loading after navigation (Next.js handles the navigation)
    // Use a timeout as a fallback
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [setLoading, onClick]);

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default LoadingLink;

