import { useState } from "react"
import { isAdsRemoved, purchaseRemoveAds } from "../lib/ads"
import { Loader2 } from "lucide-react"

const BANNER_HEIGHT = 60

interface BannerAdProps {
  vertical?: boolean
  onPurchase?: () => void
}

export function BannerAd({ vertical, onPurchase }: BannerAdProps) {
  const [removed, setRemoved] = useState(isAdsRemoved)
  const [showModal, setShowModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [done, setDone] = useState(false)

  if (removed) return null

  const handlePurchase = async () => {
    setPurchasing(true)
    try {
      await purchaseRemoveAds()
      setDone(true)
      onPurchase?.()
      setTimeout(() => {
        setShowModal(false)
        setRemoved(true)
      }, 1500)
    } finally {
      setPurchasing(false)
    }
  }

  if (vertical) {
    return (
      <>
        <div
          onClick={() => setShowModal(true)}
          className="flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-blue-900/20 via-blue-800/15 to-blue-900/20 border-l border-blue-500/10 px-2 cursor-pointer hover:from-blue-800/25 hover:via-blue-700/20 transition-all shrink-0 h-full self-stretch"
          style={{ width: "60px", minWidth: "60px" }}
        >
          <span className="text-[8px] font-bold text-blue-400/80 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">
            AD
          </span>
          <span className="text-[7px] text-slate-500 leading-tight text-center">
            Support Choralis
          </span>
        </div>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1d24] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
              {done ? (
                <>
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">Ads Removed!</h3>
                  <p className="text-sm text-slate-400">Thank you for supporting Choralis.</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">Remove Ads</h3>
                  <p className="text-sm text-slate-400 mb-6">Enjoy Choralis completely ad-free with a one-time purchase.</p>
                  <p className="text-2xl font-bold text-slate-100 mb-6">$1.99</p>
                  <button onClick={handlePurchase} disabled={purchasing} className="py-3 px-6 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base border border-blue-400/30 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                    {purchasing && <Loader2 className="h-5 w-5 animate-spin" />}
                    {purchasing ? "Processing..." : "Purchase"}
                  </button>
                  <button onClick={() => setShowModal(false)} className="py-2 px-4 mt-2 w-full rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm cursor-pointer border border-white/5">Maybe later</button>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-900/20 via-blue-800/15 to-blue-900/20 border-t border-blue-500/10 px-3 cursor-pointer hover:from-blue-800/25 hover:via-blue-700/20 transition-all shrink-0"
        style={{ height: `${BANNER_HEIGHT}px`, minHeight: `${BANNER_HEIGHT}px` }}
      >
        <span className="text-[9px] font-bold text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">AD</span>
        <span className="text-[10px] text-slate-400 font-medium tracking-wide">Support Choralis — Remove Ads</span>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1d24] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            {done ? (
              <>
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg font-bold text-green-400 mb-2">Ads Removed!</h3>
                <p className="text-sm text-slate-400">Thank you for supporting Choralis.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Remove Ads</h3>
                <p className="text-sm text-slate-400 mb-6">Enjoy Choralis completely ad-free with a one-time purchase.</p>
                <p className="text-2xl font-bold text-slate-100 mb-6">$1.99</p>
                <button onClick={handlePurchase} disabled={purchasing} className="py-3 px-6 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base border border-blue-400/30 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {purchasing && <Loader2 className="h-5 w-5 animate-spin" />}
                  {purchasing ? "Processing..." : "Purchase"}
                </button>
                <button onClick={() => setShowModal(false)} className="py-2 px-4 mt-2 w-full rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm cursor-pointer border border-white/5">Maybe later</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
