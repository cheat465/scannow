"use client";

import React from "react";

interface LoadingProps {
  isLoading: boolean;
}

const Loading: React.FC<LoadingProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-6">
        <img
          src="/logo/main/snloading.webp"
          alt="Loading"
          style={{ 
            width: 180, 
            height: "auto", 
            animation: "logoPulse 2s ease-in-out infinite" 
          }}
        />
        <div style={{ display: "flex", gap: 5 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#61A9E5",
            animation: "loadingDot 1.4s ease-in-out infinite",
            animationDelay: "0s"
          }}></span>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#61A9E5",
            animation: "loadingDot 1.4s ease-in-out infinite",
            animationDelay: "0.2s"
          }}></span>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#61A9E5",
            animation: "loadingDot 1.4s ease-in-out infinite",
            animationDelay: "0.4s"
          }}></span>
        </div>
      </div>
      <style>{`
        @keyframes logoPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.03);
          }
        }
        @keyframes loadingDot {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;

