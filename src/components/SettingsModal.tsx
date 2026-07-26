import { useState, useEffect } from "react";
import { X, Sun, Moon, Ticket, Check, Loader2, ShieldCheck } from "lucide-react";
import { redeemVoucher, isVoucherRedeemed } from "../lib/vouchers";
import { isNativePlatform, purchaseRemoveAds, restorePurchases } from "../lib/billing";

interface SettingsModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
  onAdsRemoved?: () => void;
}

export function SettingsModal({ isOpen, isDarkMode, onToggleTheme, onClose, onAdsRemoved }: SettingsModalProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherStatus, setVoucherStatus] = useState<"idle" | "loading" | "success" | "invalid">("idle");
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "loading" | "error">("idle");
  const [purchaseError, setPurchaseError] = useState("");
  const alreadyRedeemed = isVoucherRedeemed();
  const isNative = isNativePlatform();

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!voucherCode.trim()) return;
    setVoucherStatus("loading");
    try {
      const ok = await redeemVoucher(voucherCode.trim());
      if (ok) {
        setVoucherStatus("success");
        setVoucherCode("");
        onAdsRemoved?.();
      } else {
        setVoucherStatus("invalid");
      }
    } catch {
      setVoucherStatus("invalid");
    }
  };

  const handlePurchase = async () => {
    setPurchaseStatus("loading");
    setPurchaseError("");
    try {
      await purchaseRemoveAds();
      setPurchaseStatus("idle");
      onAdsRemoved?.();
    } catch (err: any) {
      const msg = err?.message || err || "Purchase failed";
      if (msg.includes("cancel")) {
        setPurchaseStatus("idle");
      } else {
        setPurchaseStatus("error");
        setPurchaseError(msg);
      }
    }
  };

  const handleRestore = async () => {
    setPurchaseStatus("loading");
    setPurchaseError("");
    try {
      const ok = await restorePurchases();
      if (ok) {
        setPurchaseStatus("idle");
        onAdsRemoved?.();
      } else {
        setPurchaseStatus("error");
        setPurchaseError("No previous purchase found.");
      }
    } catch {
      setPurchaseStatus("error");
      setPurchaseError("Restore failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-sm mx-4 rounded-2xl border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col ${isDarkMode ? "bg-[#141526] border-white/10" : "bg-white border-slate-200"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
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
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Appearance */}
          <div>
            <p className={`text-[10px] font-semibold tracking-widest uppercase mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
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

          {/* Ad-Free Access */}
          <div>
            <p className={`text-[10px] font-semibold tracking-widest uppercase mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
              Ad-Free Access
            </p>

            {alreadyRedeemed ? (
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${isDarkMode ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                <Check className="h-4 w-4 shrink-0" />
                <span>Ad-free access active</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Purchase Button - only on native */}
                {isNative && (
                  <>
                    <button
                      onClick={handlePurchase}
                      disabled={purchaseStatus === "loading"}
                      className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${isDarkMode ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/20" : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"}`}
                    >
                      {purchaseStatus === "loading" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {purchaseStatus === "loading" ? "Processing..." : "Remove Ads - ₱200"}
                    </button>

                    <button
                      onClick={handleRestore}
                      disabled={purchaseStatus === "loading"}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors border ${isDarkMode ? "text-slate-400 hover:bg-white/5 border-white/5" : "text-slate-500 hover:bg-black/5 border-slate-200"}`}
                    >
                      Restore Purchase
                    </button>

                    {purchaseError && (
                      <p className="text-xs text-red-400">{purchaseError}</p>
                    )}

                    <div className={`border-t ${isDarkMode ? "border-white/5" : "border-slate-100"} pt-3`}>
                      <p className={`text-[10px] font-semibold tracking-widest uppercase mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
                        Or redeem a voucher
                      </p>
                    </div>
                  </>
                )}

                {/* Voucher Input */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                  <Ticket className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-400"}`} />
                  <input
                    type="text"
                    placeholder="Enter voucher code"
                    value={voucherCode}
                    onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherStatus("idle"); }}
                    onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                    className={`flex-1 bg-transparent outline-none text-sm font-mono tracking-wider placeholder:text-slate-500 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!voucherCode.trim() || voucherStatus === "loading"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                  >
                    {voucherStatus === "loading" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Redeem"
                    )}
                  </button>
                </div>

                {voucherStatus === "success" && (
                  <p className="text-xs text-emerald-400">Voucher redeemed successfully!</p>
                )}
                {voucherStatus === "invalid" && (
                  <p className="text-xs text-red-400">Invalid or already used code.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
