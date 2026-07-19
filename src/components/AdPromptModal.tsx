import { useState } from "react"
import { showRewardedAd } from "../lib/ads"
import { X, Play, Loader2 } from "lucide-react"

interface AdPromptModalProps {
  hymName: string
  onAdSuccess: () => void
  onDismiss: () => void
}

const STEPS = {
  IDLE: "idle" as const,
  LOADING: "loading" as const,
  WATCHING: "watching" as const,
  SUCCESS: "success" as const,
  FAILED: "failed" as const,
}

export function AdPromptModal({ hymName, onAdSuccess, onDismiss }: AdPromptModalProps) {
  const [step, setStep] = useState(STEPS.IDLE)
  const [progress, setProgress] = useState("")

  const handleWatchAd = async () => {
    setStep(STEPS.LOADING)
    setProgress("Initiating ad...")

    // Simulate some loading time
    await new Promise((r) => setTimeout(r, 500))

    setStep(STEPS.WATCHING)
    setProgress("Ad playing...")

    const rewarded = await showRewardedAd()

    if (rewarded) {
      setStep(STEPS.SUCCESS)
      setProgress("Ad completed! Download starting...")
      setTimeout(onAdSuccess, 500)
    } else {
      setStep(STEPS.FAILED)
      setProgress("Ad failed or the reward wasn't granted. Please try again.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1d24] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        {step === STEPS.IDLE && (
          <>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Unlock Download
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Watch a short rewarded ad to download <strong>{hymName}</strong>.
              Your support helps us keep the service running.
            </p>
            <button
              onClick={handleWatchAd}
              className="py-3 px-6 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base border border-blue-400/30 shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              Watch Ad
            </button>
            <button
              onClick={onDismiss}
              className="py-2 px-4 mt-2 w-full rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm cursor-pointer border border-white/5"
            >
              Maybe later
            </button>
          </>
        )}

        {step === STEPS.LOADING && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">{progress}</p>
          </div>
        )}

        {step === STEPS.WATCHING && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium mb-2">Ad is playing...</p>
            <p className="text-slate-500 text-sm">Please wait while the ad finishes</p>
          </div>
        )}

        {step === STEPS.SUCCESS && (
          <div className="py-8 text-center">
            <div className="mx-auto text-center mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <p className="text-green-400 font-bold mb-4">Ad completed!</p>
            <p className="text-slate-400 text-sm">{progress}</p>
          </div>
        )}

        {step === STEPS.FAILED && (
          <div className="py-6">
            <div className="mx-auto text-center mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <p className="text-rose-400 font-bold mb-2">Ad failed</p>
            <p className="text-slate-400 text-sm mb-4">{progress}</p>
            <button
              onClick={handleWatchAd}
              className="py-3 px-6 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base border cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={onDismiss}
              className="py-2 px-4 mt-2 w-full rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
