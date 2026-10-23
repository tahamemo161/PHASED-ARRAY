/**
 * OmniScan Calibration Wizard Modal
 * Step-by-step calibration of Velocity, Wedge Delay, Sensitivity (80% FSH),
 * TCG (Time-Corrected Gain), and Encoder resolution according to ASME Sec V / ISO standards.
 */

import React, { useState } from 'react';
import {
  CalibrationState,
  UltrasonicParams,
  FocalLawConfig,
  SpecimenConfig,
} from '../types/paut';
import { TcgCurveVisualizer, TcgPoint } from './TcgCurveVisualizer';
import {
  CheckCircle2,
  Gauge,
  Sliders,
  TrendingUp,
  Activity,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Plus,
} from 'lucide-react';

interface CalibrationModalProps {
  params: UltrasonicParams;
  onUpdateParams: (params: UltrasonicParams) => void;
  focalLaws: FocalLawConfig;
  specimen: SpecimenConfig;
  calState: CalibrationState;
  onUpdateCalState: (state: CalibrationState) => void;
  onClose: () => void;
  isArabic: boolean;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  params,
  onUpdateParams,
  focalLaws,
  specimen,
  calState,
  onUpdateCalState,
  onClose,
  isArabic,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [calibrating, setCalibrating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calibration target inputs
  const [refThickness, setRefThickness] = useState(25.0);
  const [targetFSH, setTargetFSH] = useState(80);

  const runVelocityCal = () => {
    setCalibrating(true);
    setSuccessMessage(null);
    setTimeout(() => {
      setCalibrating(false);
      onUpdateParams({
        ...params,
        velocity: 3240, // Perfect calibrated shear wave velocity in carbon steel
      });
      onUpdateCalState({
        ...calState,
        velocityCalibrated: true,
        velocityRefThickness: refThickness,
      });
      setSuccessMessage(
        isArabic
          ? 'تم حساب سرعة الصوت بدقة: 3240 م/ث (موجات قصية Shear Wave)'
          : 'Velocity calibrated successfully: 3240 m/s (Transverse/Shear wave)'
      );
    }, 900);
  };

  const runWedgeDelayCal = () => {
    setCalibrating(true);
    setSuccessMessage(null);
    setTimeout(() => {
      setCalibrating(false);
      onUpdateParams({
        ...params,
        wedgeDelay: 4.82, // µs
      });
      onUpdateCalState({
        ...calState,
        wedgeDelayCalibrated: true,
      });
      setSuccessMessage(
        isArabic
          ? 'تمت معايرة تأخير الإسفين لكافة الزوايا: 4.82 µs'
          : 'Wedge delay zero-offset calibrated across all angles: 4.82 µs'
      );
    }, 900);
  };

  const runSensitivityCal = () => {
    setCalibrating(true);
    setSuccessMessage(null);
    setTimeout(() => {
      setCalibrating(false);
      onUpdateParams({
        ...params,
        gain: 34.5, // Normalized gain for 80% FSH on reference reflector
      });
      onUpdateCalState({
        ...calState,
        sensitivityCalibrated: true,
      });
      setSuccessMessage(
        isArabic
          ? 'تم تطبيع الحساسية عبر جميع الزوايا لتثبيت الذروة عند 80% FSH'
          : 'Sensitivity normalized across all sectorial angles to 80% FSH reference'
      );
    }, 900);
  };

  const runTcgCal = () => {
    setCalibrating(true);
    setSuccessMessage(null);
    setTimeout(() => {
      setCalibrating(false);
      onUpdateCalState({
        ...calState,
        tcgCalibrated: true,
        tcgPoints: [
          { depth: 10, gainOffset: 0.0 },
          { depth: 20, gainOffset: 3.2 },
          { depth: 30, gainOffset: 6.8 },
          { depth: 40, gainOffset: 10.5 },
          { depth: 50, gainOffset: 14.2 },
        ],
      });
      setSuccessMessage(
        isArabic
          ? 'تم رسم وتفعيل منحنى TCG المعوض عن التخميد عبر كافة الأعماق بنجاح'
          : 'TCG curve calibrated successfully (5-point depth compensation curve active)'
      );
    }, 800);
  };

  const handleUpdateTcgPoints = (newPts: TcgPoint[]) => {
    onUpdateCalState({
      ...calState,
      tcgPoints: newPts,
      tcgCalibrated: true,
    });
  };

  const handleAdjustPointGain = (index: number, delta: number) => {
    const updated = [...calState.tcgPoints];
    if (updated[index]) {
      const newGain = Math.max(0, Math.min(24, Number((updated[index].gainOffset + delta).toFixed(1))));
      updated[index] = { ...updated[index], gainOffset: newGain };
      handleUpdateTcgPoints(updated);
    }
  };

  const runEncoderCal = () => {
    setCalibrating(true);
    setSuccessMessage(null);
    setTimeout(() => {
      setCalibrating(false);
      onUpdateCalState({
        ...calState,
        encoderCalibrated: true,
      });
      setSuccessMessage(
        isArabic
          ? 'تمت معايرة دقة المشفر بنجاح: 12.0 نبضة/مم'
          : 'Encoder resolution verified: 12.00 pulses/mm'
      );
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden text-slate-100"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isArabic
                  ? 'معالج معايرة جهاز OmniScan المعتمد (Calibration Wizard)'
                  : 'OmniScan Guided Calibration Wizard'}
              </h2>
              <p className="text-xs text-slate-400">
                {isArabic
                  ? 'معايرة سرعة الصوت، تأخير الإسفين، الحساسية، ومنحنى TCG/DAC'
                  : 'Velocity, Wedge Delay, Sensitivity (80% FSH) & TCG normalization'}
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

        {/* Steps Ribbon */}
        <div className="grid grid-cols-5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono">
          {[
            { id: 1, label: isArabic ? '1. السرعة' : '1. Velocity', done: calState.velocityCalibrated },
            { id: 2, label: isArabic ? '2. الإسفين' : '2. Wedge Delay', done: calState.wedgeDelayCalibrated },
            { id: 3, label: isArabic ? '3. الحساسية' : '3. Sensitivity', done: calState.sensitivityCalibrated },
            { id: 4, label: isArabic ? '4. منحنى TCG' : '4. TCG Curve', done: calState.tcgCalibrated },
            { id: 5, label: isArabic ? '5. المشفر' : '5. Encoder', done: calState.encoderCalibrated },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setActiveStep(st.id);
                setSuccessMessage(null);
              }}
              className={`p-2.5 flex items-center justify-center gap-1.5 border-b-2 font-medium transition-colors ${
                activeStep === st.id
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                  : st.done
                    ? 'border-emerald-800/60 text-slate-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {st.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
              )}
              <span className="truncate">{st.label}</span>
            </button>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-6">
          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: VELOCITY */}
          {activeStep === 1 && (
            <div className="space-y-4 text-xs font-mono">
              <div className="text-sm font-semibold text-slate-200">
                {isArabic
                  ? 'معايرة سرعة انتشار الموجات الصوتية في المعدن (Velocity Calibration)'
                  : 'Sound Velocity Calibration (Calibration Block V1 / V2)'}
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                {isArabic
                  ? 'ضع البروب على بلوك المعايرة V1 (نصف قطر 100 مم) أو كتلة معروفة السماكة. يقوم الجهاز بحساب سرعة الصوت الحقيقية تلقائياً من خلال قياس الفارق الزمني بين الصدى الأول والثاني.'
                  : 'Couple probe onto standard V1 block (100mm radius) or known step block. The OmniScan calculates exact material velocity from dual-echo time-of-flight.'}
              </p>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {isArabic ? 'سماكة البلوك المرجعي (مم)' : 'Reference Thickness (mm)'}
                  </label>
                  <input
                    type="number"
                    value={refThickness}
                    onChange={(e) => setRefThickness(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    {isArabic ? 'السرعة الحالية المحسوبة' : 'Current Velocity'}
                  </label>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-cyan-400 font-bold">
                    {params.velocity} m/s
                  </div>
                </div>
              </div>

              <button
                onClick={runVelocityCal}
                disabled={calibrating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${calibrating ? 'animate-spin' : ''}`} />
                {calibrating
                  ? isArabic
                    ? 'جاري التقاط الصدى وحساب السرعة...'
                    : 'Measuring TOF & Velocity...'
                  : isArabic
                    ? 'بدء المعايرة التلقائية للسرعة'
                    : 'Auto Calibrate Velocity'}
              </button>
            </div>
          )}

          {/* STEP 2: WEDGE DELAY */}
          {activeStep === 2 && (
            <div className="space-y-4 text-xs font-mono">
              <div className="text-sm font-semibold text-slate-200">
                {isArabic
                  ? 'معايرة زمن تأخير الإسفين ونقطة الصفر (Wedge Delay Calibration)'
                  : 'Wedge Delay & Zero-Point Offset Calibration'}
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                {isArabic
                  ? 'يقوم بمعايرة الفارق الزمني لصوت الإسفين عبر جميع زوايا الفحص (من 40° إلى 70°) لضمان دقة قياس العمق الحقيقي والمسار الصوتي.'
                  : 'Calibrates transit time through the wedge across all focal laws (40° to 70°) to ensure exact true depth and soundpath measurement.'}
              </p>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">Wedge Delay (Zero Offset):</span>
                  <span className="text-lg font-bold text-amber-400">{params.wedgeDelay} µs</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Status:</span>
                  <span className={calState.wedgeDelayCalibrated ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {calState.wedgeDelayCalibrated ? 'CALIBRATED' : 'UNVERIFIED'}
                  </span>
                </div>
              </div>

              <button
                onClick={runWedgeDelayCal}
                disabled={calibrating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${calibrating ? 'animate-spin' : ''}`} />
                {calibrating
                  ? isArabic
                    ? 'جاري موازنة تأخير الإسفين لكافة الزوايا...'
                    : 'Balancing Wedge Angles...'
                  : isArabic
                    ? 'معايرة تأخير الإسفين'
                    : 'Calibrate Wedge Delay'}
              </button>
            </div>
          )}

          {/* STEP 3: SENSITIVITY */}
          {activeStep === 3 && (
            <div className="space-y-4 text-xs font-mono">
              <div className="text-sm font-semibold text-slate-200">
                {isArabic
                  ? 'معايرة الحساسية وتطبيع السعة (Sensitivity Calibration - 80% FSH)'
                  : 'Sensitivity Calibration & Normalization (80% FSH)'}
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                {isArabic
                  ? 'تطبيع سعة الإشارة عبر جميع الحزم الزاوية للوصول إلى 80% من ارتفاع الشاشة وفق متطلبات ASME Section V Article 4.'
                  : 'Normalizes echo amplitude across all angular beams to 80% Full Screen Height on reference SDH according to ASME Section V.'}
              </p>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <label className="text-slate-400 block mb-1">Target FSH (%)</label>
                  <input
                    type="number"
                    value={targetFSH}
                    onChange={(e) => setTargetFSH(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">System Gain</label>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-cyan-400 font-bold">
                    {params.gain.toFixed(1)} dB
                  </div>
                </div>
              </div>

              <button
                onClick={runSensitivityCal}
                disabled={calibrating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${calibrating ? 'animate-spin' : ''}`} />
                {calibrating
                  ? isArabic
                    ? 'جاري ضبط الكسب وتطبيع الحساسية...'
                    : 'Normalizing 80% FSH...'
                  : isArabic
                    ? 'تطبيع الحساسية إلى 80% FSH'
                    : 'Normalize Sensitivity to 80%'}
              </button>
            </div>
          )}

          {/* STEP 4: TCG (Time Corrected Gain) */}
          {activeStep === 4 && (
            <div className="space-y-4 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {isArabic
                      ? 'معايرة منحنى تعويض الكسب بالعمق (TCG / DAC Curve Visualizer)'
                      : 'Time Corrected Gain (TCG / DAC Curve Visualizer)'}
                  </div>
                  <p className="text-slate-400 text-xs font-sans mt-0.5">
                    {isArabic
                      ? 'يعوض المنحنى عن التخميد الصوتي وتشتت الحزمة بحيث تعطي عيوب الـ SDH نفس السعة 80% FSH على كافة الأعماق.'
                      : 'Compensates for acoustic attenuation and beam spreading so equal-sized reflectors return 80% FSH across all depths.'}
                  </p>
                </div>

                <button
                  onClick={runTcgCal}
                  disabled={calibrating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  <TrendingUp className={`w-4 h-4 ${calibrating ? 'animate-spin' : ''}`} />
                  {calibrating
                    ? isArabic
                      ? 'جاري رسم المنحنى...'
                      : 'Normalizing Points...'
                    : isArabic
                      ? 'إعادة رسم وتطبيق منحنى TCG'
                      : 'Regenerate TCG Curve'}
                </button>
              </div>

              {/* Visual Interactive TVG / TCG Line Chart & Drag Editor */}
              <TcgCurveVisualizer
                points={calState.tcgPoints}
                onPointsChange={handleUpdateTcgPoints}
                maxDepth={Math.max(50, Math.ceil(specimen.thickness * 1.5))}
                maxGain={24}
                specimenThickness={specimen.thickness}
                isArabic={isArabic}
              />

              {/* Point Gain Fine-Tuning Strip */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
                  <span>{isArabic ? 'الضبط الدقيق لكسب النقاط (+/- 0.5 dB):' : 'Fine-Tune Calibration Points (+/- 0.5 dB):'}</span>
                  <span className="text-cyan-400 font-mono text-[10px]">
                    {calState.tcgCalibrated ? (isArabic ? 'المنحنى نشط ومفعل' : 'TCG ACTIVE') : 'UNCALIBRATED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {calState.tcgPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between sm:flex-col sm:items-start gap-1"
                    >
                      <div className="text-[10px] text-slate-400">
                        {pt.depth}mm Depth
                      </div>
                      <div className="flex items-center gap-1.5 w-full justify-between sm:justify-start">
                        <button
                          onClick={() => handleAdjustPointGain(idx, -0.5)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-xs"
                          title="Decrease 0.5 dB"
                        >
                          -
                        </button>
                        <span className="font-bold text-cyan-400 tabular-nums text-xs">
                          +{pt.gainOffset.toFixed(1)}
                        </span>
                        <button
                          onClick={() => handleAdjustPointGain(idx, +0.5)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 text-xs"
                          title="Increase 0.5 dB"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ENCODER */}
          {activeStep === 5 && (
            <div className="space-y-4 text-xs font-mono">
              <div className="text-sm font-semibold text-slate-200">
                {isArabic
                  ? 'معايرة مشفر الحركة والمسح الآلي (Encoder Calibration)'
                  : 'Motion Scanner Encoder Calibration'}
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                {isArabic
                  ? 'دحرجة المشفر لمسافة 100 مم محددة لتأكيد دقة عدد النبضات وتفادي أي خطأ في تحديد موقع العيب على طول اللحام.'
                  : 'Roll scanner across known 100mm distance to verify pulse counter precision for accurate flaw location along weld seam.'}
              </p>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">Encoder Resolution:</span>
                  <span className="text-lg font-bold text-emerald-400">12.00 pulses / mm</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Scan Accuracy:</span>
                  <span className="text-slate-200 font-bold">±0.08 mm</span>
                </div>
              </div>

              <button
                onClick={runEncoderCal}
                disabled={calibrating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${calibrating ? 'animate-spin' : ''}`} />
                {calibrating
                  ? isArabic
                    ? 'جاري فحص نبضات المشفر...'
                    : 'Verifying Pulses...'
                  : isArabic
                    ? 'معايرة المشفر'
                    : 'Verify Encoder'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            {calState.velocityCalibrated &&
            calState.wedgeDelayCalibrated &&
            calState.sensitivityCalibrated ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {isArabic ? 'جاهز للفحص وفق الكود' : 'ASME Sec V Ready'}
              </span>
            ) : (
              <span className="text-amber-400 font-bold">
                {isArabic ? 'المعايرة قيد الاكتمال' : 'Calibration In Progress'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeStep < 5 ? (
              <button
                onClick={() => {
                  setActiveStep((s) => s + 1);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg flex items-center gap-1.5"
              >
                <span>{isArabic ? 'الخطوة التالية' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono rounded-lg"
              >
                {isArabic ? 'إنهاء المعايرة والعودة' : 'Finish & Exit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
