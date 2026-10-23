/**
 * OmniScan Right Navigation Bar & Parameter Flyout Drawer
 * Authentic Olympus 8-menu system with quick tactile touch adjustments
 */

import React, { useState } from 'react';
import {
  UltrasonicParams,
  FocalLawConfig,
  SpecimenConfig,
  GateConfig,
  WedgeConfig,
  ProbeConfig,
} from '../types/paut';
import {
  FolderOpen,
  Sliders,
  Filter,
  Activity,
  Zap,
  Cpu,
  Gauge,
  Bell,
  Layers,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
} from 'lucide-react';

interface OmniScanSidebarProps {
  params: UltrasonicParams;
  onUpdateParams: (params: UltrasonicParams) => void;
  focalLaws: FocalLawConfig;
  onUpdateFocalLaws: (laws: FocalLawConfig) => void;
  specimen: SpecimenConfig;
  onUpdateSpecimen: (specimen: SpecimenConfig) => void;
  gateA: GateConfig;
  onGateAChange: (g: GateConfig) => void;
  gateB: GateConfig;
  onGateBChange: (g: GateConfig) => void;
  wedge: WedgeConfig;
  probe: ProbeConfig;
  onOpenProbeLink: () => void;
  onOpenCalibration: () => void;
  onOpenReport: () => void;
  onOpenWeldGeometry: () => void;
  isArabic: boolean;
}

type MenuKey = 'FILE' | 'UT' | 'FILTER' | 'FOCAL' | 'PROBE' | 'CAL' | 'GATES' | 'SPECIMEN' | 'VIEW' | null;

