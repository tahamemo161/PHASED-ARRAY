/**
 * OmniScan Instrument Top Header & Telemetry Bar
 * Authentic Olympus/Evident status bar with gain knob, battery, PRF, velocity,
 * freeze toggle, record toggle, and primary workstation shortcuts.
 */

import React from 'react';
import {
  UltrasonicParams,
  LayoutViewMode,
  PaletteName,
  ProbeConfig,
} from '../types/paut';
import {
  Radio,
  Sliders,
  BatteryCharging,
  Maximize2,
  Minimize2,
  FileText,
  Languages,
  Eye,
  Tablet,
  Cpu,
  Layers,
  Circle,
  Play,
  Pause,
} from 'lucide-react';

interface OmniScanHeaderProps {
  params: UltrasonicParams;
  onUpdateParams: (params: UltrasonicParams) => void;
  probe: ProbeConfig;
  activeAngle: number;
  layoutMode: LayoutViewMode;
  onLayoutChange: (mode: LayoutViewMode) => void;
  palette: PaletteName;
  onPaletteChange: (pal: PaletteName) => void;
  showWeldOverlay: boolean;
  onToggleWeldOverlay: () => void;
  frozen: boolean;
  onToggleFreeze: () => void;
  recording: boolean;
  onToggleRecord: () => void;
  onOpenProbeLink: () => void;
  onOpenCalibration: () => void;
  onOpenReport: () => void;
  onOpenWeldGeometry: () => void;
  tabletBezel: boolean;
  onToggleTabletBezel: () => void;
  isArabic: boolean;
  onToggleLanguage: () => void;
}

