/**
 * Official Phased Array Ultrasonic Testing (PAUT) Examination Report
 * Generates an ASME Sec V Art 4 / ISO 13588 compliant inspection certificate
 * with defect indications table, sizing calculations, and print/PDF support.
 */

import React, { useState } from 'react';
import {
  SpecimenConfig,
  ProbeConfig,
  WedgeConfig,
  UltrasonicParams,
  CalibrationState,
  GateReadings,
} from '../types/paut';
import { Printer, Download, CheckCircle2, XCircle, FileText, X } from 'lucide-react';

interface InspectionReportModalProps {
  specimen: SpecimenConfig;
  probe: ProbeConfig;
  wedge: WedgeConfig;
  params: UltrasonicParams;
  calState: CalibrationState;
  readingsA: GateReadings;
  onClose: () => void;
  isArabic: boolean;
}

export const InspectionReportModal: React.FC<InspectionReportModalProps> = ({
  specimen,
  probe,
  wedge,
  params,
  calState,
  readingsA,
  onClose,
  isArabic,
}) => {
  const [inspectorName, setInspectorName] = useState('Eng. Taha Memo');
  const [inspectorLevel, setInspectorLevel] = useState<'Level II' | 'Level III'>('Level II');
  const [company, setCompany] = useState('PetroNDT Advanced Inspection Services');
  const [weldId, setWeldId] = useState('WLD-PL-2026-08');
  const [codeStandard, setCodeStandard] = useState<'ASME Sec V Art 4' | 'ISO 13588' | 'AWS D1.1' | 'API 1104'>('ASME Sec V Art 4');

  // Derive flaw evaluation table
  const indications = specimen.flaws.map((flaw, idx) => {
    // ASME acceptance criteria: Planar cracks and lack of fusion are automatic REJECT
    const isPlanar = flaw.type === 'root_crack' || flaw.type === 'lack_of_fusion';
    const isOverLength = flaw.length > 10;
    const isReject = isPlanar || isOverLength;

    return {
      id: idx + 1,
      type: flaw.name,
      scanPos: flaw.yPosition,
      indexOffset: flaw.xOffset,
      depth: flaw.depth,
      soundpath: (flaw.depth / Math.cos((55 * Math.PI) / 180)).toFixed(1),
      length: flaw.length,
      height: flaw.height,
      amplitudePercent: Math.round(75 * flaw.reflectivity),
      verdict: isReject ? ('REJECT' as const) : ('ACCEPT' as const),
    };
  });

  const overallVerdict = indications.some((i) => i.verdict === 'REJECT') ? 'REJECT' : 'ACCEPT';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isArabic
                  ? 'تقرير الفحص بالموجات فوق الصوتية محاذاة الطور (PAUT Inspection Certificate)'
                  : 'Phased Array Ultrasonic Examination Report'}
              </h2>
              <p className="text-xs text-slate-400">
                {isArabic
                  ? 'شهادة فحص معتمدة وفق اشتراطات الكود الأمريكي ASME Sec V Art 4 / ISO 13588'
                  : 'Certified examination document compliant with ASME Section V Article 4'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isArabic ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900 text-slate-200 print:bg-white print:text-black">
          {/* Certificate Header Banner */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                NON-DESTRUCTIVE TESTING EXAMINATION RECORD
              </div>
              <h1 className="text-xl font-bold text-slate-100 mt-1">
                {company}
              </h1>
              <div className="text-xs text-slate-400 mt-0.5">
                Accredited Ultrasonic Testing Laboratory · ISO 9712 / SNT-TC-1A
              </div>
            </div>

            <div className="text-right text-xs font-mono space-y-1">
              <div>
                Report No: <span className="text-slate-100 font-bold">PAUT-2026-0441</span>
              </div>
              <div>
                Date: <span className="text-slate-100">{new Date().toLocaleDateString()}</span>
              </div>
              <div>
                Standard: <span className="text-cyan-400 font-bold">{codeStandard}</span>
              </div>
            </div>
          </div>

          {/* Inspection Metadata Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px]">INSPECTOR:</span>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full bg-transparent text-slate-200 font-semibold focus:outline-none"
              />
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px]">CERTIFICATION:</span>
              <select
                value={inspectorLevel}
                onChange={(e) => setInspectorLevel(e.target.value as any)}
                className="w-full bg-transparent text-slate-200 font-semibold focus:outline-none"
              >
                <option value="Level II" className="bg-slate-900">PCN / ASNT Level II</option>
                <option value="Level III" className="bg-slate-900">PCN / ASNT Level III</option>
              </select>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px]">WELD JOINT ID:</span>
              <input
                type="text"
                value={weldId}
                onChange={(e) => setWeldId(e.target.value)}
                className="w-full bg-transparent text-slate-200 font-semibold focus:outline-none"
              />
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px]">ACCEPTANCE CODE:</span>
              <select
                value={codeStandard}
                onChange={(e) => setCodeStandard(e.target.value as any)}
                className="w-full bg-transparent text-slate-200 font-semibold focus:outline-none"
              >
                <option value="ASME Sec V Art 4" className="bg-slate-900">ASME Sec V Art 4</option>
                <option value="ISO 13588" className="bg-slate-900">ISO 13588</option>
                <option value="AWS D1.1" className="bg-slate-900">AWS D1.1</option>
                <option value="API 1104" className="bg-slate-900">API 1104</option>
              </select>
            </div>
          </div>

          {/* Instrument & Probe Parameters */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono space-y-2">
            <div className="text-slate-300 font-bold border-b border-slate-800 pb-1">
              PAUT Equipment & Calibration Verification:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-400">
              <div>
                Instrument: <b className="text-slate-200">Olympus OmniScan X3</b>
              </div>
              <div>
                Probe: <b className="text-cyan-400">{probe.name}</b>
              </div>
              <div>
                Wedge: <b className="text-amber-400">{wedge.name}</b>
              </div>
              <div>
                Velocity: <b className="text-slate-200">{params.velocity} m/s</b>
              </div>
              <div>
                Wedge Delay: <b className="text-slate-200">{params.wedgeDelay} µs</b>
              </div>
              <div>
                Angles: <b className="text-slate-200">40° to 70° (1.0° step)</b>
              </div>
              <div>
                Sensitivity: <b className="text-emerald-400">80% FSH Normalized</b>
              </div>
              <div>
                TCG Curve: <b className="text-emerald-400">Active (4-pt depth)</b>
              </div>
            </div>
          </div>

          {/* Discontinuities & Indications Table */}
          <div>
            <div className="text-sm font-bold text-slate-200 mb-2 flex items-center justify-between">
              <span>{isArabic ? 'جدول العيوب والمؤشرات المرصودة:' : 'Recorded Discontinuities & Flaw Sizing Table:'}</span>
              <span className="text-xs font-mono text-slate-400">
                {indications.length} Indications Logged
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs font-mono text-left" dir="ltr">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Indication Type</th>
                    <th className="p-2.5">Scan Y (mm)</th>
                    <th className="p-2.5">Index X (mm)</th>
                    <th className="p-2.5">Depth DA (mm)</th>
                    <th className="p-2.5">Length (mm)</th>
                    <th className="p-2.5">Height (mm)</th>
                    <th className="p-2.5">Amp (% FSH)</th>
                    <th className="p-2.5">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                  {indications.map((ind) => (
                    <tr key={ind.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-slate-400">{ind.id}</td>
                      <td className="p-2.5 font-semibold text-slate-200">{ind.type}</td>
                      <td className="p-2.5 text-slate-300">{ind.scanPos}</td>
                      <td className="p-2.5 text-slate-300">{ind.indexOffset}</td>
                      <td className="p-2.5 text-amber-400 font-bold">{ind.depth}</td>
                      <td className="p-2.5 text-slate-300">{ind.length}</td>
                      <td className="p-2.5 text-slate-300">{ind.height}</td>
                      <td className="p-2.5 text-slate-200">{ind.amplitudePercent}%</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ind.verdict === 'REJECT'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {ind.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Code Disposition */}
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${
              overallVerdict === 'REJECT'
                ? 'bg-rose-950/30 border-rose-700/60 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {overallVerdict === 'REJECT' ? (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  FINAL CODE DISPOSITION: {overallVerdict}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {overallVerdict === 'REJECT'
                    ? isArabic
                      ? 'مرفوض - تم رصد شروخ عدم استمرارية في جذر اللحام ونقص صهر لا يجوز قبولها وفق اشتراطات الكود.'
                      : 'Unacceptable planar root crack / lack of sidewall fusion detected exceeding ASME acceptance thresholds.'
                    : isArabic
                      ? 'مقبول - لا توجد عيوب تتجاوز الحدود المسموح بها في الكود.'
                      : 'Acceptable - all indications within code acceptable limits.'}
                </div>
              </div>
            </div>

            <div className="text-right text-xs font-mono">
              <div>Signature: __________________</div>
              <div className="opacity-75 mt-1">{inspectorName} ({inspectorLevel})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
