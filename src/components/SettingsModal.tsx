import { X, Sun, Moon } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
}

export function SettingsModal({ isOpen, isDarkMode, onToggleTheme, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-sm mx-4 rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode ? "bg-[#141526] border-white/10" : "bg-white border-slate-200"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
          <h3 className={`font-display font-bold text-sm ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
            Settings
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg cursor-pointer transition-colors ${isDarkMode ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-black/5"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className={`text-[10px] font-semibold tracking-widest uppercase ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
            Appearance
          </p>
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors border ${isDarkMode ? "text-slate-200 hover:bg-white/5 border-white/5" : "text-slate-700 hover:bg-black/5 border-black/5"}`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>
    </div>
  );
}