export const OmniScanHeader: React.FC<OmniScanHeaderProps> = ({
  params,
  onUpdateParams,
  probe,
  activeAngle,
  layoutMode,
  onLayoutChange,
  palette,
  onPaletteChange,
  showWeldOverlay,
  onToggleWeldOverlay,
  frozen,
  onToggleFreeze,
  recording,
  onToggleRecord,
  onOpenProbeLink,
  onOpenCalibration,
  onOpenReport,
  onOpenWeldGeometry,
  tabletBezel,
  onToggleTabletBezel,
  isArabic,
  onToggleLanguage,
}) => {
  const adjustGain = (delta: number) => {
    const newGain = Math.max(0, Math.min(80, params.gain + delta));
    onUpdateParams({ ...params, gain: Number(newGain.toFixed(1)) });
  };

  return (
    <header className="flex flex-col bg-slate-950 border-b border-slate-800 text-slate-200 select-none">
      {/* Top Telemetry Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 text-xs font-mono border-b border-slate-800/80">
        {/* Left: Machine Brand & Group */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-100">
            <span className="text-cyan-400">OMNISCAN</span>
            <span className="text-xs px-1.5 py-0.2 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded">
              X3 PAUT
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-semibold">G1: PA {activeAngle}°</span>
            <span className="text-slate-500">·</span>
            <span>{probe.id}</span>
          </div>
        </div>

        {/* Center: Live Instrument Values */}
        <div className="flex items-center gap-4 text-[11px]">
          {/* Quick Gain Adjuster */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <span className="text-slate-400 text-[10px]">GAIN:</span>
            <button
              onClick={() => adjustGain(-1)}
              className="px-1 text-slate-400 hover:text-cyan-400 active:scale-95 font-bold"
              title="-1 dB"
            >
              -
            </button>
            <span className="text-cyan-400 font-bold tabular-nums w-12 text-center">
              {params.gain.toFixed(1)} dB
            </span>
            <button
              onClick={() => adjustGain(+1)}
              className="px-1 text-slate-400 hover:text-cyan-400 active:scale-95 font-bold"
              title="+1 dB"
            >
              +
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-slate-400">
            <span>
              VEL: <b className="text-slate-200">{params.velocity}</b> m/s
            </span>
            <span>
              RNG: <b className="text-slate-200">{params.range}</b> mm
            </span>
            <span>
              PRF: <b className="text-slate-200">{params.prf}</b> Hz
            </span>
          </div>
        </div>

        {/* Right: State Indicators & Utility Buttons */}
        <div className="flex items-center gap-2">
          {/* Freeze Button */}
          <button
            onClick={onToggleFreeze}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
              frozen
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-950/80 border border-emerald-700 text-emerald-400 hover:bg-emerald-900'
            }`}
          >
            {frozen ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{frozen ? (isArabic ? 'مجمد' : 'FROZEN') : isArabic ? 'مباشر' : 'LIVE'}</span>
          </button>

          {/* Record Button */}
          <button
            onClick={onToggleRecord}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
              recording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Circle className={`w-2.5 h-2.5 ${recording ? 'fill-white' : 'fill-rose-500'}`} />
            <span>{recording ? (isArabic ? 'جاري التسجيل' : 'REC...') : isArabic ? 'تسجيل' : 'REC'}</span>
          </button>

          {/* Battery */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400">
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>94%</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
            title="Switch Language"
          >
            <Languages className="w-3 h-3 text-cyan-400" />
            <span>{isArabic ? 'English' : 'العربية'}</span>
          </button>

          {/* Tablet Casing Frame Toggle */}
          <button
            onClick={onToggleTabletBezel}
            className={`p-1.5 rounded transition-colors ${
              tabletBezel
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
            title={tabletBezel ? 'Switch to Frameless Tablet' : 'Show Rugged Machine Casing'}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Function Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950 text-xs">
        {/* Left Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Probe Link Trigger */}
          <button
            onClick={onOpenProbeLink}
            className="px-3 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isArabic ? 'ربط بروبات العمل' : 'Work Probe Link'}</span>
          </button>

          {/* Calibration Trigger */}
          <button
            onClick={onOpenCalibration}
            className="px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isArabic ? 'معالج المعايرة' : 'Calibration'}</span>
          </button>

          {/* Weld Overlay Toggle */}
          <button
            onClick={onToggleWeldOverlay}
            className={`px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showWeldOverlay
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{isArabic ? 'إظهار اللحام' : 'Overlay'}</span>
          </button>

          {/* Custom Weld Geometry Designer Trigger */}
          <button
            onClick={onOpenWeldGeometry}
            className="px-3 py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{isArabic ? 'هندسة اللحام (V, U, Double-V)' : 'Weld Geometry'}</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenReport}
            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>{isArabic ? 'تقرير الفحص ASME' : 'NDT Report'}</span>
          </button>
        </div>

        {/* Right View & Palette Segmented Controls */}
        <div className="flex items-center gap-3">
          {/* Layout Selector */}
          <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
            {[
              { id: 'S_A', label: 'S+A' },
              { id: 'S_C_A', label: 'S+C+A' },
              { id: 'S_ONLY', label: 'S-Scan' },
              { id: 'A_ONLY', label: 'A-Scan' },
              { id: 'WELD_RAY', label: isArabic ? 'اللحام' : 'Ray Trace' },
            ].map((layout) => (
              <button
                key={layout.id}
                onClick={() => onLayoutChange(layout.id as LayoutViewMode)}
                className={`px-2 py-1 rounded transition-colors ${
                  layoutMode === layout.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {layout.label}
              </button>
            ))}
          </div>

          {/* Palette Selector */}
          <div className="hidden sm:flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
            {[
              { id: 'HOT_IRON', label: 'Hot Iron' },
              { id: 'RAINBOW', label: 'Rainbow' },
              { id: 'ASME', label: 'ASME' },
              { id: 'GRAYSCALE', label: 'TOFD Gray' },
            ].map((pal) => (
              <button
                key={pal.id}
                onClick={() => onPaletteChange(pal.id as PaletteName)}
                className={`px-2 py-1 rounded transition-colors ${
                  palette === pal.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pal.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
