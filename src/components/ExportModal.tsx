import { useState } from "react";
import { X, Download, Lock, Eye, EyeOff, FileText, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface ExportMetadata {
  title: string;
  lyricist: string;
  music: string;
  arrangement: string;
  instruments: string;
  tags: string;
  info: string;
  password: string;
  sheetName: string;
  sheetData: ArrayBuffer | null;
}

interface ExportModalProps {
  isOpen: boolean;
  defaultTitle: string;
  initialSheetName: string;
  initialSheetData: ArrayBuffer | null;
  isExporting: boolean;
  onExport: (meta: ExportMetadata) => void;
  onClose: () => void;
}

export function ExportModal({ isOpen, defaultTitle, initialSheetName, initialSheetData, isExporting, onExport, onClose }: ExportModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [lyricist, setLyricist] = useState("");
  const [music, setMusic] = useState("");
  const [arrangement, setArrangement] = useState("");
  const [instruments, setInstruments] = useState("");
  const [tags, setTags] = useState("");
  const [info, setInfo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sheetName, setSheetName] = useState(initialSheetName);
  const [sheetData, setSheetData] = useState<ArrayBuffer | null>(initialSheetData);

  if (!isOpen) return null;

  const handleExport = () => {
    if (!title.trim()) return;
    onExport({ title: title.trim(), lyricist, music, arrangement, instruments, tags, info, password, sheetName, sheetData });
  };

  const handlePickPdf = async () => {
    if (typeof window !== "undefined" && window.electronFS?.pickPdfFile) {
      const result = await window.electronFS.pickPdfFile();
      if (result) {
        setSheetName(result.name);
        setSheetData(result.buffer.buffer.slice(result.buffer.byteOffset, result.buffer.byteOffset + result.buffer.byteLength));
      }
    }
  };

  const handleRemovePdf = () => {
    setSheetName("");
    setSheetData(null);
  };

  const inputClass = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500";

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
              onClick={onClose}
              disabled={isExporting}
              className="absolute top-4 right-4 p-1 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-600/15 border border-blue-500/20 text-blue-400 rounded-2xl">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-display font-bold text-slate-200 text-sm">
                  Export Project
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Metadata & Info
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase block mb-1">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Hymn title" autoFocus />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase block mb-1">Lyricist</label>
                <input type="text" value={lyricist} onChange={(e) => setLyricist(e.target.value)} className={inputClass} placeholder="Lyricist name" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase block mb-1">Music</label>
                <input type="text" value={music} onChange={(e) => setMusic(e.target.value)} className={inputClass} placeholder="Composer name" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase block mb-1">Arrangement</label>
                <input type="text" value={arrangement} onChange={(e) => setArrangement(e.target.value)} className={inputClass} placeholder="Arranger name" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase block mb-1">Instruments</label>
                <input type="text" value={instruments} onChange={(e) => setInstruments(e.target.value)} className={inputClass} placeholder="Instrumentalist Name" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase block mb-1">Category</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="e.g. Ordinary, Advent, Lent, etc. (separate by comma)" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase block mb-1">Info</label>
                <textarea value={info} onChange={(e) => setInfo(e.target.value)} className={`${inputClass} resize-none h-20`} placeholder="Additional notes..." />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5 mb-1">
                  <FileText className="h-3 w-3" />
                  Sheet Music (optional)
                </label>
                {sheetName ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300 truncate flex-1">{sheetName}</span>
                    <button onClick={handleRemovePdf} className="p-0.5 rounded text-slate-500 hover:text-red-400 cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePickPdf}
                    className="w-full px-3 py-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-xs text-slate-500 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Attach PDF sheet music
                  </button>
                )}
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5 mb-1">
                  <Lock className="h-3 w-3" />
                  Password (optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-9`}
                    placeholder="Leave empty for no encryption"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="py-1.5 px-3 rounded-lg text-slate-400 hover:text-slate-200 font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || !title.trim()}
                className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer border border-blue-400/20 shadow-md shadow-blue-600/10 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Export ZIP
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
