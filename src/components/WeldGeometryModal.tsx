/**
 * Custom Weld Geometry Definition Modal
 * Allows inspector to configure weld groove type (Single-V, Double-V, Single-U, J-Groove),
 * plate thickness, bevel angle, root opening, root face (land), and cap reinforcement,
 * with real-time technical CAD cross-section preview and dimensional callouts.
 */

import React, { useState } from 'react';
import { SpecimenConfig } from '../types/paut';
import {
  Layers,
  Check,
  X,
  RotateCcw,
  Sliders,
  Sparkles,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface WeldGeometryModalProps {
  currentSpecimen: SpecimenConfig;
  onApplySpecimen: (updatedSpecimen: SpecimenConfig) => void;
  onClose: () => void;
  isArabic: boolean;
}

export const WeldGeometryModal: React.FC<WeldGeometryModalProps> = ({
  currentSpecimen,
  onApplySpecimen,
  onClose,
  isArabic,
}) => {
  // Local editable geometry state
  const [grooveType, setGrooveType] = useState<'single_v' | 'double_v' | 'single_u' | 'j_groove'>(
    currentSpecimen.grooveType || 'single_v'
  );
  const [thickness, setThickness] = useState<number>(currentSpecimen.thickness || 20.0);
  const [bevelAngle, setBevelAngle] = useState<number>(currentSpecimen.bevelAngle || 30.0);
  const [bottomBevelAngle, setBottomBevelAngle] = useState<number>(
    currentSpecimen.bottomBevelAngle || 35.0
  );
  const [rootGap, setRootGap] = useState<number>(currentSpecimen.rootGap || 2.0);
  const [rootFace, setRootFace] = useState<number>(currentSpecimen.rootFace || 1.5);
  const [capHeight, setCapHeight] = useState<number>(currentSpecimen.capHeight || 1.8);
  const [capWidth, setCapWidth] = useState<number>(currentSpecimen.capWidth || 18.0);
  const [uRadius, setURadius] = useState<number>(currentSpecimen.uRadius || 5.0);
  const [hazWidth, setHazWidth] = useState<number>(currentSpecimen.hazWidth || 3.0);
  const [weldName, setWeldName] = useState<string>(currentSpecimen.name);

  // Quick industry standard presets
  const applyPreset = (preset: 'ASME_V' | 'HEAVY_DOUBLE_V' | 'PIPELINE_U' | 'THIN_WALL') => {
    if (preset === 'ASME_V') {
      setGrooveType('single_v');
      setThickness(20.0);
      setBevelAngle(30.0);
      setRootGap(2.0);
      setRootFace(1.5);
      setCapHeight(1.8);
      setCapWidth(18.0);
      setHazWidth(3.0);
      setWeldName('ASME B31.3 Standard Single-V Butt Weld (20mm)');
    } else if (preset === 'HEAVY_DOUBLE_V') {
      setGrooveType('double_v');
      setThickness(32.0);
      setBevelAngle(35.0);
      setBottomBevelAngle(35.0);
      setRootGap(2.5);
      setRootFace(2.0);
      setCapHeight(2.2);
      setCapWidth(26.0);
      setHazWidth(3.5);
      setWeldName('AWS D1.1 Heavy Section Double-V Weld (32mm)');
    } else if (preset === 'PIPELINE_U') {
      setGrooveType('single_u');
      setThickness(18.0);
      setBevelAngle(8.0);
      setURadius(5.0);
      setRootGap(1.2);
      setRootFace(1.8);
      setCapHeight(1.5);
      setCapWidth(14.0);
      setHazWidth(2.5);
      setWeldName('API 1104 Pipeline Narrow-Gap Single-U Weld (18mm)');
    } else if (preset === 'THIN_WALL') {
      setGrooveType('single_v');
      setThickness(10.0);
      setBevelAngle(37.5);
      setRootGap(1.5);
      setRootFace(1.0);
      setCapHeight(1.2);
      setCapWidth(12.0);
      setHazWidth(2.0);
      setWeldName('Process Piping Thin-Wall V-Weld (10mm)');
    }
  };

  const handleSaveAndApply = () => {
    const updated: SpecimenConfig = {
      ...currentSpecimen,
      name: weldName,
      thickness,
      bevelAngle,
      bottomBevelAngle,
      rootGap,
      rootFace,
      capHeight,
      capWidth,
      uRadius,
      hazWidth,
      grooveType,
    };
    onApplySpecimen(updated);
    onClose();
  };

  // SVG Preview Calculations
  const svgW = 560;
  const svgH = 260;
  const cX = svgW / 2;
  const topY = 60;
  const scale = 5.2; // pixels per mm
  const botY = topY + thickness * scale;

  // Path Generation for CAD View
  const halfGap = (rootGap / 2) * scale;
  const halfCap = (capWidth / 2) * scale;
  const landH = rootFace * scale;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950 border border-amber-800 rounded-lg text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isArabic
                  ? 'محدد ومحرر هندسة وصلة اللحام (Weld Geometry Designer)'
                  : 'Weld Joint Geometry & Bevel Designer'}
              </h2>
              <p className="text-xs text-slate-400">
                {isArabic
                  ? 'تعديل فتحة الجذر (Root Opening)، زاوية الشطف (Bevel)، ارتفاع التاج (Cap)، ونوع الدرز لتحديث الرسم فورياً'
                  : 'Configure groove type, root opening, bevel angles, and crown cap height to dynamically update the overlay'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Groove Type Tabs & Industry Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Type Selector */}
            <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
              {[
                { id: 'single_v', label: isArabic ? 'شطف V أحادي (Single-V)' : 'Single-V' },
                { id: 'double_v', label: isArabic ? 'شطف V مزدوج (Double-V / X)' : 'Double-V (X)' },
                { id: 'single_u', label: isArabic ? 'شطف U أحادي (Single-U)' : 'Single-U' },
                { id: 'j_groove', label: isArabic ? 'شطف J (J-Groove)' : 'J-Groove' },
              ].map((gt) => (
                <button
                  key={gt.id}
                  onClick={() => setGrooveType(gt.id as any)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    grooveType === gt.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {gt.label}
                </button>
              ))}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-slate-500 mr-1">{isArabic ? 'نماذج جاهزة:' : 'Presets:'}</span>
              <button
                onClick={() => applyPreset('ASME_V')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                ASME V
              </button>
              <button
                onClick={() => applyPreset('HEAVY_DOUBLE_V')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Double-V (32mm)
              </button>
              <button
                onClick={() => applyPreset('PIPELINE_U')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Pipeline U
              </button>
            </div>
          </div>

          {/* Interactive Live 2D CAD Technical Diagram */}
          <div className="w-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 p-3 shadow-inner">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-amber-400 font-bold">
                {isArabic ? 'رسم هندسي دقيق لمقطع اللحام (Cross-Section Technical CAD View)' : 'Cross-Section Technical CAD View'}
              </span>
              <span>
                {grooveType.toUpperCase()} · T: {thickness}mm · Bevel: {bevelAngle}° · Gap: {rootGap}mm
              </span>
            </div>

            <div className="relative w-full flex items-center justify-center p-2">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl h-auto select-none font-mono">
                {/* Base Metal Plates (Left and Right) */}
                <rect
                  x={20}
                  y={topY}
                  width={cX - halfCap - 20}
                  height={thickness * scale}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="1.5"
                />
                <rect
                  x={cX + halfCap}
                  y={topY}
                  width={svgW - (cX + halfCap) - 20}
                  height={thickness * scale}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="1.5"
                />

                {/* Heat Affected Zone (HAZ) Outlines */}
                <path
                  d={`M ${cX - halfCap - hazWidth * scale} ${topY} L ${cX - halfGap - (hazWidth * scale * 0.7)} ${botY}
                      M ${cX + halfCap + hazWidth * scale} ${topY} L ${cX + halfGap + (hazWidth * scale * 0.7)} ${botY}`}
                  stroke="rgba(245, 158, 11, 0.45)"
                  strokeWidth="1.2"
                  strokeDasharray="4,3"
                />

                {/* Weld Groove Fill Geometry depending on type */}
                {grooveType === 'single_v' && (
                  <path
                    d={`M ${cX - halfCap} ${topY}
                        Q ${cX} ${topY - capHeight * scale} ${cX + halfCap} ${topY}
                        L ${cX + halfGap} ${botY - landH}
                        L ${cX + halfGap} ${botY}
                        Q ${cX} ${botY + 1.2 * scale} ${cX - halfGap} ${botY}
                        L ${cX - halfGap} ${botY - landH}
                        Z`}
                    fill="rgba(6, 182, 212, 0.16)"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                )}

                {grooveType === 'double_v' && (
                  <path
                    d={`M ${cX - halfCap} ${topY}
                        Q ${cX} ${topY - capHeight * scale} ${cX + halfCap} ${topY}
                        L ${cX + halfGap} ${topY + (thickness * scale) / 2}
                        L ${cX + halfCap * 0.85} ${botY}
                        Q ${cX} ${botY + capHeight * 0.8 * scale} ${cX - halfCap * 0.85} ${botY}
                        L ${cX - halfGap} ${topY + (thickness * scale) / 2}
                        Z`}
                    fill="rgba(6, 182, 212, 0.16)"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                )}

                {grooveType === 'single_u' && (
                  <path
                    d={`M ${cX - halfCap} ${topY}
                        Q ${cX} ${topY - capHeight * scale} ${cX + halfCap} ${topY}
                        L ${cX + halfGap + (uRadius * scale * 0.4)} ${botY - landH - (uRadius * scale * 0.8)}
                        Q ${cX + halfGap} ${botY - landH} ${cX + halfGap} ${botY}
                        L ${cX - halfGap} ${botY}
                        Q ${cX - halfGap} ${botY - landH} ${cX - halfGap - (uRadius * scale * 0.4)} ${botY - landH - (uRadius * scale * 0.8)}
                        Z`}
                    fill="rgba(6, 182, 212, 0.16)"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                )}

                {grooveType === 'j_groove' && (
                  <path
                    d={`M ${cX - halfCap} ${topY}
                        L ${cX - halfGap} ${botY}
                        L ${cX + halfGap} ${botY}
                        Q ${cX + halfGap + 10} ${botY - landH} ${cX + halfCap} ${topY}
                        Z`}
                    fill="rgba(6, 182, 212, 0.16)"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                )}

                {/* Centerline (Red dash-dot) */}
                <line
                  x1={cX}
                  y1={topY - 30}
                  x2={cX}
                  y2={botY + 30}
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeDasharray="6,3,2,3"
                />
                <text x={cX + 4} y={topY - 20} fill="#ef4444" fontSize="9" fontWeight="bold">
                  CL
                </text>

                {/* Dimension Callouts: Plate Thickness T */}
                <g>
                  <line x1={svgW - 12} y1={topY} x2={svgW - 12} y2={botY} stroke="#94a3b8" strokeWidth="1" />
                  <line x1={svgW - 18} y1={topY} x2={svgW - 6} y2={topY} stroke="#94a3b8" strokeWidth="1" />
                  <line x1={svgW - 18} y1={botY} x2={svgW - 6} y2={botY} stroke="#94a3b8" strokeWidth="1" />
                  <text
                    x={svgW - 16}
                    y={topY + (thickness * scale) / 2}
                    textAnchor="end"
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    T = {thickness}mm
                  </text>
                </g>

                {/* Dimension Callouts: Root Opening (b) */}
                <g>
                  <line x1={cX - halfGap} y1={botY + 16} x2={cX + halfGap} y2={botY + 16} stroke="#eab308" strokeWidth="1" />
                  <line x1={cX - halfGap} y1={botY + 10} x2={cX - halfGap} y2={botY + 22} stroke="#eab308" strokeWidth="1" />
                  <line x1={cX + halfGap} y1={botY + 10} x2={cX + halfGap} y2={botY + 22} stroke="#eab308" strokeWidth="1" />
                  <text x={cX} y={botY + 30} textAnchor="middle" fill="#eab308" fontSize="10" fontWeight="bold">
                    Root Gap: {rootGap}mm
                  </text>
                </g>

                {/* Dimension Callouts: Bevel Angle theta */}
                <g>
                  <text x={cX - halfCap - 14} y={topY + 20} fill="#22d3ee" fontSize="10" fontWeight="bold">
                    θ = {bevelAngle}°
                  </text>
                  <text x={cX} y={topY - capHeight * scale - 6} textAnchor="middle" fill="#a78bfa" fontSize="9">
                    Cap Height: {capHeight}mm
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Configuration Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {/* Parameter 1: Thickness */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400">
                  {isArabic ? 'سماكة اللوح (Thickness T):' : 'Plate Thickness (T):'}
                </label>
                <span className="text-cyan-400 font-bold">{thickness} mm</span>
              </div>
              <input
                type="range"
                min={8}
                max={50}
                step={0.5}
                value={thickness}
                onChange={(e) => setThickness(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Parameter 2: Bevel Angle */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400">
                  {isArabic ? 'زاوية الشطف (Bevel Angle θ):' : 'Bevel Angle (θ):'}
                </label>
                <span className="text-cyan-400 font-bold">{bevelAngle}°</span>
              </div>
              <input
                type="range"
                min={10}
                max={45}
                step={0.5}
                value={bevelAngle}
                onChange={(e) => setBevelAngle(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Parameter 3: Root Opening (Gap) */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400">
                  {isArabic ? 'فتحة الجذر (Root Gap b):' : 'Root Opening (Gap b):'}
                </label>
                <span className="text-amber-400 font-bold">{rootGap} mm</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.1}
                value={rootGap}
                onChange={(e) => setRootGap(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Parameter 4: Root Face (Land) */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400">
                  {isArabic ? 'حافة الجذر (Root Face / Land c):' : 'Root Face (Land c):'}
                </label>
                <span className="text-slate-200 font-bold">{rootFace} mm</span>
              </div>
              <input
                type="range"
                min={0.0}
                max={4.0}
                step={0.1}
                value={rootFace}
                onChange={(e) => setRootFace(parseFloat(e.target.value))}
                className="w-full accent-slate-300"
              />
            </div>

            {/* Parameter 5: Cap Height */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400">
                  {isArabic ? 'ارتفاع التاج (Cap Height h):' : 'Crown Cap Height (h):'}
                </label>
                <span className="text-purple-400 font-bold">{capHeight} mm</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={4.0}
                step={0.1}
                value={capHeight}
                onChange={(e) => setCapHeight(parseFloat(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>

            {/* Parameter 6: Cap Width */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400">
                  {isArabic ? 'عرض التاج (Cap Width W):' : 'Crown Cap Width (W):'}
                </label>
                <span className="text-purple-400 font-bold">{capWidth} mm</span>
              </div>
              <input
                type="range"
                min={10}
                max={35}
                step={0.5}
                value={capWidth}
                onChange={(e) => setCapWidth(parseFloat(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>

            {/* Parameter 7 (Conditional): Double-V Bottom Angle */}
            {grooveType === 'double_v' && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400">Bottom Bevel Angle:</label>
                  <span className="text-cyan-400 font-bold">{bottomBevelAngle}°</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={45}
                  step={0.5}
                  value={bottomBevelAngle}
                  onChange={(e) => setBottomBevelAngle(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            )}

            {/* Parameter 8 (Conditional): U-Radius */}
            {grooveType === 'single_u' && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400">U-Groove Root Radius:</label>
                  <span className="text-cyan-400 font-bold">{uRadius} mm</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={0.5}
                  value={uRadius}
                  onChange={(e) => setURadius(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            )}

            {/* Parameter 9: HAZ Width */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400">HAZ Extent Width:</label>
                <span className="text-amber-400 font-bold">{hazWidth} mm</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={6.0}
                step={0.2}
                value={hazWidth}
                onChange={(e) => setHazWidth(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            {isArabic ? 'سيتم تطبيق الهندسة فورياً على شاشة S-Scan ومسارات الأشعة' : 'Geometry will immediately update S-Scan & Ray Tracing overlays'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              {isArabic ? 'تطبيق وحفظ هندسة اللحام' : 'Apply & Update Weld Overlay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
