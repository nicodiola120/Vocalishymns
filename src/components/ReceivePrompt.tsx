import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Tv, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { WiFiShare, TransferRequest } from '../lib/wiFiShare';
import { showRewardedAd, unlockHymn } from '../lib/ads';

interface ReceivePromptProps {
  request: TransferRequest | null;
  onAccepted: (hymnName: string) => void;
  onDismiss: () => void;
}

type AcceptStage = 'prompt' | 'watching_ad' | 'saving' | 'done' | 'error';

export default function ReceivePrompt({ request, onAccepted, onDismiss }: ReceivePromptProps) {
  const [stage, setStage] = useState<AcceptStage>('prompt');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleWatchAd() {
    if (!request) return;
    setStage('watching_ad');
    setErrorMsg('');

    const rewarded = await showRewardedAd();
    if (!rewarded) {
      setErrorMsg('Ad failed or was skipped. Try again.');
      setStage('error');
      return;
    }

    setStage('saving');
    try {
      await WiFiShare.acceptFile(
        request.requestId,
        request.filePath,
        request.hymnName
      );
      unlockHymn(request.hymnName);
      setStage('done');
      onAccepted(request.hymnName);
      setTimeout(() => {
        setStage('prompt');
        onDismiss();
      }, 2000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save hymn');
      setStage('error');
    }
  }

  async function handleDecline() {
    if (!request) return;
    await WiFiShare.declineFile(request.filePath);
    onDismiss();
    setStage('prompt');
  }

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-[90%] max-w-sm p-6 shadow-2xl"
          >
            {stage === 'prompt' && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Incoming Hymn
                  </h2>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{request.from}</span> wants to share:
                  </p>
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {request.hymnName}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDecline}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleWatchAd}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Tv className="w-4 h-4" />
                    Watch Ad to Receive
                  </button>
                </div>
              </>
            )}

            {stage === 'watching_ad' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-zinc-500">Watching ad...</p>
              </div>
            )}

            {stage === 'saving' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-zinc-500">Saving "{request.hymnName}"...</p>
              </div>
            )}

            {stage === 'done' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  "{request.hymnName}" added to your library!
                </p>
              </div>
            )}

            {stage === 'error' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {errorMsg}
                </p>
                <button
                  onClick={() => setStage('prompt')}
                  className="mt-2 px-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Try again
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