export const OmniScanSidebar: React.FC<OmniScanSidebarProps> = ({
  params,
  onUpdateParams,
  focalLaws,
  onUpdateFocalLaws,
  specimen,
  onUpdateSpecimen,
  gateA,
  onGateAChange,
  gateB,
  onGateBChange,
  wedge,
  probe,
  onOpenProbeLink,
  onOpenCalibration,
  onOpenReport,
  onOpenWeldGeometry,
  isArabic,
}) => {
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);

  const toggleMenu = (key: MenuKey) => {
    setActiveMenu((prev) => (prev === key ? null : key));
  };

  const menuItems = [
    { id: 'UT', icon: Sliders, label: isArabic ? 'إعدادات UT' : 'UT Settings', color: 'text-cyan-400' },
    { id: 'FILTER', icon: Filter, label: isArabic ? 'مرشحات الإشارة' : 'Signal Filters', color: 'text-indigo-400' },
    { id: 'FOCAL', icon: Zap, label: isArabic ? 'القوانين البؤرية' : 'Focal Law', color: 'text-amber-400' },
    { id: 'GATES', icon: Bell, label: isArabic ? 'البوابات Gate' : 'Gates / Alarm', color: 'text-rose-400' },
    { id: 'SPECIMEN', icon: Layers, label: isArabic ? 'اللحام والعينة' : 'Specimen / Weld', color: 'text-emerald-400' },
    { id: 'PROBE', icon: Cpu, label: isArabic ? 'بروب العمل' : 'Work Probe', color: 'text-blue-400' },
    { id: 'CAL', icon: Gauge, label: isArabic ? 'المعايرة' : 'Calibration', color: 'text-purple-400' },
    { id: 'FILE', icon: FolderOpen, label: isArabic ? 'الملف والحفظ' : 'File / Data', color: 'text-slate-300' },
  ];

  return (
    <aside className="relative flex z-20" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Flyout Drawer for active menu */}
      {activeMenu && (
        <div className="w-72 sm:w-80 h-full bg-slate-900 border-l border-r border-slate-800 p-4 overflow-y-auto text-xs font-mono space-y-4 shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-100 uppercase">
              {menuItems.find((m) => m.id === activeMenu)?.label}
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 text-slate-400 hover:text-slate-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* MENU 1: UT SETTINGS */}
          {activeMenu === 'UT' && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Gain (dB)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateParams({ ...params, gain: Math.max(0, params.gain - 1) })}
                    className="w-8 h-8 rounded bg-slate-800 text-slate-200 font-bold"
                  >
                    -1
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    step={0.5}
                    value={params.gain}
                    onChange={(e) => onUpdateParams({ ...params, gain: parseFloat(e.target.value) })}
                    className="flex-1 accent-cyan-400"
                  />
                  <button
                    onClick={() => onUpdateParams({ ...params, gain: Math.min(80, params.gain + 1) })}
                    className="w-8 h-8 rounded bg-slate-800 text-slate-200 font-bold"
                  >
                    +1
                  </button>
                </div>
                <div className="text-right text-cyan-400 font-bold mt-1">{params.gain.toFixed(1)} dB</div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Range (mm)</label>
                <input
                  type="number"
                  value={params.range}
                  onChange={(e) => onUpdateParams({ ...params, range: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Velocity (m/s)</label>
                <input
                  type="number"
                  value={params.velocity}
                  onChange={(e) => onUpdateParams({ ...params, velocity: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Pulse Repetition (PRF)</label>
                <select
                  value={params.prf}
                  onChange={(e) => onUpdateParams({ ...params, prf: parseInt(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                >
                  <option value={1000}>1000 Hz</option>
                  <option value={2000}>2000 Hz</option>
                  <option value={3000}>3000 Hz</option>
                  <option value={6000}>6000 Hz</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Rectification</label>
                <select
                  value={params.rectification}
                  onChange={(e) => onUpdateParams({ ...params, rectification: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                >
                  <option value="FULL_WAVE">Full Wave Rectified</option>
                  <option value="RF">Unrectified RF Signal</option>
                  <option value="HALF_WAVE_POS">Half Wave Positive (+)</option>
                </select>
              </div>

              {/* Peak Hold Information & Mode Note */}
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-yellow-500/30 space-y-1">
                <div className="font-bold text-yellow-400 flex items-center gap-1.5 text-[11px]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تثبيت ذروة الإشارة (Peak Hold)' : 'A-Scan Peak Hold'}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {isArabic
                    ? 'يتم عرض غلاف أقصى سعة منعكسة باللون الأصفر فوق الإشارة الحية الخضراء في نافذة A-Scan لتتبع أعلى صدى للعيوب أثناء حركة الماسح.'
                    : 'The maximum amplitude envelope is overlaid in brilliant yellow over the live green A-Scan to trace peak echo responses during scanner travel.'}
                </p>
              </div>
            </div>
          )}

          {/* MENU: SIGNAL FILTERS */}
          {activeMenu === 'FILTER' && (
            <div className="space-y-4">
              {/* Master Filter Toggle */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isArabic ? 'مرشح النطاق الترددي (Bandpass)' : 'Digital Bandpass Filter'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {params.filterConfig?.enabled
                      ? `${params.filterConfig.lowCutoffMHz} - ${params.filterConfig.highCutoffMHz} MHz Active`
                      : isArabic
                        ? 'غير مفعل (عريض النطاق)'
                        : 'Disabled (Broadband)'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const cfg = params.filterConfig || {
                      enabled: false,
                      preset: '2-5MHz',
                      lowCutoffMHz: 2.0,
                      highCutoffMHz: 5.0,
                      noiseReductionLevel: 65,
                      smoothing: true,
                    };
                    onUpdateParams({
                      ...params,
                      filterConfig: { ...cfg, enabled: !cfg.enabled },
                    });
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-all ${
                    params.filterConfig?.enabled
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {params.filterConfig?.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Band-Pass Presets */}
              <div className="space-y-2">
                <label className="text-slate-400 block text-[11px]">
                  {isArabic ? 'نماذج نطاقات التردد الجاهزة:' : 'Band-Pass Frequency Presets:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    {
                      id: 'NONE',
                      label: isArabic ? 'بدون (عريض)' : 'Broadband',
                      low: 0.5,
                      high: 15.0,
                      desc: '0.5 - 15 MHz',
                    },
                    {
                      id: '0.5-2MHz',
                      label: '0.5 - 2 MHz',
                      low: 0.5,
                      high: 2.0,
                      desc: isArabic ? 'اختراق عميق للمسبوكات' : 'Castings & Thick',
                    },
                    {
                      id: '2-5MHz',
                      label: '2 - 5 MHz',
                      low: 2.0,
                      high: 5.0,
                      desc: isArabic ? 'اللحامات القياسية 5MHz' : 'Standard Welds',
                    },
                    {
                      id: '5-10MHz',
                      label: '5 - 10 MHz',
                      low: 5.0,
                      high: 10.0,
                      desc: isArabic ? 'دقة عالية للمقاطع الرقيقة' : 'High Resolution',
                    },
                  ].map((p) => {
                    const isSelected = params.filterConfig?.preset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onUpdateParams({
                            ...params,
                            filter: p.label,
                            filterConfig: {
                              ...(params.filterConfig || {
                                enabled: true,
                                preset: '2-5MHz',
                                lowCutoffMHz: 2.0,
                                highCutoffMHz: 5.0,
                                noiseReductionLevel: 65,
                                smoothing: true,
                              }),
                              enabled: true,
                              preset: p.id as any,
                              lowCutoffMHz: p.low,
                              highCutoffMHz: p.high,
                            },
                          });
                        }}
                        className={`p-2 rounded border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-[11px] text-slate-200">{p.label}</div>
                        <div className="text-[9px] text-slate-500 font-sans truncate mt-0.5">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Frequency Passband Curve Visualizer Mini Graph */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-slate-300">
                    {isArabic ? 'منحنى الاستجابة الترددية:' : 'Frequency Response Curve:'}
                  </span>
                  <span className="text-indigo-400 font-mono">
                    {params.filterConfig?.lowCutoffMHz || 2.0} - {params.filterConfig?.highCutoffMHz || 5.0} MHz
                  </span>
                </div>

                <div className="relative w-full h-16 bg-slate-900 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
                  <svg viewBox="0 0 280 64" className="w-full h-full font-mono">
                    {/* Background grid */}
                    <line x1="10" y1="50" x2="270" y2="50" stroke="#1e293b" strokeWidth="1" />
                    <line x1="70" y1="10" x2="70" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="140" y1="10" x2="140" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="210" y1="10" x2="210" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />

                    {/* Passband shape */}
                    {(() => {
                      const maxFreq = 15;
                      const lowCut = params.filterConfig?.lowCutoffMHz || 2.0;
                      const highCut = params.filterConfig?.highCutoffMHz || 5.0;
                      const x1 = Math.max(10, 10 + (lowCut / maxFreq) * 250);
                      const x2 = Math.min(270, 10 + (highCut / maxFreq) * 250);
                      const rollOff1 = Math.max(10, x1 - 18);
                      const rollOff2 = Math.min(270, x2 + 18);

                      return (
                        <g>
                          {/* Fill under passband */}
                          <path
                            d={`M ${rollOff1} 50 Q ${x1 - 4} 48 ${x1} 14 L ${x2} 14 Q ${x2 + 4} 48 ${rollOff2} 50 Z`}
                            fill="rgba(99, 102, 241, 0.22)"
                          />
                          {/* Top curve */}
                          <path
                            d={`M ${rollOff1} 50 Q ${x1 - 4} 48 ${x1} 14 L ${x2} 14 Q ${x2 + 4} 48 ${rollOff2} 50 Z`}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="2"
                          />
                          {/* Probe Frequency Marker (~5MHz) */}
                          <line
                            x1={10 + (5.0 / maxFreq) * 250}
                            y1="8"
                            x2={10 + (5.0 / maxFreq) * 250}
                            y2="50"
                            stroke="#06b6d4"
                            strokeWidth="1.5"
                            strokeDasharray="3,2"
                          />
                          <text
                            x={10 + (5.0 / maxFreq) * 250}
                            y="11"
                            textAnchor="middle"
                            fill="#06b6d4"
                            fontSize="8"
                            fontWeight="bold"
                          >
                            5MHz
                          </text>
                        </g>
                      );
                    })()}

                    {/* Frequency Axis Ticks */}
                    <text x="10" y="60" fill="#64748b" fontSize="8">0</text>
                    <text x="70" y="60" fill="#64748b" fontSize="8">3M</text>
                    <text x="140" y="60" fill="#64748b" fontSize="8">7M</text>
                    <text x="210" y="60" fill="#64748b" fontSize="8">12M</text>
                    <text x="260" y="60" fill="#64748b" fontSize="8">15M</text>
                  </svg>
                </div>
              </div>

              {/* Threshold Sliders */}
              <div className="space-y-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>{isArabic ? 'حد التردد الأدنى (High-Pass):' : 'Low Cutoff (High-Pass):'}</span>
                    <span className="text-indigo-400 font-bold">{params.filterConfig?.lowCutoffMHz || 2.0} MHz</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={8.0}
                    step={0.1}
                    value={params.filterConfig?.lowCutoffMHz || 2.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateParams({
                        ...params,
                        filterConfig: {
                          ...(params.filterConfig || {
                            enabled: true,
                            preset: 'CUSTOM',
                            lowCutoffMHz: 2.0,
                            highCutoffMHz: 5.0,
                            noiseReductionLevel: 65,
                            smoothing: true,
                          }),
                          lowCutoffMHz: val,
                          preset: 'CUSTOM',
                        },
                      });
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>{isArabic ? 'حد التردد الأعلى (Low-Pass):' : 'High Cutoff (Low-Pass):'}</span>
                    <span className="text-indigo-400 font-bold">{params.filterConfig?.highCutoffMHz || 5.0} MHz</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={16.0}
                    step={0.2}
                    value={params.filterConfig?.highCutoffMHz || 5.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateParams({
                        ...params,
                        filterConfig: {
                          ...(params.filterConfig || {
                            enabled: true,
                            preset: 'CUSTOM',
                            lowCutoffMHz: 2.0,
                            highCutoffMHz: 5.0,
                            noiseReductionLevel: 65,
                            smoothing: true,
                          }),
                          highCutoffMHz: val,
                          preset: 'CUSTOM',
                        },
                      });
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>{isArabic ? 'تقليل التشويش (Noise Reduction):' : 'Noise Reduction Level:'}</span>
                    <span className="text-emerald-400 font-bold">{params.filterConfig?.noiseReductionLevel || 65}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={params.filterConfig?.noiseReductionLevel ?? 65}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onUpdateParams({
                        ...params,
                        filterConfig: {
                          ...(params.filterConfig || {
                            enabled: true,
                            preset: '2-5MHz',
                            lowCutoffMHz: 2.0,
                            highCutoffMHz: 5.0,
                            noiseReductionLevel: 65,
                            smoothing: true,
                          }),
                          noiseReductionLevel: val,
                        },
                      });
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Smoothing Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-300 text-[11px]">
                    {isArabic ? 'تنعيم النبضات الرقمي (Smoothing):' : 'Pulse Envelope Smoothing:'}
                  </span>
                  <input
                    type="checkbox"
                    checked={params.filterConfig?.smoothing ?? true}
                    onChange={(e) => {
                      onUpdateParams({
                        ...params,
                        filterConfig: {
                          ...(params.filterConfig || {
                            enabled: true,
                            preset: '2-5MHz',
                            lowCutoffMHz: 2.0,
                            highCutoffMHz: 5.0,
                            noiseReductionLevel: 65,
                            smoothing: true,
                          }),
                          smoothing: e.target.checked,
                        },
                      });
                    }}
                    className="accent-indigo-500"
                  />
                </div>
              </div>

              {/* Signal Quality Card */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/60 rounded-lg text-[11px] space-y-1">
                <div className="text-indigo-300 font-bold flex items-center justify-between">
                  <span>{isArabic ? 'جودة إشارة الصدى (SNR):' : 'Estimated SNR Quality:'}</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {params.filterConfig?.enabled
                      ? `+${(18 + (params.filterConfig?.noiseReductionLevel || 65) * 0.15).toFixed(1)} dB (Optimal)`
                      : '+14.2 dB (Raw)'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans leading-tight">
                  {isArabic
                    ? 'تقوم المرشحات بعزل الضوضاء الحبيبية للمعدن والتشويش الإلكتروني لتحسين تمييز عيوب اللحام.'
                    : 'Filters eliminate material grain scatter and electronic noise to maximize flaw peak contrast.'}
                </div>
              </div>
            </div>
          )}

          {/* MENU 2: FOCAL LAW */}
          {activeMenu === 'FOCAL' && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Sectorial Start Angle (°)</label>
                <input
                  type="number"
                  value={focalLaws.startAngle}
                  onChange={(e) => onUpdateFocalLaws({ ...focalLaws, startAngle: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sectorial Stop Angle (°)</label>
                <input
                  type="number"
                  value={focalLaws.stopAngle}
                  onChange={(e) => onUpdateFocalLaws({ ...focalLaws, stopAngle: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Angle Step (°)</label>
                <select
                  value={focalLaws.angleStep}
                  onChange={(e) => onUpdateFocalLaws({ ...focalLaws, angleStep: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                >
                  <option value={0.5}>0.5° (High Resolution)</option>
                  <option value={1.0}>1.0° (Standard)</option>
                  <option value={2.0}>2.0° (Fast Scan)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Aperture Elements</label>
                <select
                  value={focalLaws.activeElements}
                  onChange={(e) => onUpdateFocalLaws({ ...focalLaws, activeElements: parseInt(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                >
                  <option value={16}>16 Elements Sub-Aperture</option>
                  <option value={32}>32 Elements</option>
                  <option value={64}>64 Elements (Full Array)</option>
                </select>
              </div>
            </div>
          )}

          {/* MENU 3: GATES & ALARMS */}
          {activeMenu === 'GATES' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-rose-400 font-bold">
                  <span>Gate A (Primary Flaw Gate)</span>
                  <input
                    type="checkbox"
                    checked={gateA.enabled}
                    onChange={(e) => onGateAChange({ ...gateA, enabled: e.target.checked })}
                    className="accent-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block text-[10px]">Threshold: {gateA.threshold}%</label>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={gateA.threshold}
                    onChange={(e) => onGateAChange({ ...gateA, threshold: parseInt(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block text-[10px]">Start (mm)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={gateA.start}
                      onChange={(e) => onGateAChange({ ...gateA, start: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block text-[10px]">Width (mm)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={gateA.width}
                      onChange={(e) => onGateAChange({ ...gateA, width: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Gate B (Backwall / Sizing)</span>
                  <input
                    type="checkbox"
                    checked={gateB.enabled}
                    onChange={(e) => onGateBChange({ ...gateB, enabled: e.target.checked })}
                    className="accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block text-[10px]">Threshold: {gateB.threshold}%</label>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={gateB.threshold}
                    onChange={(e) => onGateBChange({ ...gateB, threshold: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MENU 4: SPECIMEN & WELD */}
          {activeMenu === 'SPECIMEN' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setActiveMenu(null);
                  onOpenWeldGeometry();
                }}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Layers className="w-4 h-4" />
                <span>{isArabic ? 'فتح محرر هندسة اللحام (CAD)' : 'Weld Geometry Designer'}</span>
              </button>

              <div>
                <label className="text-slate-400 block mb-1">Plate Thickness (mm)</label>
                <input
                  type="number"
                  step={0.5}
                  value={specimen.thickness}
                  onChange={(e) => onUpdateSpecimen({ ...specimen, thickness: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bevel Angle (°)</label>
                <input
                  type="number"
                  value={specimen.bevelAngle}
                  onChange={(e) => onUpdateSpecimen({ ...specimen, bevelAngle: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Root Gap (mm)</label>
                <input
                  type="number"
                  step={0.5}
                  value={specimen.rootGap}
                  onChange={(e) => onUpdateSpecimen({ ...specimen, rootGap: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-slate-300 font-semibold mb-2">Simulated Flaws ({specimen.flaws.length}):</div>
                {specimen.flaws.map((flaw) => (
                  <div key={flaw.id} className="p-2 mb-1.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                    <div className="font-bold text-cyan-400">{flaw.name}</div>
                    <div className="text-slate-400 text-[10px]">
                      Depth: {flaw.depth}mm · Scan Y: {flaw.yPosition}mm
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MENU 5: PROBE SHORTCUT */}
          {activeMenu === 'PROBE' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">ACTIVE PROBE:</div>
                <div className="font-bold text-slate-200">{probe.name}</div>
                <div className="text-slate-400 text-[10px] mt-1">
                  {probe.frequency}MHz · {probe.elementCount} elements · pitch {probe.pitch}mm
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">ACTIVE WEDGE:</div>
                <div className="font-bold text-amber-400">{wedge.name}</div>
                <div className="text-slate-400 text-[10px] mt-1">
                  Velocity: {wedge.velocity} m/s · Delay: {params.wedgeDelay} µs
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveMenu(null);
                  onOpenProbeLink();
                }}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                {isArabic ? 'فتح استوديو ربط البروبات' : 'Open Work Probe Studio'}
              </button>
            </div>
          )}

          {/* MENU 6: CALIBRATION SHORTCUT */}
          {activeMenu === 'CAL' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                {isArabic
                  ? 'معايرة سرعة الصوت، تأخير الإسفين، وتطبيع الحساسية 80% وفق كود ASME.'
                  : 'Velocity, Wedge Delay & Sensitivity normalization wizard.'}
              </p>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  onOpenCalibration();
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                {isArabic ? 'فتح معالج المعايرة' : 'Open Calibration Wizard'}
              </button>
            </div>
          )}

          {/* MENU 7: FILE */}
          {activeMenu === 'FILE' && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveMenu(null);
                  onOpenReport();
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-slate-100 font-bold rounded-lg text-xs"
              >
                {isArabic ? 'تصدير تقرير الفحص المعتمد' : 'Generate Inspection Report'}
              </button>
              <button
                onClick={() => {
                  alert(isArabic ? 'تم حفظ ملف الإعدادات WELD_CFG.ops' : 'Saved setup file WELD_CFG.ops');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                {isArabic ? 'حفظ ملف الإعدادات (.ops)' : 'Save Setup File (.ops)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rightmost Vertical Button Column */}
      <div className="w-14 sm:w-16 bg-slate-950 border-l border-slate-800 flex flex-col items-center py-2 gap-1 select-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => toggleMenu(item.id as MenuKey)}
              className={`w-12 h-13 flex flex-col items-center justify-center rounded-lg transition-all ${
                isActive
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.color}`} />
              <span className="text-[9px] font-mono mt-1 text-center truncate max-w-[46px]">
                {item.id}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
