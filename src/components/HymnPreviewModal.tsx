import { X, Music, FileText, User, Tag, Download } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Hymn } from "../types";

interface HymnPreviewModalProps {
  isOpen: boolean;
  hymn: Hymn | null;
  isImporting: boolean;
  onImport: () => void;
  onCancel: () => void;
  error?: string | null;
}

const COLOR_MAP: Record<string, string> = {
  pink: "bg-pink-500",
  indigo: "bg-indigo-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
};

export function HymnPreviewModal({ isOpen, hymn, isImporting, onImport, onCancel, error }: HymnPreviewModalProps) {
  if (!isOpen || !hymn) return null;

  const infoFields = [
    { label: "Lyricist", value: hymn.lyrics },
    { label: "Music", value: hymn.music },
    { label: "Arranger", value: hymn.arranger },
    { label: "Instruments", value: hymn.info },
  ].filter((f) => f.value);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0b0c15]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <button
              onClick={onCancel}
              disabled={isImporting}
              className="absolute top-4 right-4 p-1 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-green-600/15 border border-green-500/20 text-green-400 rounded-2xl">
                <Music className="h-5 w-5" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-display font-bold text-slate-200 text-sm leading-tight">
                  {hymn.name}
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Import Preview
                </span>
              </div>
            </div>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {/* Voice Parts */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Music className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase">
                    Voice Parts ({hymn.voices.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hymn.voices.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className={`w-2 h-2 rounded-full ${COLOR_MAP[v.color] || "bg-amber-500"}`} />
                      <span className="text-xs text-slate-300 font-medium">{v.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sheet Music */}
              {hymn.sheetName && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <FileText className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs text-purple-300 font-medium">Sheet music included: {hymn.sheetName}</span>
                </div>
              )}

              {/* Info Fields */}
              {infoFields.length > 0 && (
                <div className="space-y-1.5">
                  {infoFields.map((f) => (
                    <div key={f.label} className="flex items-start gap-2">
                      {f.label === "Lyricist" ? (
                        <User className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                      ) : f.label === "Music" ? (
                        <Music className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                      ) : (
                        <Tag className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{f.label}: </span>
                        <span className="text-xs text-slate-300">{f.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {hymn.tags && hymn.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hymn.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={onCancel}
                disabled={isImporting}
                className="py-1.5 px-3 rounded-lg text-slate-400 hover:text-slate-200 font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onImport}
                disabled={isImporting}
                className="py-1.5 px-4 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-xs cursor-pointer border border-green-400/20 shadow-md shadow-green-600/10 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Import
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
