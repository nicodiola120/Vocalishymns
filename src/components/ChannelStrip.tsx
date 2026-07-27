import React, { useEffect, useRef, useState } from "react";
import { Voice } from "../types";
import { player } from "../lib/audioEngine";
import { Volume2, VolumeX, Mic, Upload, X, Pencil, Trash2, GripVertical } from "lucide-react";

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = deg * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) {
  if (Math.abs(sweepDeg) < 0.5) return "";
  const endDeg = startDeg + sweepDeg;
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = Math.abs(sweepDeg) > 180 ? 1 : 0;
  const sweep = sweepDeg > 0 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} ${sweep} ${e.x} ${e.y}`;
}

interface ChannelStripProps {
  voice: Voice;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onPanChange: (pan: number) => void;
  isPlaying: boolean;
  expanded?: boolean;
  onLoadAudio?: () => void;
  onUnloadAudio?: () => void;
  onRemoveTrack?: () => void;
  onRename?: (name: string) => void;
  isDesktop?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  isDragTarget?: boolean;
}

const ChannelStripComponent: React.FC<ChannelStripProps> = ({
  voice,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onPanChange,
  isPlaying,
  expanded,
  onLoadAudio,
  onUnloadAudio,
  onRemoveTrack,
  onRename,
  isDesktop,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [level, setLevel] = useState(0);
  const [dragVolume, setDragVolume] = useState(voice.volume);
  const animFrameRef = useRef<number | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(voice.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Animate the LED level meter when playing
  useEffect(() => {
    const updateMeter = () => {
      if (isPlaying) {
        const rawLevel = player.getChannelAudioLevel(voice.id);
        setLevel((prev) => {
          if (rawLevel > prev) return rawLevel;
          return prev * 0.85 + rawLevel * 0.15;
        });
      } else {
        setLevel((prev) => (prev > 0.01 ? prev * 0.7 : 0));
      }
      animFrameRef.current = requestAnimationFrame(updateMeter);
    };

    updateMeter();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, voice.id]);

  const updateVolumeFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const relativeY = rect.bottom - e.clientY;
    let percentage = relativeY / rect.height;
    percentage = Math.max(0, Math.min(1, percentage));
    setDragVolume(percentage);
  };

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    updateVolumeFromPointer(e);
    if (sliderRef.current) {
      sliderRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateVolumeFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    updateVolumeFromPointer(e);
    onVolumeChange(dragVolume);
    setIsDragging(false);
    isDraggingRef.current = false;
    if (sliderRef.current) {
      sliderRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      handlePointerUp(e);
    }
  };

  // Color Mapping based on standard parts or custom colors
  const getColorClasses = (col: string) => {
    switch (col) {
      case "indigo":
        return {
          text: "text-indigo-400",
          bg: "bg-indigo-500",
          accent: "indigo",
          border: "border-indigo-500/20",
          shadow: "shadow-indigo-500/10",
        };
      case "pink":
        return {
          text: "text-pink-400",
          bg: "bg-pink-500",
          accent: "pink",
          border: "border-pink-500/20",
          shadow: "shadow-pink-500/10",
        };
      case "sky":
        return {
          text: "text-sky-400",
          bg: "bg-sky-500",
          accent: "sky",
          border: "border-sky-500/20",
          shadow: "shadow-sky-500/10",
        };
      case "emerald":
        return {
          text: "text-emerald-400",
          bg: "bg-emerald-500",
          accent: "emerald",
          border: "border-emerald-500/20",
          shadow: "shadow-emerald-500/10",
        };
      default:
        return {
          text: "text-amber-400",
          bg: "bg-amber-500",
          accent: "amber",
          border: "border-amber-500/20",
          shadow: "shadow-amber-500/10",
        };
    }
  };

  const themeColors = getColorClasses(voice.color);

  // Generate 32 LED segments: Red (top), Yellow (mid), Green (low)
  const numSegments = 32;
  const segments = Array.from({ length: numSegments }).map((_, idx) => {
    const segIndex = numSegments - 1 - idx; // 31 is top, 0 is bottom
    const isLit = level * numSegments > segIndex;
    
    // Determine LED Color based on position
    let activeColor = "bg-emerald-500 shadow-[0_0_4px_#10b981]";
    let inactiveColor = "bg-emerald-950/40";

    if (segIndex >= 24) {
      // Top 8 Red
      activeColor = "bg-rose-500 shadow-[0_0_4px_#f43f5e]";
      inactiveColor = "bg-rose-950/30";
    } else if (segIndex >= 16) {
      // Middle 8 Yellow
      activeColor = "bg-amber-400 shadow-[0_0_4px_#fbbf24]";
      inactiveColor = "bg-amber-950/30";
    }

    return (
      <div
        key={segIndex}
        className={`flex-1 w-full rounded-none transition-colors duration-75 ${
          isLit ? activeColor : inactiveColor
        }`}
      />
    );
  });

  // --- Rotary Pan Knob state ---
  const knobRef = useRef<HTMLDivElement>(null);
  const knobDraggingRef = useRef(false);
  const panValue = voice.pan ?? 0;

  const panStartYRef = useRef(0);
  const panStartValueRef = useRef(0);

  const updatePanFromPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!knobDraggingRef.current) return;
    const totalTravel = 120;
    const deltaY = e.clientY - panStartYRef.current;
    let newPan = panStartValueRef.current - deltaY / totalTravel;
    newPan = Math.max(-1, Math.min(1, newPan));
    onPanChange(Math.round(newPan * 100) / 100);
  };

  const updatePanFromPointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!knobRef.current || !knobDraggingRef.current) return;
    updatePanFromPointer(e);
  };

  const handleKnobPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    knobDraggingRef.current = true;
    panStartYRef.current = e.clientY;
    panStartValueRef.current = panValue;
    knobRef.current?.setPointerCapture(e.pointerId);
  };

  const handleKnobPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!knobDraggingRef.current) return;
    updatePanFromPointerMove(e);
  };

  const handleKnobPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const deltaY = Math.abs(e.clientY - panStartYRef.current);
    knobDraggingRef.current = false;
    knobRef.current?.releasePointerCapture(e.pointerId);
    if (deltaY < 4) {
      onPanChange(0);
    }
  };

  const panAngle = panValue * 135;
  const indicatorX = Math.sin((panAngle * Math.PI) / 180) * 14;
  const indicatorY = -Math.cos((panAngle * Math.PI) / 180) * 14;

  const accentHex =
    voice.color === "indigo" ? "#3b82f6" :
    voice.color === "pink" ? "#ec4899" :
    voice.color === "sky" ? "#0ea5e9" :
    voice.color === "emerald" ? "#10b981" : "#f59e0b";

  return (
    <div
      id={`strip-${voice.id}`}
      className={`flex flex-col glass-panel rounded-2xl ${expanded ? 'h-full overflow-hidden' : ''} ${
        voice.isSolo 
          ? "border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
          : "shadow-lg shadow-black/15"
      } p-2 lg:p-3 w-full select-none transition-all duration-300 ${expanded ? '' : 'hover:scale-[1.01] hover:border-white/15'}`}
    >
      {/* Header Info */}
      <div
        className={`flex items-center justify-between mb-2 border-b border-white/5 pb-2 ${isDragTarget ? 'border-blue-500/40 bg-blue-500/5' : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div
          className={`flex items-center gap-1.5 flex-1 min-w-0`}
          draggable
          onDragStart={onDragStart}
        >
          <GripVertical className="h-3 w-3 text-slate-600 shrink-0 cursor-grab active:cursor-grabbing" />
          <Mic className={`h-3.5 w-3.5 ${themeColors.text} shrink-0`} />
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                if (renameValue.trim()) onRename?.(renameValue.trim());
                setIsRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (renameValue.trim()) onRename?.(renameValue.trim());
                  setIsRenaming(false);
                }
                if (e.key === "Escape") {
                  setRenameValue(voice.name);
                  setIsRenaming(false);
                }
              }}
              className="flex-1 min-w-0 px-1 py-0.5 bg-white/10 border border-white/10 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`font-display font-semibold text-xs tracking-wide truncate ${isDesktop ? 'cursor-pointer hover:text-blue-300 transition-colors' : ''}`}
              title={voice.name}
              onDoubleClick={() => {
                if (isDesktop) {
                  setRenameValue(voice.name);
                  setIsRenaming(true);
                  setTimeout(() => renameInputRef.current?.focus(), 0);
                }
              }}
            >
              {voice.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isDesktop && voice.audioData && onUnloadAudio && (
            <button
              onClick={onUnloadAudio}
              className="p-1 rounded-md bg-white/5 border border-white/5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Unload audio"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {isDesktop && !voice.audioData && onLoadAudio && (
            <button
              onClick={onLoadAudio}
              className="p-1 rounded-md bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25 transition-colors cursor-pointer"
              title="Load audio file"
            >
              <Upload className="h-3 w-3" />
            </button>
          )}
          {isDesktop && onRemoveTrack && (
            <button
              onClick={onRemoveTrack}
              className="p-1 rounded-md bg-white/5 border border-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Remove track"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sliders and Visualizer Row */}
      <div className={`flex ${expanded ? 'flex-col portrait:flex-col landscape:flex-row' : 'flex-row'} items-stretch justify-center gap-3 ${expanded ? 'flex-1 min-h-0' : 'h-40 lg:h-48'} my-1`}>
        
        {/* Combined Fader + LED Visualizer */}
        <div className="flex flex-col items-center flex-1 h-full relative">
          <div className="text-[10px] font-mono text-slate-500 mb-1">0</div>
          
          <div
            ref={sliderRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="relative w-8 h-full bg-white/5 rounded-full flex items-center justify-center cursor-pointer border border-white/10 select-none group overflow-hidden touch-none"
          >
            {/* LED segments overlay — fills the entire track */}
            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col px-0.5 py-0.5 gap-px pointer-events-none">
              {segments}
            </div>

            {/* Slider Knob — sits on top of LEDs */}
            <div
              className="absolute w-6 h-6 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.35)] will-change-[bottom] cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
              style={{ 
                bottom: `calc(${isDragging ? dragVolume : voice.volume} * 100% - 12px)`,
                border: `4px solid ${accentHex}`
              }}
            >
              <div className="w-1 h-1 bg-slate-900 rounded-full" />
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-slate-500 mt-1">-60</div>
        </div>

        {/* Controls column — Pan knob, Solo, Mute */}
        <div className={`${expanded ? 'flex flex-col items-center justify-center gap-2 shrink-0' : 'w-7 min-w-[28px] flex flex-col h-full gap-1.5 shrink-0 justify-end'}`}>
          {expanded ? (
            <>
              {/* Rotary Pan Knob */}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  ref={knobRef}
                  onPointerDown={handleKnobPointerDown}
                  onPointerMove={handleKnobPointerMove}
                  onPointerUp={handleKnobPointerUp}
                  className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing touch-none select-none"
                  title={`Pan: ${panValue < 0 ? "L" : panValue > 0 ? "R" : "C"}${Math.abs(Math.round(panValue * 100))}%`}
                >
                  <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full">
                    {/* Arc track */}
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5"
                      strokeDasharray="67.5 34.5" strokeDashoffset="0"
                      transform="rotate(135 20 20)" strokeLinecap="round" />
                    {/* Active arc — path from center (270°) toward L or R */}
                    {(() => {
                      const d = arcPath(20, 20, 16, 270, panValue * 135);
                      return d ? (
                        <path d={d} fill="none" stroke={accentHex} strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
                      ) : null;
                    })()}
                    {/* Center tick */}
                    <line x1="20" y1="20" x2="20" y2="7" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  </svg>
                  {/* Indicator dot */}
                  <div
                    className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)] pointer-events-none"
                    style={{
                      left: `calc(50% + ${indicatorX}px - 4px)`,
                      top: `calc(50% + ${indicatorY}px - 4px)`,
                    }}
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-500 tracking-wider">PAN</span>
              </div>

              <button
                id={`solo-${voice.id}`}
                onClick={onSoloToggle}
                className={`px-3 py-1.5 rounded border font-bold text-xs transition-all duration-150 cursor-pointer ${
                  voice.isSolo
                    ? "bg-amber-500 border-amber-400 text-slate-950"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                S
              </button>
              <button
                id={`mute-${voice.id}`}
                onClick={onMuteToggle}
                className={`px-3 py-1.5 rounded border font-bold text-xs transition-all duration-150 cursor-pointer ${
                  voice.isMuted
                    ? "bg-rose-500 border-rose-400 text-slate-950"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                M
              </button>
            </>
          ) : (
          <>
            <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 border border-white/5 px-2 py-1 rounded-lg font-mono">
              <span className="text-[9px] text-slate-500">VOL:</span>
              <span className="text-slate-100 font-medium text-[11px]">
                {Math.round(voice.volume * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                id={`solo-${voice.id}`}
                onClick={onSoloToggle}
                className={`py-1 px-2 rounded-lg border font-bold text-[11px] transition-all duration-150 cursor-pointer ${
                  voice.isSolo
                    ? "bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/10"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
                }`}
                title="Solo this channel (mutes all non-solo channels)"
              >
                S
              </button>

              <button
                id={`mute-${voice.id}`}
                onClick={onMuteToggle}
                className={`py-1 px-2 rounded-lg border font-bold text-[11px] transition-all duration-150 cursor-pointer ${
                  voice.isMuted
                    ? "bg-rose-500 border-rose-400 text-slate-950 shadow-md shadow-rose-500/10"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
                }`}
                title="Mute this channel"
              >
                M
              </button>
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export const ChannelStrip = React.memo(ChannelStripComponent);
