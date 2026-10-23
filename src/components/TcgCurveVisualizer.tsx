/**
 * Time Varied Gain (TVG / TCG) Interactive Curve Editor
 * Modeled after Olympus / Evident OmniScan X3 / MX2 and Zetec TOPAZ architectures.
 * Provides direct interactive drag-to-edit calibration points on a Gain (dB) vs Depth (mm)
 * Cartesian coordinate plane to compensate for sound attenuation in heavy-wall and thick weld materials.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  RotateCcw,
  TrendingUp,
  Layers,
  Move,
  Sliders,
  Check,
  Flame,
  Info,
  Maximize2,
} from 'lucide-react';

export interface TcgPoint {
  depth: number; // mm
  gainOffset: number; // dB
}

interface TcgCurveVisualizerProps {
  points: TcgPoint[];
  onPointsChange?: (newPoints: TcgPoint[]) => void;
  maxDepth?: number;
  maxGain?: number;
  specimenThickness?: number;
  isArabic: boolean;
}

export const TcgCurveVisualizer: React.FC<TcgCurveVisualizerProps> = ({
  points,
  onPointsChange,
  maxDepth: defaultMaxDepth = 50,
  maxGain: defaultMaxGain = 20,
  specimenThickness = 25,
  isArabic,
}) => {
  // Chart viewing range controls
  const [chartMaxDepth, setChartMaxDepth] = useState<number>(
    Math.max(50, Math.ceil((specimenThickness * 1.5) / 25) * 25)
  );
  const [chartMaxGain, setChartMaxGain] = useState<number>(defaultMaxGain);

  // Interaction State
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [scrubCoord, setScrubCoord] = useState<{ depth: number; gain: number } | null>(null);
  const [showPresetsMenu, setShowPresetsMenu] = useState<boolean>(false);
  const [newPointDepth, setNewPointDepth] = useState<number>(Math.round(specimenThickness * 0.5));
  const [newPointGain, setNewPointGain] = useState<number>(6.0);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG Chart Geometry
  const svgWidth = 660;
  const svgHeight = 270;

  const padLeft = 56;
  const padRight = 36;
  const padTop = 26;
  const padBottom = 42;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Coordinate transforms
  const xToSvg = useCallback(
    (depth: number) => padLeft + (depth / chartMaxDepth) * chartW,
    [chartMaxDepth, chartW, padLeft]
  );

  const yToSvg = useCallback(
    (gain: number) => padTop + chartH * (1 - gain / chartMaxGain),
    [chartMaxGain, chartH, padTop]
  );

  const svgToDepth = useCallback(
    (svgX: number) => {
      const clamped = Math.max(padLeft, Math.min(padLeft + chartW, svgX));
      return Number((((clamped - padLeft) / chartW) * chartMaxDepth).toFixed(1));
    },
    [chartMaxDepth, chartW, padLeft]
  );

  const svgToGain = useCallback(
    (svgY: number) => {
      const clamped = Math.max(padTop, Math.min(padTop + chartH, svgY));
      return Number(((1 - (clamped - padTop) / chartH) * chartMaxGain).toFixed(1));
    },
    [chartMaxGain, chartH, padTop]
  );

  // Interpolate continuous gain from calibration points using smooth cubic Hermite spline
  const interpolateGain = useCallback(
    (d: number): number => {
      if (points.length === 0) return 0;
      if (d <= points[0].depth) return points[0].gainOffset;
      if (d >= points[points.length - 1].depth) return points[points.length - 1].gainOffset;

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (d >= p1.depth && d <= p2.depth) {
          const span = p2.depth - p1.depth;
          if (span <= 0.001) return p1.gainOffset;
          const t = (d - p1.depth) / span;
          const smoothT = t * t * (3 - 2 * t);
          return p1.gainOffset + smoothT * (p2.gainOffset - p1.gainOffset);
        }
      }
      return 0;
    },
    [points]
  );

  // Build SVG path for calibrated TVG curve
  const sampleSteps = 80;
  const curvePathPoints: { x: number; y: number }[] = [];
  for (let s = 0; s <= sampleSteps; s++) {
    const d = (s / sampleSteps) * chartMaxDepth;
    const g = interpolateGain(d);
    curvePathPoints.push({ x: xToSvg(d), y: yToSvg(g) });
  }

  const curvePathD = curvePathPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Fill area under curve
  const areaPathD = `${curvePathD} L ${xToSvg(chartMaxDepth)} ${yToSvg(0)} L ${xToSvg(0)} ${yToSvg(0)} Z`;

  // Theoretical acoustic decay curve (without TVG compensation)
  // Models spherical wave spreading (-20log(r/r0)) + material attenuation absorption
  const rawDecayPoints: { x: number; y: number }[] = [];
  for (let s = 0; s <= sampleSteps; s++) {
    const d = (s / sampleSteps) * chartMaxDepth;
    // Acoustic loss drops with depth in thick steel (~0.25 dB/mm + 6dB spreading)
    const rawDecayDb =
      d < 4
        ? 0
        : Math.min(
            chartMaxGain,
            3.5 * Math.log2(Math.max(1, d / 6)) + (d / chartMaxDepth) * (chartMaxGain * 0.45)
          );
    rawDecayPoints.push({ x: xToSvg(d), y: yToSvg(rawDecayDb) });
  }

  const rawDecayPathD = rawDecayPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Dynamic Grid Ticks
  const depthTickInterval = chartMaxDepth <= 60 ? 10 : chartMaxDepth <= 100 ? 20 : 25;
  const depthTicks: number[] = [];
  for (let d = 0; d <= chartMaxDepth; d += depthTickInterval) {
    depthTicks.push(d);
  }

  const gainTickInterval = chartMaxGain <= 20 ? 4 : 5;
  const gainTicks: number[] = [];
  for (let g = 0; g <= chartMaxGain; g += gainTickInterval) {
    gainTicks.push(g);
  }

  // Pointer Down on a specific point node to begin dragging
  const handlePointPointerDown = (e: React.PointerEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDragIndex(index);
    setSelectedPointIndex(index);
  };

  // Pointer Move on SVG canvas (handles active dragging & scrubbing)
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const svgY = ((e.clientY - rect.top) / rect.height) * svgHeight;

    const depth = svgToDepth(svgX);
    const gain = svgToGain(svgY);

    if (activeDragIndex !== null && onPointsChange) {
      // Clamping depth between neighbors to preserve order and avoid self-intersection loops
      const minDepth = activeDragIndex === 0 ? 0 : points[activeDragIndex - 1].depth + 1.0;
      const maxDepth =
        activeDragIndex === points.length - 1
          ? chartMaxDepth
          : points[activeDragIndex + 1].depth - 1.0;

      const clampedDepth = Math.max(minDepth, Math.min(maxDepth, depth));
      const clampedGain = Math.max(0, Math.min(chartMaxGain, gain));

      const updated = [...points];
      updated[activeDragIndex] = {
        depth: Number(clampedDepth.toFixed(1)),
        gainOffset: Number(clampedGain.toFixed(1)),
      };
      onPointsChange(updated);
    } else {
      setScrubCoord({ depth, gain: interpolateGain(depth) });
    }
  };

  // Pointer Up releases dragging
  const handleSvgPointerUp = (e: React.PointerEvent) => {
    if (activeDragIndex !== null) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      setActiveDragIndex(null);
    }
  };

  // Double click or click on empty canvas to insert a new point
  const handleCanvasClick = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeDragIndex !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const svgY = ((e.clientY - rect.top) / rect.height) * svgHeight;

    // Check if click occurred inside chart plot box
    if (svgX >= padLeft && svgX <= padLeft + chartW && svgY >= padTop && svgY <= padTop + chartH) {
      const clickDepth = svgToDepth(svgX);
      const clickGain = svgToGain(svgY);

      // Check if too close to an existing point (< 2mm)
      const existingNear = points.some((p) => Math.abs(p.depth - clickDepth) < 2.0);
      if (!existingNear && onPointsChange) {
        const newPts = [...points, { depth: clickDepth, gainOffset: clickGain }].sort(
          (a, b) => a.depth - b.depth
        );
        onPointsChange(newPts);
        const newIdx = newPts.findIndex((p) => p.depth === clickDepth);
        if (newIdx !== -1) setSelectedPointIndex(newIdx);
      }
    }
  };

  // Add Point via modal input
  const handleAddCustomPoint = () => {
    if (!onPointsChange) return;
    const existing = points.find((p) => Math.abs(p.depth - newPointDepth) < 1.0);
    if (existing) {
      // Update existing point gain
      const updated = points.map((p) =>
        Math.abs(p.depth - newPointDepth) < 1.0 ? { ...p, gainOffset: newPointGain } : p
      );
      onPointsChange(updated);
    } else {
      const newPts = [...points, { depth: newPointDepth, gainOffset: newPointGain }].sort(
        (a, b) => a.depth - b.depth
      );
      onPointsChange(newPts);
      const newIdx = newPts.findIndex((p) => p.depth === newPointDepth);
      if (newIdx !== -1) setSelectedPointIndex(newIdx);
    }
  };

  // Delete selected point
  const handleDeletePoint = (index: number) => {
    if (!onPointsChange || points.length <= 2) return;
    const newPts = points.filter((_, i) => i !== index);
    onPointsChange(newPts);
    setSelectedPointIndex(Math.max(0, index - 1));
  };

  // Fine-tune selected point
  const handleStepPoint = (depthDelta: number, gainDelta: number) => {
    if (!onPointsChange || !points[selectedPointIndex]) return;
    const pt = points[selectedPointIndex];
    const prevPt = selectedPointIndex > 0 ? points[selectedPointIndex - 1] : null;
    const nextPt = selectedPointIndex < points.length - 1 ? points[selectedPointIndex + 1] : null;

    const minDepth = prevPt ? prevPt.depth + 0.5 : 0;
    const maxDepth = nextPt ? nextPt.depth - 0.5 : chartMaxDepth;

    const updatedDepth = Math.max(minDepth, Math.min(maxDepth, Number((pt.depth + depthDelta).toFixed(1))));
    const updatedGain = Math.max(0, Math.min(chartMaxGain, Number((pt.gainOffset + gainDelta).toFixed(1))));

    const updated = [...points];
    updated[selectedPointIndex] = { depth: updatedDepth, gainOffset: updatedGain };
    onPointsChange(updated);
  };

  // Preset Configurations for Heavy Wall and Thick Weld Materials
  const applyPreset = (presetKey: string) => {
    if (!onPointsChange) return;
    const T = specimenThickness || 25;

    switch (presetKey) {
      case 'THICK_CARBON_STEEL':
        // Typical ASME Sec V Article 4 slope for 50-100mm heavy carbon steel weld
        setChartMaxDepth(Math.max(100, Math.ceil(T * 1.6)));
        setChartMaxGain(24);
        onPointsChange([
          { depth: 10, gainOffset: 0.0 },
          { depth: 25, gainOffset: 4.8 },
          { depth: 50, gainOffset: 11.2 },
          { depth: 75, gainOffset: 17.5 },
          { depth: 100, gainOffset: 23.5 },
        ]);
        break;

      case 'AUSTENITIC_HEAVY_WALL':
        // High attenuation and grain scattering compensation in stainless / austenitic welds
        setChartMaxDepth(Math.max(75, Math.ceil(T * 1.5)));
        setChartMaxGain(28);
        onPointsChange([
          { depth: 8, gainOffset: 0.0 },
          { depth: 20, gainOffset: 7.5 },
          { depth: 35, gainOffset: 16.0 },
          { depth: 50, gainOffset: 23.5 },
          { depth: 70, gainOffset: 27.5 },
        ]);
        break;

      case 'ASME_3_POINT_DAC':
        // 1/4T, 1/2T, 3/4T side drilled hole (SDH) references
        onPointsChange([
          { depth: Number((T * 0.25).toFixed(1)), gainOffset: 0.0 },
          { depth: Number((T * 0.5).toFixed(1)), gainOffset: 4.2 },
          { depth: Number((T * 0.75).toFixed(1)), gainOffset: 8.8 },
          { depth: Number((T * 1.0).toFixed(1)), gainOffset: 13.5 },
        ]);
        break;

      case 'ASME_5_POINT_DAC':
        // 5-point calibration across full wall thickness
        onPointsChange([
          { depth: Number((T * 0.15).toFixed(1)), gainOffset: 0.0 },
          { depth: Number((T * 0.35).toFixed(1)), gainOffset: 3.2 },
          { depth: Number((T * 0.55).toFixed(1)), gainOffset: 7.0 },
          { depth: Number((T * 0.75).toFixed(1)), gainOffset: 11.4 },
          { depth: Number((T * 0.95).toFixed(1)), gainOffset: 15.8 },
        ]);
        break;

      case 'LINEAR_RAMP':
        onPointsChange([
          { depth: 0, gainOffset: 0.0 },
          { depth: Math.round(chartMaxDepth * 0.5), gainOffset: 7.5 },
          { depth: chartMaxDepth, gainOffset: 15.0 },
        ]);
        break;

      case 'RESET_DEFAULT':
      default:
        setChartMaxDepth(50);
        setChartMaxGain(20);
        onPointsChange([
          { depth: 10, gainOffset: 0.0 },
          { depth: 20, gainOffset: 3.2 },
          { depth: 30, gainOffset: 6.8 },
          { depth: 40, gainOffset: 10.5 },
          { depth: 50, gainOffset: 14.2 },
        ]);
        break;
    }
    setShowPresetsMenu(false);
    setSelectedPointIndex(0);
  };

  const selectedPt = points[selectedPointIndex] || points[0];

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl text-slate-100 font-mono">
      {/* Top Header Bar & Preset Tools */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-950/70 border border-cyan-800 rounded-md text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300">
                {isArabic ? 'محرر تعويض الكسب بالعمق (Interactive TVG / TCG Editor)' : 'Interactive TVG / TCG Curve Editor'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-[10px] text-emerald-400 font-semibold">
                {isArabic ? 'معايرة تعويض التخميد' : 'Attenuation Comp.'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              {isArabic
                ? 'اسحب النقاط مباشرة على المخطط لتعويض التخميد في اللحامات والمواد السميكة'
                : 'Drag points directly on the chart to equalize echo amplitudes across depths in thick welds'}
            </p>
          </div>
        </div>

        {/* Action Controls & Presets */}
        <div className="flex items-center gap-2">
          {/* Depth View Max Range Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[11px]">
            <span className="text-slate-400 px-1 text-[10px]">
              {isArabic ? 'المدى:' : 'Range:'}
            </span>
            {[50, 75, 100, 150].map((d) => (
              <button
                key={d}
                onClick={() => setChartMaxDepth(d)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  chartMaxDepth === d
                    ? 'bg-cyan-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}mm
              </button>
            ))}
          </div>

          {/* Presets Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowPresetsMenu((v) => !v)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isArabic ? 'نماذج جاهزة للمواد' : 'Material Presets'}</span>
            </button>

            {showPresetsMenu && (
              <div
                className={`absolute ${
                  isArabic ? 'left-0' : 'right-0'
                } mt-1 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-30 space-y-1 text-xs`}
              >
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-800">
                  {isArabic ? 'نماذج كود ASME والمواد السميكة' : 'THICK WELD ATTENUATION PRESETS'}
                </div>

                <button
                  onClick={() => applyPreset('THICK_CARBON_STEEL')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 flex flex-col transition-colors group"
                >
                  <div className="flex items-center justify-between text-cyan-300 font-semibold group-hover:text-cyan-200">
                    <span>{isArabic ? 'لحام صلب كربوني سميك (50-100 مم)' : 'Thick Carbon Steel (50-100mm)'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">+0.3 dB/mm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {isArabic ? 'تعويض قياسي للحامات الأنابيب والأوعية السميكة' : 'Standard ASME Sec V heavy-wall compensation'}
                  </span>
                </button>

                <button
                  onClick={() => applyPreset('AUSTENITIC_HEAVY_WALL')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 flex flex-col transition-colors group"
                >
                  <div className="flex items-center justify-between text-amber-300 font-semibold group-hover:text-amber-200">
                    <span>{isArabic ? 'فولاذ أوستنيتي / مقاوم للصدأ (تخميد عالٍ)' : 'Austenitic / Stainless (High Atten)'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">+0.6 dB/mm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {isArabic ? 'تعويض التشتت الحبيبي العالي في اللحام الأوستنيتي' : 'Compensates high grain scatter & attenuation'}
                  </span>
                </button>

                <button
                  onClick={() => applyPreset('ASME_3_POINT_DAC')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 flex flex-col transition-colors group"
                >
                  <div className="flex items-center justify-between text-emerald-300 font-semibold group-hover:text-emerald-200">
                    <span>{isArabic ? 'منحنى ASME Sec V بثلاث نقاط (1/4T, 1/2T, 3/4T)' : 'ASME Sec V 3-Point DAC (1/4T, 1/2T, 3/4T)'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Code Ref</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {isArabic ? 'معايرة ثقوب جانبية SDH قياسية' : 'Standard 3-hole SDH calibration block'}
                  </span>
                </button>

                <button
                  onClick={() => applyPreset('ASME_5_POINT_DAC')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 flex flex-col transition-colors group"
                >
                  <div className="flex items-center justify-between text-slate-200 font-semibold group-hover:text-cyan-200">
                    <span>{isArabic ? 'منحنى كامل بـ 5 نقاط على طول الجدار' : 'ASME 5-Point Full DAC Curve'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">5-Pts</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {isArabic ? 'تغطية منتظمة لسماكة الجدار بالكامل' : 'High density 5-point wall profile'}
                  </span>
                </button>

                <button
                  onClick={() => applyPreset('RESET_DEFAULT')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors border-t border-slate-800 mt-1 pt-1.5"
                >
                  <span>{isArabic ? 'إعادة التعيين إلى المنحنى الافتراضي' : 'Reset to Default Nominal Curve'}</span>
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Legend Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded-full" />
            <span className="text-cyan-300 font-semibold">
              {isArabic ? 'منحنى TVG المعاير (+dB)' : 'Calibrated TVG Curve (+dB)'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-500" />
            <span className="text-amber-400/90">
              {isArabic ? 'منحنى التخميد الصوتي غير المعوض' : 'Uncompensated Acoustic Attenuation'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-emerald-400" />
            <span className="text-emerald-400">
              {isArabic ? 'الهدف الموحد: 80% FSH' : 'Normalized Target: 80% FSH'}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <Move className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>
            {isArabic
              ? '💡 انقر واسحب أي نقطة • انقر مرتين لإضافة نقطة'
              : '💡 Click & drag nodes • Click plot to add depth point'}
          </span>
        </div>
      </div>

      {/* SVG Canvas Chart Area */}
      <div className="relative w-full p-2 bg-slate-950 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={`w-full h-auto cursor-crosshair select-none ${
            activeDragIndex !== null ? 'cursor-grabbing' : ''
          }`}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={() => {
            if (activeDragIndex === null) {
              setScrubCoord(null);
              setHoveredPointIndex(null);
            }
          }}
          onClick={handleCanvasClick}
        >
          <defs>
            {/* Linear gradient for TVG area fill */}
            <linearGradient id="tvg-fill-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="tvg-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.0" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Node pulse shadow */}
            <filter id="node-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Plot Background Grid Box */}
          <rect
            x={padLeft}
            y={padTop}
            width={chartW}
            height={chartH}
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="1.2"
          />

          {/* Horizontal Gain Grid Lines & Labels */}
          {gainTicks.map((g) => {
            const y = yToSvg(g);
            return (
              <g key={g}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke="#172233"
                  strokeWidth="1"
                  strokeDasharray={g === 0 ? '' : '3,3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  +{g} dB
                </text>
              </g>
            );
          })}

          {/* Vertical Depth Grid Lines & Labels */}
          {depthTicks.map((d) => {
            const x = xToSvg(d);
            return (
              <g key={d}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="#172233"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padTop + chartH + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d}mm
                </text>
              </g>
            );
          })}

          {/* Specimen Wall Thickness Marker Line (T) */}
          {specimenThickness > 0 && specimenThickness <= chartMaxDepth && (
            <g>
              <line
                x1={xToSvg(specimenThickness)}
                y1={padTop}
                x2={xToSvg(specimenThickness)}
                y2={padTop + chartH}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={xToSvg(specimenThickness)}
                y={padTop + 14}
                textAnchor="middle"
                fill="#818cf8"
                fontSize="9"
                fontWeight="bold"
              >
                Wall T ({specimenThickness}mm)
              </text>
            </g>
          )}

          {/* Theoretical Acoustic Decay Curve (Uncompensated raw echo attenuation) */}
          <path
            d={rawDecayPathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="5,4"
            opacity="0.65"
          />

          {/* Gradient Area Fill Under Calibrated TVG Curve */}
          <path d={areaPathD} fill="url(#tvg-fill-gradient)" />

          {/* Primary Calibrated TVG Spline Line */}
          <path
            d={curvePathD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3.0"
            filter="url(#tvg-glow)"
          />

          {/* Active Drag Guide Projections (when dragging a node) */}
          {activeDragIndex !== null && points[activeDragIndex] && (
            <g>
              {/* Vertical line to X axis */}
              <line
                x1={xToSvg(points[activeDragIndex].depth)}
                y1={padTop}
                x2={xToSvg(points[activeDragIndex].depth)}
                y2={padTop + chartH}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              {/* Horizontal line to Y axis */}
              <line
                x1={padLeft}
                y1={yToSvg(points[activeDragIndex].gainOffset)}
                x2={padLeft + chartW}
                y2={yToSvg(points[activeDragIndex].gainOffset)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              {/* Axis Pill Badges */}
              <rect
                x={xToSvg(points[activeDragIndex].depth) - 26}
                y={padTop + chartH + 3}
                width="52"
                height="16"
                rx="3"
                fill="#0284c7"
              />
              <text
                x={xToSvg(points[activeDragIndex].depth)}
                y={padTop + chartH + 15}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
              >
                {points[activeDragIndex].depth.toFixed(1)}mm
              </text>

              <rect
                x={padLeft - 44}
                y={yToSvg(points[activeDragIndex].gainOffset) - 8}
                width="40"
                height="16"
                rx="3"
                fill="#0284c7"
              />
              <text
                x={padLeft - 24}
                y={yToSvg(points[activeDragIndex].gainOffset) + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
              >
                +{points[activeDragIndex].gainOffset.toFixed(1)}
              </text>
            </g>
          )}

          {/* Calibration Point Nodes (Interactive Handles) */}
          {points.map((pt, idx) => {
            const cx = xToSvg(pt.depth);
            const cy = yToSvg(pt.gainOffset);
            const isDragging = activeDragIndex === idx;
            const isSelected = selectedPointIndex === idx;
            const isHovered = hoveredPointIndex === idx;

            return (
              <g
                key={idx}
                onPointerDown={(e) => handlePointPointerDown(e, idx)}
                onPointerEnter={() => setHoveredPointIndex(idx)}
                onPointerLeave={() => setHoveredPointIndex(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPointIndex(idx);
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                {/* Large Invisible Hit Area Target (ensures easy mobile/touch grabbing) */}
                <circle cx={cx} cy={cy} r="18" fill="transparent" />

                {/* Outer halo / selection indicator ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isDragging ? 12 : isSelected ? 9.5 : isHovered ? 8 : 6}
                  fill={isDragging ? '#06b6d4' : isSelected ? '#38bdf8' : '#0284c7'}
                  fillOpacity={isDragging ? 0.45 : isSelected ? 0.35 : 0.2}
                  stroke={isSelected || isDragging ? '#38bdf8' : 'none'}
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                  filter="url(#node-glow)"
                />

                {/* Center Core Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isDragging ? 5.5 : isSelected ? 4.5 : 3.5}
                  fill={isDragging ? '#ffffff' : isSelected ? '#22d3ee' : '#e2e8f0'}
                  stroke={isDragging ? '#0284c7' : '#0891b2'}
                  strokeWidth={isDragging ? 2.5 : 2}
                  className="transition-all duration-150"
                />

                {/* Point Coordinate Tag */}
                <g
                  transform={`translate(${cx}, ${cy - (isDragging ? 14 : 12)})`}
                  className="pointer-events-none select-none"
                >
                  <rect
                    x="-24"
                    y="-13"
                    width="48"
                    height="14"
                    rx="3"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke={isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    +{pt.gainOffset.toFixed(1)}dB
                  </text>
                </g>
              </g>
            );
          })}

          {/* Active Hairline Cursor HUD on Scrub */}
          {scrubCoord && activeDragIndex === null && (
            <g className="pointer-events-none">
              <line
                x1={xToSvg(scrubCoord.depth)}
                y1={padTop}
                x2={xToSvg(scrubCoord.depth)}
                y2={padTop + chartH}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.8"
              />
              <circle
                cx={xToSvg(scrubCoord.depth)}
                cy={yToSvg(scrubCoord.gain)}
                r="4.5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Readout HUD floating card */}
              <g
                transform={`translate(${Math.min(
                  chartW - 70,
                  Math.max(padLeft + 10, xToSvg(scrubCoord.depth) - 70)
                )}, ${padTop + 10})`}
              >
                <rect
                  width="140"
                  height="46"
                  fill="rgba(15, 23, 42, 0.94)"
                  stroke="#0284c7"
                  strokeWidth="1"
                  rx="5"
                />
                <text x="8" y="16" fill="#94a3b8" fontSize="9.5">
                  Depth: <tspan fill="#ffffff" fontWeight="bold">{scrubCoord.depth.toFixed(1)} mm</tspan>
                </text>
                <text x="8" y="32" fill="#94a3b8" fontSize="9.5">
                  TVG Gain: <tspan fill="#22d3ee" fontWeight="bold">+{scrubCoord.gain.toFixed(1)} dB</tspan>
                </text>
              </g>
            </g>
          )}

          {/* Axis Titles */}
          <text
            x={padLeft + chartW / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            {isArabic ? 'العمق في المعدن (Depth mm)' : 'Material Depth (mm)'}
          </text>

          <text
            x={16}
            y={padTop + chartH / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
            transform={`rotate(-90 16 ${padTop + chartH / 2})`}
          >
            {isArabic ? 'كسب التعويض (TVG Gain Offset +dB)' : 'TVG Gain Offset (+dB)'}
          </text>
        </svg>
      </div>

      {/* Selected Point Fine-Tuning & Insertion Strip */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Selected Point Fine Adjustment Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold text-[11px]">
              {isArabic ? `النقطة المحددة P#${selectedPointIndex + 1}:` : `Active Point P#${selectedPointIndex + 1}:`}
            </span>
            <span className="text-cyan-400 font-bold">
              {selectedPt ? `${selectedPt.depth}mm @ +${selectedPt.gainOffset.toFixed(1)}dB` : '--'}
            </span>
          </div>

          {/* Gain Stepper */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] mr-1">
              {isArabic ? 'الكسب:' : 'Gain:'}
            </span>
            <button
              onClick={() => handleStepPoint(0, -1.0)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-[11px]"
              title="Decrease 1.0 dB"
            >
              -1.0
            </button>
            <button
              onClick={() => handleStepPoint(0, -0.2)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-[11px]"
              title="Decrease 0.2 dB"
            >
              -0.2
            </button>
            <span className="px-1.5 font-bold text-cyan-400 tabular-nums">
              +{selectedPt ? selectedPt.gainOffset.toFixed(1) : 0} dB
            </span>
            <button
              onClick={() => handleStepPoint(0, +0.2)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-[11px]"
              title="Increase 0.2 dB"
            >
              +0.2
            </button>
            <button
              onClick={() => handleStepPoint(0, +1.0)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-[11px]"
              title="Increase 1.0 dB"
            >
              +1.0
            </button>
          </div>

          {/* Depth Stepper */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] mr-1">
              {isArabic ? 'العمق:' : 'Depth:'}
            </span>
            <button
              onClick={() => handleStepPoint(-1.0, 0)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-[11px]"
              title="Decrease depth 1 mm"
            >
              -1mm
            </button>
            <span className="px-1.5 font-bold text-slate-200 tabular-nums">
              {selectedPt ? selectedPt.depth.toFixed(1) : 0} mm
            </span>
            <button
              onClick={() => handleStepPoint(+1.0, 0)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-[11px]"
              title="Increase depth 1 mm"
            >
              +1mm
            </button>
          </div>

          {/* Delete Point Button */}
          <button
            onClick={() => handleDeletePoint(selectedPointIndex)}
            disabled={points.length <= 2}
            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={isArabic ? 'حذف هذه النقطة من المنحنى' : 'Delete this point'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add Calibration Point Section */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-400 text-[10px]">
              {isArabic ? 'إضافة عمق:' : 'Add Depth:'}
            </span>
            <input
              type="number"
              min="1"
              max={chartMaxDepth}
              value={newPointDepth}
              onChange={(e) => setNewPointDepth(Math.max(1, Math.min(chartMaxDepth, parseFloat(e.target.value) || 1)))}
              className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-center font-bold text-[11px]"
            />
            <span className="text-slate-500 text-[10px]">mm</span>

            <span className="text-slate-400 text-[10px] ml-1">
              {isArabic ? 'كسب:' : 'Gain:'}
            </span>
            <input
              type="number"
              min="0"
              max={chartMaxGain}
              step="0.5"
              value={newPointGain}
              onChange={(e) => setNewPointGain(Math.max(0, Math.min(chartMaxGain, parseFloat(e.target.value) || 0)))}
              className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-center font-bold text-[11px]"
            />
            <span className="text-slate-500 text-[10px]">dB</span>

            <button
              onClick={handleAddCustomPoint}
              className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded flex items-center gap-1 transition-colors text-[10px]"
            >
              <Plus className="w-3 h-3" />
              <span>{isArabic ? 'إضافة' : 'Insert'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Point Chips Summary Grid */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 font-semibold text-[11px]">
            {isArabic ? 'نقاط المعايرة النشطة في المنحنى:' : 'Active Calibrated TVG Nodes:'}
          </span>
          <span className="text-slate-500 text-[10px]">
            {points.length} {isArabic ? 'نقاط مسجلة' : 'nodes defined'} • ASME Sec V Art 4
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {points.map((pt, idx) => {
            const isSelected = selectedPointIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedPointIndex(idx)}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 text-[11px] transition-all ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span className="font-bold">P#{idx + 1}</span>
                <span className="text-slate-300">{pt.depth}mm</span>
                <span className="text-cyan-400 font-bold">+{pt.gainOffset.toFixed(1)}dB</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
