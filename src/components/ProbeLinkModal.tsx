/**
 * Probe Link & Work Probe Studio ("ربط واختبار بروبات العمل")
 * Interactive hardware connector pinout, element-by-element continuity test,
 * custom probe/wedge builder, and encoder link.
 */

import React, { useState } from 'react';
import {
  ProbeConfig,
  WedgeConfig,
  EncoderConfig,
  ProbeElement,
} from '../types/paut';
import { STANDARD_PROBES, STANDARD_WEDGES } from '../data/probesAndWedges';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Radio,
  Cpu,
  Layers,
  Wrench,
  Check,
  X,
} from 'lucide-react';

interface ProbeLinkModalProps {
  currentProbe: ProbeConfig;
  currentWedge: WedgeConfig;
  encoder: EncoderConfig;
  onApplyConfiguration: (probe: ProbeConfig, wedge: WedgeConfig, encoder: EncoderConfig) => void;
  onClose: () => void;
  isArabic: boolean;
}

export const ProbeLinkModal: React.FC<ProbeLinkModalProps> = ({
  currentProbe,
  currentWedge,
  encoder,
  onApplyConfiguration,
  onClose,
  isArabic,
}) => {
  const [selectedProbe, setSelectedProbe] = useState<ProbeConfig>(currentProbe);
  const [selectedWedge, setSelectedWedge] = useState<WedgeConfig>(currentWedge);
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'DIAGNOSTICS' | 'CUSTOM' | 'ENCODER'>('LIBRARY');
  const [inspectingElement, setInspectingElement] = useState<ProbeElement | null>(null);
  const [isTestingContinuity, setIsTestingContinuity] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  // Custom Probe State
  const [customProbeName, setCustomProbeName] = useState('Custom Work Probe 5L32');
  const [customFreq, setCustomFreq] = useState(5.0);
  const [customElements, setCustomElements] = useState(32);
  const [customPitch, setCustomPitch] = useState(0.6);
  const [customElevation, setCustomElevation] = useState(10.0);
  const [customSerial, setCustomSerial] = useState('PROBE-NDT-2026');

  // Run Element Continuity Diagnostic Test
  const handleRunContinuityTest = () => {
    setIsTestingContinuity(true);
    setTestComplete(false);

    setTimeout(() => {
      setIsTestingContinuity(false);
      setTestComplete(true);
    }, 1200);
  };

  // Create custom probe
  const handleCreateCustomProbe = () => {
    const newElements: ProbeElement[] = Array.from({ length: customElements }, (_, i) => ({
      id: i + 1,
      active: true,
      impedance: 50.0 + (Math.sin(i * 1.5) * 1.2),
      status: 'good',
      relativeGain: 0.0,
    }));

    const newProbe: ProbeConfig = {
      id: `CUSTOM-${customElements}EL`,
      name: customProbeName,
      type: 'PA',
      frequency: customFreq,
      elementCount: customElements,
      pitch: customPitch,
      elevation: customElevation,
      connector: 'IPEX_128',
      serialNumber: customSerial,
      elements: newElements,
    };

    setSelectedProbe(newProbe);
    setActiveTab('DIAGNOSTICS');
  };

  const deadElementsCount = selectedProbe.elements.filter((e) => e.status === 'dead').length;
  const weakElementsCount = selectedProbe.elements.filter((e) => e.status === 'weak').length;
  const goodElementsCount = selectedProbe.elements.filter((e) => e.status === 'good').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isArabic
                  ? 'منظومة ربط وتوصيل بروبات العمل (Work Probes & Transducers)'
                  : 'Work Probe & Transducer Link Studio'}
              </h2>
              <p className="text-xs text-slate-400">
                {isArabic
                  ? 'توصيل البروبات، فحص سلامة البلورات، اختيار الإسفين، ومعايرة المشفر'
                  : 'Transducer pairing, crystal pinout verification, wedge mounting & encoder setup'}
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

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-950/50 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('LIBRARY')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'LIBRARY'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'مكتبة البروبات القياسية' : 'Standard Probes & Wedges'}
          </button>
          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'DIAGNOSTICS'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'فحص سلامة بلورات البروب (Matrix)' : 'Element Matrix & Pinout Test'}
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'CUSTOM'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'إضافة بروب عمل مخصص' : 'Custom Work Probe'}
          </button>
          <button
            onClick={() => setActiveTab('ENCODER')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'ENCODER'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'مشفر الحركة (Encoder)' : 'Encoder Link'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LIBRARY */}
          {activeTab === 'LIBRARY' && (
            <div className="space-y-6">
              {/* Select Active PA Probe */}
              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  {isArabic ? '1. اختر بروب الفحص (Phased Array Probe):' : '1. Select Phased Array Probe:'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STANDARD_PROBES.map((p) => {
                    const isSelected = selectedProbe.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProbe(p)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-sm'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-100">{p.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                              SN: {p.serialNumber} · {p.connector}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-cyan-500 text-slate-950 font-bold rounded text-[10px]">
                              {isArabic ? 'موصول' : 'CONNECTED'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px]">FREQ:</span>
                            <span className="text-slate-200">{p.frequency} MHz</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">ELEMENTS:</span>
                            <span className="text-slate-200">{p.elementCount}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">PITCH:</span>
                            <span className="text-slate-200">{p.pitch} mm</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Select Active Wedge */}
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  {isArabic ? '2. اختر إسفين التوجيه (Ultrasonic Wedge):' : '2. Select Ultrasonic Wedge:'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STANDARD_WEDGES.map((w) => {
                    const isSelected = selectedWedge.id === w.id;
                    return (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWedge(w)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-400 shadow-sm'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-100">{w.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-1">
                              Angle: {w.nominalAngle}° {w.waveType} in Steel
                            </div>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[10px]">
                              {isArabic ? 'مثبت' : 'MOUNTED'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px]">VELOCITY:</span>
                            <span className="text-slate-200">{w.velocity} m/s</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">H1 (HEIGHT):</span>
                            <span className="text-slate-200">{w.heightFirstElement} mm</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">OFFSET:</span>
                            <span className="text-slate-200">{w.indexOffset} mm</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIAGNOSTICS */}
          {activeTab === 'DIAGNOSTICS' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {selectedProbe.name} — IPEX 128 Connector Status
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono mt-1 text-slate-400">
                    <span>
                      Total: <b className="text-slate-200">{selectedProbe.elementCount}</b>
                    </span>
                    <span>
                      Good: <b className="text-emerald-400">{goodElementsCount}</b>
                    </span>
                    <span>
                      Weak: <b className="text-amber-400">{weakElementsCount}</b>
                    </span>
                    <span>
                      Dead: <b className="text-rose-400">{deadElementsCount}</b>
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRunContinuityTest}
                  disabled={isTestingContinuity}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${isTestingContinuity ? 'animate-spin' : ''}`} />
                  {isTestingContinuity
                    ? isArabic
                      ? 'جاري فحص البلورات...'
                      : 'Testing Channels...'
                    : isArabic
                      ? 'تشغيل فحص الاستمرارية والممانعة'
                      : 'Run Continuity & Impedance Test'}
                </button>
              </div>

              {testComplete && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isArabic
                      ? `تم فحص جميع عناصر البروب. تم تأكيد سلامة ${goodElementsCount} بلورة وتوافق الممانعة 50 أوم.`
                      : `Diagnostic complete: ${goodElementsCount} active crystals verified, impedance matched at 50 Ω.`}
                  </span>
                </div>
              )}

              {/* Element Matrix Grid */}
              <div>
                <div className="text-xs text-slate-400 font-mono mb-2">
                  {isArabic
                    ? 'مصفوفة بلورات البروب (اضغط على أي عنصر للاطلاع على ممانعته الكهربائية):'
                    : 'Transducer Element Matrix (Click element to view electrical impedance):'}
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-3 bg-slate-950 rounded-lg border border-slate-800">
                  {selectedProbe.elements.map((elem) => {
                    const isGood = elem.status === 'good';
                    const isWeak = elem.status === 'weak';
                    const isDead = elem.status === 'dead';

                    return (
                      <button
                        key={elem.id}
                        onClick={() => setInspectingElement(elem)}
                        className={`h-9 flex flex-col items-center justify-center rounded text-[10px] font-mono transition-transform active:scale-95 border ${
                          isDead
                            ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                            : isWeak
                              ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                              : 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:border-emerald-400'
                        }`}
                        title={`Element #${elem.id} (${elem.impedance.toFixed(1)} Ω)`}
                      >
                        <span className="font-bold">{elem.id}</span>
                        <span className="text-[8px] opacity-75">{elem.impedance.toFixed(0)}Ω</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Element Detail Drawer */}
              {inspectingElement && (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-cyan-400">
                      Element #{inspectingElement.id} Details:
                    </span>
                    <span>Status: <b className="text-slate-200">{inspectingElement.status.toUpperCase()}</b></span>
                    <span>Impedance: <b className="text-slate-200">{inspectingElement.impedance.toFixed(1)} Ω</b></span>
                    <span>Gain Norm: <b className="text-slate-200">{inspectingElement.relativeGain} dB</b></span>
                  </div>
                  <button
                    onClick={() => setInspectingElement(null)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM PROBE */}
          {activeTab === 'CUSTOM' && (
            <div className="space-y-4 max-w-2xl">
              <div className="text-sm font-semibold text-slate-200">
                {isArabic ? 'تعريف وتوصيل بروب عمل جديد' : 'Configure New Work Probe Transducer'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Probe Model Name</label>
                  <input
                    type="text"
                    value={customProbeName}
                    onChange={(e) => setCustomProbeName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Serial Number (SN)</label>
                  <input
                    type="text"
                    value={customSerial}
                    onChange={(e) => setCustomSerial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Frequency (MHz)</label>
                  <input
                    type="number"
                    step={0.25}
                    value={customFreq}
                    onChange={(e) => setCustomFreq(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Element Count</label>
                  <select
                    value={customElements}
                    onChange={(e) => setCustomElements(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value={16}>16 Elements</option>
                    <option value={32}>32 Elements</option>
                    <option value={64}>64 Elements</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Pitch (mm)</label>
                  <input
                    type="number"
                    step={0.05}
                    value={customPitch}
                    onChange={(e) => setCustomPitch(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Elevation (mm)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={customElevation}
                    onChange={(e) => setCustomElevation(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCreateCustomProbe}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isArabic ? 'إنشاء البروب وتوصيله فوراً' : 'Create & Link Transducer'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ENCODER */}
          {activeTab === 'ENCODER' && (
            <div className="space-y-4 max-w-2xl text-xs font-mono">
              <div className="text-sm font-semibold text-slate-200">
                {isArabic ? 'منفذ مشفر الحركة الميداني (Encoder Port)' : 'Field Motion Encoder Port'}
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">CONNECTED (15-Pin Mini-DIN)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Encoder Model:</span>
                  <span className="text-slate-200">Olympus Mini-Wheel Encoder (ENC1-MW-5M)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="text-cyan-400 font-bold">12.00 pulses / mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scan Axis:</span>
                  <span className="text-slate-200">Axis 1 (Scan Length Y)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Position:</span>
                  <span className="text-amber-400 font-bold">{encoder.currentPosition.toFixed(1)} mm</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            Active: <span className="text-cyan-400 font-semibold">{selectedProbe.name}</span> +{' '}
            <span className="text-amber-400 font-semibold">{selectedWedge.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                onApplyConfiguration(selectedProbe, selectedWedge, encoder);
                onClose();
              }}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              {isArabic ? 'تأكيد وربط البروب مع الجهاز' : 'Bind & Link to OmniScan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
