import React from "react";
import { Play, Pause, Square, Volume2, VolumeX, Repeat, Sliders } from "lucide-react";
import { BannerAd } from "./BannerAd";

interface PlaybackControlsProps {
  name: string;
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onLoopToggle: () => void;
  onVolumeChange: (vol: number) => void;
  onSeek: (seconds: number) => void;
  onRename: () => void;
  lyrics?: string;
  music?: string;
  arranger?: string;
  info?: string;
  tags?: string[];
  showMixer?: boolean;
  onToggleMixer?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  name,
  isPlaying,
  isLooping,
  currentTime,
  duration,
  masterVolume,
  onPlay,
  onPause,
  onStop,
  onLoopToggle,
  onVolumeChange,
  onSeek,
  onRename,
  lyrics,
  music,
  arranger,
  info,
  tags,
  showMixer,
  onToggleMixer,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 lg:p-5 shadow-2xl text-left relative overflow-hidden select-none flex flex-col landscape:flex-row landscape:gap-3 h-full">
      {/* Left side — all controls */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Title + metadata — top area */}
        <div className="shrink-0">
          <div className="flex items-start gap-3 landscape:relative">
            <h1
              className="font-display font-bold text-slate-100 text-lg landscape:text-base flex-1 min-w-0 landscape:pr-[56px] cursor-pointer hover:text-blue-400 transition-colors"
              onClick={onRename}
              title="Rename Hymn"
            >
              {name}
            </h1>
            {onToggleMixer && (
              <button
                id="btn-toggle-mixer"
                onClick={onToggleMixer}
                className="shrink-0 landscape:absolute landscape:top-0 landscape:right-0 p-2.5 landscape:p-[11px] rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 cursor-pointer transition-all"
                title="Open Mixer"
              >
                <Sliders className="h-5 w-5 landscape:h-[22px] landscape:w-[22px]" />
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:landscape:flex-col flex-wrap sm:gap-x-4 gap-y-1 mt-1.5 landscape:mt-0">
          {lyrics?.trim() && <span className="text-xs landscape:text-[10px] text-slate-400"><span className="font-bold text-slate-300">Lyrics:</span> {lyrics}</span>}
          {music?.trim() && <span className="text-xs landscape:text-[10px] text-slate-400"><span className="font-bold text-slate-300">Music:</span> {music}</span>}
          {arranger?.trim() && <span className="text-xs landscape:text-[10px] text-slate-400"><span className="font-bold text-slate-300">Arr:</span> {arranger}</span>}
          </div>
          {/* Info — inside metadata area, landscape only (before tags) */}
          {info?.trim() && (
            <div className="hidden landscape:block shrink-0 mt-0">
              <p className="text-xs landscape:text-[10px] text-slate-400 leading-relaxed">
                {info.split(/([^:]+:)/g).filter(Boolean).map((part, i) =>
                  part.endsWith(":") ? <strong key={i} className="text-slate-300">{part}</strong> : part
                )}
              </p>
            </div>
          )}
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 shrink-0 mt-2 landscape:mt-0.5">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/15 rounded text-[10px] landscape:text-[9px] text-blue-300/80 font-mono">
                {tag}
              </span>
            ))}
          </div>
        )}
        {/* Landscape-only separator after tags */}
        <div className="hidden landscape:block border-t border-white/10 mt-1.5 mb-1.5" />
        {/* Info — portrait only (after tags) */}
        {info?.trim() && (
          <div className="landscape:hidden shrink-0 border-t border-white/10 pt-2 mt-2">
            <p className="text-xs landscape:text-[10px] text-slate-400 leading-relaxed">
              {info.split(/([^:]+:)/g).filter(Boolean).map((part, i) =>
                part.endsWith(":") ? <strong key={i} className="text-slate-300">{part}</strong> : part
              )}
            </p>
          </div>
        )}

        {/* Spacer — capped in portrait so controls sit higher from banner */}
        <div className="flex-1 portrait:max-h-[50%]" />

      {/* Transport + Time + Volume + Scrub inline */}
      <div className="flex items-center gap-1.5 landscape:gap-2 shrink-0">
          <button
            id="control-play-pause"
            onClick={isPlaying ? onPause : onPlay}
            className={`p-2.5 landscape:p-3 rounded-xl border cursor-pointer transition-all shrink-0 ${
              isPlaying
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {isPlaying ? <Pause className="h-4 w-4 landscape:h-5 landscape:w-5" /> : <Play className="h-4 w-4 landscape:h-5 landscape:w-5" />}
          </button>
          <button
            id="control-stop"
            onClick={onStop}
            className="p-2.5 landscape:p-3 rounded-xl border bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all shrink-0"
          >
            <Square className="h-4 w-4 landscape:h-5 landscape:w-5" />
          </button>
          <button
            id="control-loop"
            onClick={onLoopToggle}
            className={`p-2.5 landscape:p-3 rounded-xl border cursor-pointer transition-all shrink-0 ${
              isLooping
                ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Toggle Loop"
          >
            <Repeat className="h-4 w-4 landscape:h-5 landscape:w-5" />
          </button>

        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-mono text-sm font-semibold text-slate-100 tracking-tight">
            {formatTime(currentTime)}
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            /{formatTime(duration)}
          </span>
        </div>

        {/* Scrub bar inline — landscape only */}
        <div className="hidden landscape:flex flex-1 min-w-0">
          <input
            id="playback-timeline-scrub"
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none accent-blue-500
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-blue-500"
          />
        </div>

        <button
          id="btn-master-mute"
          onClick={() => onVolumeChange(masterVolume > 0 ? 0 : 0.8)}
          className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors shrink-0"
        >
          {masterVolume > 0 ? <Volume2 className="h-3.5 w-3.5 landscape:h-4 landscape:w-4" /> : <VolumeX className="h-3.5 w-3.5 landscape:h-4 landscape:w-4 text-rose-500" />}
        </button>
        </div>

        {/* Scrub bar below — portrait only */}
        <div className="landscape:hidden shrink-0 mt-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none accent-blue-500
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-blue-500"
          />
        </div>
      </div>

      {/* Right side — landscape banner */}
      <div className="hidden landscape:flex shrink-0 h-full">
        <BannerAd vertical />
      </div>

      {/* Bottom — portrait banner */}
      <div className="landscape:hidden">
        <BannerAd />
      </div>
    </div>
  );
};
