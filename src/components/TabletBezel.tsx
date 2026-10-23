/**
 * Rugged Industrial Tablet Bezel & Tactile Controls
 * Emulates the Olympus OmniScan X3 handheld casing with rubberized bumpers,
 * physical rotary knob, tactile F-keys, and gain scroll wheel.
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Sliders,
  Play,
  Pause,
  Circle,
  HelpCircle,
  Maximize2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface TabletBezelProps {
  children: React.ReactNode;
  enabled: boolean;
  gain: number;
  onGainChange: (newGain: number) => void;
  frozen: boolean;
  onToggleFreeze: () => void;
  onOpenCalibration: () => void;
  onOpenProbeLink: () => void;
  onToggleBezel: () => void;
  isArabic: boolean;
}

export const TabletBezel: React.FC<TabletBezelProps> = ({
  children,
  enabled,
  gain,
  onGainChange,
  frozen,
  onToggleFreeze,
  onOpenCalibration,
  onOpenProbeLink,
  onToggleBezel,
  isArabic,
}) => {
  const [knobRotation, setKnobRotation] = useState(0);

  if (!enabled) {
    return <div className="w-full h-full flex flex-col">{children}</div>;
  }

  // Handle rotary knob dragging
  const handleKnobTurn = (delta: number) => {
    setKnobRotation((prev) => prev + delta * 15);
    const step = delta > 0 ? 0.5 : -0.5;
    onGainChange(Math.max(0, Math.min(80, Number((gain + step).toFixed(1)))));
  };

  return (
    <div className="w-full h-full p-2 sm:p-4 bg-stone-900 flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Heavy-Duty Rugged Rubberized Casing */}
      <div className="relative w-full h-full max-w-[1580px] max-h-[960px] bg-stone-950 rounded-3xl p-3 sm:p-5 shadow-2xl border-4 border-stone-800 flex flex-col">
        {/* Top Rubber Grip & Brand Bar */}
        <div className="flex items-center justify-between pb-2 px-3 text-xs font-mono text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-stone-800 border border-stone-700" />
            <span className="font-bold tracking-widest text-stone-300">
              OLYMPUS / EVIDENT OMNISCAN™ X3
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="hidden sm:inline text-stone-500">IP65 INDUSTRIAL FIELD UNIT</span>
            <button
              onClick={onToggleBezel}
              className="text-stone-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              title="Full Tablet Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isArabic ? 'ملء الشاشة' : 'Frameless'}</span>
            </button>
          </div>
        </div>

        {/* Central Display + Side Tactical Controls Split */}
        <div className="flex-1 flex gap-3 overflow-hidden">
          {/* Main Display Screen Container */}
          <div className="flex-1 rounded-xl overflow-hidden border-2 border-stone-800 bg-slate-950 shadow-inner flex flex-col">
            {children}
          </div>

          {/* Right Tactile Field Physical Keypad & Rotary Wheel */}
          <div className="hidden lg:flex w-24 bg-stone-900 rounded-xl border border-stone-800 p-2 flex-col items-center justify-between shadow-md">
            {/* Rotary Gain / Scroll Wheel */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-stone-400 font-bold">GAIN / JOG</span>
              <div className="relative flex flex-col items-center">
                <button
                  onClick={() => handleKnobTurn(1)}
                  className="w-7 h-5 flex items-center justify-center text-stone-400 hover:text-cyan-400"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                {/* Rotary Knob Disc */}
                <div
                  className="w-14 h-14 rounded-full bg-stone-800 border-2 border-stone-700 shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  style={{ transform: `rotate(${knobRotation}deg)` }}
                  onClick={() => handleKnobTurn(1)}
                  title="Click or turn to adjust gain"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5" />
                  <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700" />
                </div>

                <button
                  onClick={() => handleKnobTurn(-1)}
                  className="w-7 h-5 flex items-center justify-center text-stone-400 hover:text-cyan-400"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400">{gain} dB</span>
            </div>

            {/* Tactile Function Keys F1 - F4 */}
            <div className="w-full flex flex-col gap-1.5 font-mono text-xs">
              <button
                onClick={onToggleFreeze}
                className={`w-full py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 shadow transition-all ${
                  frozen
                    ? 'bg-rose-700 text-white'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                }`}
              >
                {frozen ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>FREEZE</span>
              </button>

              <button
                onClick={onOpenCalibration}
                className="w-full py-2 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[10px] shadow"
              >
                CAL
              </button>

              <button
                onClick={onOpenProbeLink}
                className="w-full py-2 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[10px] shadow"
              >
                PROBE
              </button>
            </div>

            {/* Power / Status LED */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-[8px] font-mono text-stone-500">SYS OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
