"use client";

import React from "react";
import { 
  Globe, 
  Sun, 
  Moon,
  Save
} from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useTheme } from "@/app/contexts/ThemeContext";

const SettingGroup = ({ title, icon, children }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-50 dark:border-slate-700 shadow-sm overflow-hidden">
    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{title}</h3>
    </div>
    <div className="p-8 space-y-6">
      {children}
    </div>
  </div>
);

export default function SettingsAdmin() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">System Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure platform preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SettingGroup title="Language" icon={<Globe size={18} />}>
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select your preferred language</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLanguage("en")}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  language === "en" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <div className="text-3xl">🇺🇸</div>
                <p className="font-bold">English</p>
              </button>
              <button
                onClick={() => setLanguage("kh")}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  language === "kh" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <div className="text-3xl">🇰🇭</div>
                <p className="font-bold">ភាសាខ្មែរ</p>
              </button>
            </div>
          </div>
        </SettingGroup>

        <SettingGroup title="Theme" icon={<Sun size={18} />}>
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Choose your preferred theme</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  theme === "light" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <Sun size={32} />
                <p className="font-bold">Light</p>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  theme === "dark" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <Moon size={32} />
                <p className="font-bold">Dark</p>
              </button>
            </div>
          </div>
        </SettingGroup>
      </div>
    </div>
  );
}
