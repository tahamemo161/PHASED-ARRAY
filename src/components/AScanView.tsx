/**
 * A-Scan (Amplitude-Time Waveform) Canvas View
 * Realistic OmniScan A-Scan with calibrated 0-100% FSH graticule,
 * Gate A (Red), Gate B (Green), peak tracking indicator, RF/Rectified switch,
 * and direct touch-draggable gate handles.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  UltrasonicParams,
  FocalLawConfig,
  SpecimenConfig,
  WedgeConfig,
  GateConfig,
  GateReadings,
  DgsConfig,
  CalibrationState,
} from '../types/paut';
import {
  generateAScanTrace,
  evaluateGate,
  calculateNearField,
  calculateDgsCurveAmplitude,
  evaluateDgsFlawSizing,
} from '../utils/physics';

interface AScanViewProps {
  params: UltrasonicParams;
  focalLaws: FocalLawConfig;
  specimen: SpecimenConfig;
  wedge: WedgeConfig;
  activeAngle: number;
  probeIndexX: number;
  scanPosY: number;
  gateA: GateConfig;
  onGateAChange: (gate: GateConfig) => void;
  gateB: GateConfig;
  onGateBChange: (gate: GateConfig) => void;
  onReadingsUpdate: (readingsA: GateReadings, readingsB: GateReadings) => void;
  isArabic: boolean;
  frozen: boolean;
  calState?: CalibrationState;
}

export const AScanView: React.FC<AScanViewProps> = ({
  params,
  focalLaws,
  specimen,
  wedge,
  activeAngle,
  probeIndexX,
  scanPosY,
  gateA,
  onGateAChange,
  gateB,
  onGateBChange,
  onReadingsUpdate,
  isArabic,
  frozen,
  calState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<
    'GATE_A_THRESH' | 'GATE_A_START' | 'GATE_A_WIDTH' | null
  >(null);

  // Generate trace with useMemo so it remains referentially stable
  const trace = useMemo(
    () =>
      generateAScanTrace(
        activeAngle,
        params,
        focalLaws,
        specimen,
        wedge,
        probeIndexX,
        scanPosY,
        512,
        calState
      ),
    [
      activeAngle,
      params,
      focalLaws,
      specimen,
      wedge,
      probeIndexX,
      scanPosY,
      calState,
    ]
  );

  // Evaluate gates with useMemo
  const readingsA = useMemo(
    () =>
      evaluateGate(
        gateA,
        trace.samples,
        trace.soundpaths,
        activeAngle,
        specimen.thickness,
        wedge.indexOffset * 0.3
      ),
    [
      gateA,
      trace.samples,
      trace.soundpaths,
      activeAngle,
      specimen.thickness,
      wedge.indexOffset,
    ]
  );

  const readingsB = useMemo(
    () =>
      evaluateGate(
        gateB,
        trace.samples,
        trace.soundpaths,
        activeAngle,
        specimen.thickness,
        wedge.indexOffset * 0.3
      ),
    [
      gateB,
      trace.samples,
      trace.soundpaths,
      activeAngle,
      specimen.thickness,
      wedge.indexOffset,
    ]
  );

  // DGS (Distance-Gain-Size / AVG) Configuration State
  const [dgsConfig, setDgsConfig] = useState<DgsConfig>({
    enabled: true,
    nominalDiameter: 9.6, // mm effective array aperture (16 * 0.6mm)
    frequency: 5.0, // MHz
    referenceType: 'FBH',
    referenceSize: 2.0, // mm reference Flat Bottom Hole
    showWarningCurve: true,
    acceptanceLimitMm: 2.5, // mm reject threshold
  });

  // Calculate near field length N
  const nearField = useMemo(
    () =>
      calculateNearField(
        dgsConfig.nominalDiameter,
        dgsConfig.frequency,
        params.velocity
      ),
    [dgsConfig.nominalDiameter, dgsConfig.frequency, params.velocity]
  );

  // Evaluate automated DGS flaw sizing on Gate A peak
  const dgsEval = useMemo(
    () =>
      evaluateDgsFlawSizing(
        readingsA.peakAmplitude,
        readingsA.soundpath,
        dgsConfig,
        nearField
      ),
    [readingsA.peakAmplitude, readingsA.soundpath, dgsConfig, nearField]
  );

  // Peak Hold (Maximum Amplitude Signal Trace) State
  const [peakHoldEnabled, setPeakHoldEnabled] = useState<boolean>(true);
  const [peakHoldMode, setPeakHoldMode] = useState<'INFINITE' | 'DECAY'>('INFINITE');
  const [resetKey, setResetKey] = useState<number>(0);
  const peakSamplesRef = useRef<number[]>([]);

  // Synchronously compute and maintain peak hold buffer and apex coordinates
  const peakHoldMax = useMemo(() => {
    if (!peakHoldEnabled) {
      peakSamplesRef.current = [];
      return { amp: 0, soundpath: 0 };
    }

    if (frozen && peakSamplesRef.current.length > 0) {
      let maxA = 0;
      let maxS = 0;
      for (let i = 0; i < peakSamplesRef.current.length; i++) {
        if (peakSamplesRef.current[i] > maxA) {
          maxA = peakSamplesRef.current[i];
          maxS = trace.soundpaths[i] ?? 0;
        }
      }
      return { amp: maxA, soundpath: maxS };
    }

    const currentSamples = trace.samples;
    const numSamples = currentSamples.length;

    if (peakSamplesRef.current.length !== numSamples) {
      peakSamplesRef.current = [...currentSamples];
    } else {
      const peakArr = peakSamplesRef.current;
      for (let i = 0; i < numSamples; i++) {
        const cur = currentSamples[i];
        if (peakHoldMode === 'DECAY') {
          peakArr[i] = Math.max(cur, peakArr[i] * 0.995);
        } else {
          peakArr[i] = Math.max(peakArr[i], cur);
        }
      }
    }

    let maxA = 0;
    let maxS = 0;
    const arr = peakSamplesRef.current;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] > maxA) {
        maxA = arr[i];
        maxS = trace.soundpaths[i] ?? 0;
      }
    }

    return { amp: maxA, soundpath: maxS };
  }, [trace, peakHoldEnabled, peakHoldMode, resetKey, frozen]);

  const resetPeakHold = useCallback(() => {
    peakSamplesRef.current = [...trace.samples];
    setResetKey((k) => k + 1);
  }, [trace.samples]);

  // Keep Gate readings updated in parent with previous value threshold check
  const lastReadingsRef = useRef<{ aAmp: number; aPath: number; bAmp: number }>({ aAmp: -1, aPath: -1, bAmp: -1 });
  useEffect(() => {
    if (
      Math.abs(lastReadingsRef.current.aAmp - readingsA.peakAmplitude) > 0.05 ||
      Math.abs(lastReadingsRef.current.aPath - readingsA.soundpath) > 0.05 ||
      Math.abs(lastReadingsRef.current.bAmp - readingsB.peakAmplitude) > 0.05
    ) {
      lastReadingsRef.current = {
        aAmp: readingsA.peakAmplitude,
        aPath: readingsA.soundpath,
        bAmp: readingsB.peakAmplitude,
      };
      onReadingsUpdate(readingsA, readingsB);
    }
  }, [
    readingsA,
    readingsB,
    onReadingsUpdate,
  ]);

  const renderAScan = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Padding for graticule labels
    const padLeft = 38;
    const padRight = 14;
    const padTop = 16;
    const padBottom = 26;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // 1. Graticule Grid (0 to 100% FSH in 20% steps)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Horizontal amplitude lines
    for (let percent = 0; percent <= 100; percent += 20) {
      const y = padTop + plotH * (1 - percent / 100);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = percent === 80 ? '#38bdf8' : '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${percent}%`, padLeft - 4, y + 3);
    }

    // Vertical soundpath divisions (5 intervals)
    for (let div = 0; div <= 5; div++) {
      const x = padLeft + (plotW * div) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();

      // Soundpath tick value
      const sVal = ((params.range * div) / 5).toFixed(0);
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(`${sVal}mm`, x, height - padBottom + 16);
    }

    // 80% FSH Reference Line (ASME calibration line)
    const asmeY = padTop + plotH * (1 - 80 / 100);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, asmeY);
    ctx.lineTo(width - padRight, asmeY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw DGS (Distance-Gain-Size / AVG) Curve Overlay
    if (dgsConfig.enabled) {
      const numDgsSamples = 70;

      // -6dB Registration Curve (Dashed)
      if (dgsConfig.showWarningCurve) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();

        for (let i = 0; i <= numDgsSamples; i++) {
          const s = Math.max(1, (i / numDgsSamples) * params.range);
          const amp = calculateDgsCurveAmplitude(
            s,
            dgsConfig.referenceSize,
            nearField,
            40, // 40% is -6dB below 80%
            dgsConfig.referenceSize
          );
          const x = padLeft + (s / params.range) * plotW;
          const y = padTop + plotH * (1 - Math.min(105, amp) / 100);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Main Reference DGS Curve (Solid Amber)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.beginPath();

      for (let i = 0; i <= numDgsSamples; i++) {
        const s = Math.max(1, (i / numDgsSamples) * params.range);
        const amp = calculateDgsCurveAmplitude(
          s,
          dgsConfig.referenceSize,
          nearField,
          80,
          dgsConfig.referenceSize
        );
        const x = padLeft + (s / params.range) * plotW;
        const y = padTop + plotH * (1 - Math.min(105, amp) / 100);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // DGS Curve Identification Label
      const labelS = params.range * 0.72;
      const labelAmp = calculateDgsCurveAmplitude(
        labelS,
        dgsConfig.referenceSize,
        nearField,
        80,
        dgsConfig.referenceSize
      );
      const labelX = padLeft + (labelS / params.range) * plotW;
      const labelY = padTop + plotH * (1 - Math.min(100, labelAmp) / 100);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`DGS ⌀${dgsConfig.referenceSize}mm FBH`, labelX, Math.max(padTop + 14, labelY - 6));
    }

    // 3. Peak Hold Trace (OmniScan Vibrant Yellow) overlaid with live signal
    const isRF = params.rectification === 'RF';
    const baselineY = isRF ? padTop + plotH / 2 : padTop + plotH;
    const peakSamples = peakSamplesRef.current;

    if (peakHoldEnabled && peakSamples.length === trace.samples.length) {
      ctx.strokeStyle = '#facc15'; // Brilliant OmniScan Yellow
      ctx.lineWidth = 1.9;
      ctx.setLineDash([]);
      ctx.beginPath();

      for (let i = 0; i < peakSamples.length; i++) {
        const s = trace.soundpaths[i];
        const x = padLeft + (s / params.range) * plotW;
        const amp = peakSamples[i];
        const y = isRF
          ? baselineY - (amp / 100) * (plotH / 2)
          : padTop + plotH * (1 - Math.min(105, amp) / 100);

        if (i === 0) {
          ctx.moveTo(x, baselineY);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      if (isRF) {
        for (let i = peakSamples.length - 1; i >= 0; i--) {
          const s = trace.soundpaths[i];
          const x = padLeft + (s / params.range) * plotW;
          const amp = peakSamples[i];
          const y = baselineY + (amp / 100) * (plotH / 2);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
        ctx.fill();
      } else {
        ctx.lineTo(padLeft + plotW, padTop + plotH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.09)';
        ctx.fill();
      }
      ctx.stroke();

      // Peak Hold Indicator Triangle & Text at apex
      if (peakHoldMax.amp > 8) {
        const pkX = padLeft + (peakHoldMax.soundpath / params.range) * plotW;
        const pkY = isRF
          ? baselineY - (peakHoldMax.amp / 100) * (plotH / 2)
          : padTop + plotH * (1 - Math.min(100, peakHoldMax.amp) / 100);

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(pkX, pkY - 4);
        ctx.lineTo(pkX - 4, pkY - 11);
        ctx.lineTo(pkX + 4, pkY - 11);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 8.5px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`PK: ${peakHoldMax.amp.toFixed(0)}%`, pkX, Math.max(padTop + 10, pkY - 13));
      }
    }

    // 4. Live Waveform (OmniScan Bright Green Echo Line)
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([]);

    ctx.beginPath();
    for (let i = 0; i < trace.samples.length; i++) {
      const s = trace.soundpaths[i];
      const x = padLeft + (s / params.range) * plotW;
      const amp = isRF ? trace.rfSamples[i] : trace.samples[i];
      const y = isRF
        ? baselineY - (amp / 100) * (plotH / 2)
        : padTop + plotH * (1 - Math.min(105, amp) / 100);

      if (i === 0) {
        ctx.moveTo(x, baselineY);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    if (!isRF) {
      ctx.lineTo(padLeft + plotW, padTop + plotH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.stroke();

    // 5. On-Canvas Trace Legend (Top Right)
    const legX = padLeft + plotW - 6;
    const legY = padTop + 12;
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'right';

    if (peakHoldEnabled) {
      ctx.fillStyle = '#facc15';
      ctx.fillText('■ PEAK HOLD', legX, legY);
      ctx.fillStyle = '#22c55e';
      ctx.fillText('■ LIVE', legX - 78, legY);
    } else {
      ctx.fillStyle = '#22c55e';
      ctx.fillText('■ LIVE ECHO', legX, legY);
    }

    // 3. Draw Gate A (Red)
    if (gateA.enabled) {
      const gStartX = padLeft + (gateA.start / params.range) * plotW;
      const gEndX = padLeft + ((gateA.start + gateA.width) / params.range) * plotW;
      const gY = padTop + plotH * (1 - gateA.threshold / 100);

      // Gate horizontal line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(gStartX, gY);
      ctx.lineTo(gEndX, gY);
      ctx.stroke();

      // Gate Start Handle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(gStartX, gY - 6);
      ctx.lineTo(gStartX, gY + 14);
      ctx.stroke();
      ctx.fillText('A', gStartX + 4, gY - 4);

      // Gate End Handle
      ctx.beginPath();
      ctx.moveTo(gEndX, gY - 6);
      ctx.lineTo(gEndX, gY + 14);
      ctx.stroke();

      // Peak Indicator Triangle on Gate A
      if (readingsA.peakAmplitude > 5) {
        const peakX = padLeft + (readingsA.soundpath / params.range) * plotW;
        const peakY = padTop + plotH * (1 - Math.min(100, readingsA.peakAmplitude) / 100);

        ctx.fillStyle = '#ff2b2b';
        ctx.beginPath();
        ctx.moveTo(peakX, peakY - 10);
        ctx.lineTo(peakX - 5, peakY - 17);
        ctx.lineTo(peakX + 5, peakY - 17);
        ctx.closePath();
        ctx.fill();

        // Amplitude readout above peak
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${readingsA.peakAmplitude.toFixed(0)}%`, peakX, peakY - 20);

        // If DGS is active, render ERS calculation badge right at the peak
        if (dgsConfig.enabled && dgsEval.calculatedErsMm > 0) {
          ctx.fillStyle = dgsEval.status === 'REJECT' ? '#f43f5e' : '#22d3ee';
          ctx.font = 'bold 8.5px JetBrains Mono';
          ctx.fillText(`ERS: ⌀${dgsEval.calculatedErsMm}mm`, peakX, peakY - 31);
        }
      }
    }

    // 4. Draw Gate B (Green)
    if (gateB.enabled) {
      const gStartX = padLeft + (gateB.start / params.range) * plotW;
      const gEndX = padLeft + ((gateB.start + gateB.width) / params.range) * plotW;
      const gY = padTop + plotH * (1 - gateB.threshold / 100);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(gStartX, gY);
      ctx.lineTo(gEndX, gY);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(gStartX, gY - 5);
      ctx.lineTo(gStartX, gY + 10);
      ctx.stroke();
      ctx.fillText('B', gStartX + 4, gY - 4);
    }
  }, [
    trace,
    params,
    gateA,
    gateB,
    readingsA,
    readingsB,
    dgsConfig,
    dgsEval,
    nearField,
    peakHoldEnabled,
    peakHoldMax,
  ]);

  // Touch/drag handler for Gate A adjustments
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const padLeft = 38;
    const padRight = 14;
    const padTop = 16;
    const padBottom = 26;
    const plotW = canvas.width - padLeft - padRight;
    const plotH = canvas.height - padTop - padBottom;

    const gStartX = padLeft + (gateA.start / params.range) * plotW;
    const gEndX = padLeft + ((gateA.start + gateA.width) / params.range) * plotW;
    const gY = padTop + plotH * (1 - gateA.threshold / 100);

    // Check hit on threshold line
    if (Math.abs(y - gY) < 14 && x >= gStartX - 10 && x <= gEndX + 10) {
      setActiveDrag('GATE_A_THRESH');
    } else if (Math.abs(x - gStartX) < 14) {
      setActiveDrag('GATE_A_START');
    } else if (Math.abs(x - gEndX) < 14) {
      setActiveDrag('GATE_A_WIDTH');
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const padLeft = 38;
    const padRight = 14;
    const padTop = 16;
    const padBottom = 26;
    const plotW = canvas.width - padLeft - padRight;
    const plotH = canvas.height - padTop - padBottom;

    if (activeDrag === 'GATE_A_THRESH') {
      const clampedY = Math.max(padTop, Math.min(padTop + plotH, y));
      const newThresh = Math.round((1 - (clampedY - padTop) / plotH) * 100);
      onGateAChange({ ...gateA, threshold: Math.max(5, Math.min(95, newThresh)) });
    } else if (activeDrag === 'GATE_A_START') {
      const clampedX = Math.max(padLeft, Math.min(padLeft + plotW, x));
      const newStart = ((clampedX - padLeft) / plotW) * params.range;
      onGateAChange({ ...gateA, start: Number(newStart.toFixed(1)) });
    } else if (activeDrag === 'GATE_A_WIDTH') {
      const clampedX = Math.max(padLeft, Math.min(padLeft + plotW, x));
      const endS = ((clampedX - padLeft) / plotW) * params.range;
      const newWidth = Math.max(2, endS - gateA.start);
      onGateAChange({ ...gateA, width: Number(newWidth.toFixed(1)) });
    }
  };

  useEffect(() => {
    renderAScan();
  }, [renderAScan]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      {/* Top Banner with Readings */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-emerald-400">
            {isArabic ? 'مخطط السعة A-Scan' : 'A-Scan Echo'}
          </span>
          <span className="text-slate-400 font-mono">
            {activeAngle}° @ {params.velocity} m/s
          </span>
          {readingsA.alarmTriggered && (
            <span className="px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-700 rounded font-mono text-[10px] animate-pulse">
              ALARM A!
            </span>
          )}
        </div>

        {/* Gate A Quick Numeric Readouts */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-rose-400 font-bold">A%:</span>
            <span
              className={`font-bold tabular-nums ${readingsA.alarmTriggered ? 'text-rose-400' : 'text-slate-200'}`}
            >
              {readingsA.peakAmplitude.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">SA:</span>
            <span className="text-slate-200 tabular-nums">{readingsA.soundpath.toFixed(1)}mm</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">DA:</span>
            <span className="text-amber-400 font-semibold tabular-nums">
              {readingsA.trueDepth.toFixed(1)}mm
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">RA:</span>
            <span className="text-slate-200 tabular-nums">
              {readingsA.surfaceDistance.toFixed(1)}mm
            </span>
          </div>
        </div>
      </div>

      {/* Control Ribbon: Peak Hold & DGS (Distance-Gain-Size / AVG) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono">
        {/* Left Side: Peak Hold Controls & DGS Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Peak Hold Button Group */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setPeakHoldEnabled((prev) => !prev)}
              className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1.5 ${
                peakHoldEnabled
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  peakHoldEnabled ? 'bg-slate-950 animate-pulse' : 'bg-yellow-500/60'
                }`}
              />
              <span>
                {isArabic ? 'تثبيت الذروة Peak Hold' : 'Peak Hold'}: {peakHoldEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {peakHoldEnabled && (
              <>
                <button
                  onClick={resetPeakHold}
                  title={isArabic ? 'مسح وإعادة ضبط الذروة' : 'Clear / Reset Peak Hold'}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 hover:text-yellow-200 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isArabic ? 'مسح' : 'Clear'}</span>
                </button>

                <div className="flex items-center gap-0.5 ml-0.5">
                  <button
                    onClick={() => setPeakHoldMode('INFINITE')}
                    title={isArabic ? 'احتفاظ دائم حتى المسح' : 'Infinite Peak Hold'}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                      peakHoldMode === 'INFINITE'
                        ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isArabic ? 'دائم' : 'Inf'}
                  </button>
                  <button
                    onClick={() => setPeakHoldMode('DECAY')}
                    title={isArabic ? 'تلاشي تدريجي للذروة' : 'Slow Decay Peak Hold'}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                      peakHoldMode === 'DECAY'
                        ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isArabic ? 'تلاشي' : 'Decay'}
                  </button>
                </div>

                {peakHoldMax.amp > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-950/40 border border-yellow-500/30 rounded text-[10px]">
                    <span className="text-yellow-500 font-bold">PkMax:</span>
                    <span className="text-yellow-300 font-bold tabular-nums">
                      {peakHoldMax.amp.toFixed(1)}%
                    </span>
                    <span className="text-yellow-500/80">@</span>
                    <span className="text-yellow-200 tabular-nums">
                      {peakHoldMax.soundpath.toFixed(1)}mm
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* DGS Toggle & Reference Size Buttons */}
          <button
            onClick={() => setDgsConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-2 py-0.5 rounded font-bold transition-all ${
              dgsConfig.enabled
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isArabic ? 'منحنى DGS' : 'DGS Curve'}: {dgsConfig.enabled ? 'ON' : 'OFF'}
          </button>

          {dgsConfig.enabled && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[10px]">{isArabic ? 'المرجع:' : 'Ref:'}</span>
              {[1.0, 1.5, 2.0, 3.0, 5.0].map((size) => (
                <button
                  key={size}
                  onClick={() => setDgsConfig((prev) => ({ ...prev, referenceSize: size }))}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    dgsConfig.referenceSize === size
                      ? 'bg-amber-950 text-amber-300 border border-amber-600'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⌀{size}mm
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Automated Equivalent Reflector Size (ERS / ERC) Readout & Code Verdict */}
        {dgsConfig.enabled && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">{isArabic ? 'حجم العيب المكافئ ERS:' : 'ERS:'}</span>
              <span className="text-cyan-400 font-bold tabular-nums">
                ⌀{dgsEval.calculatedErsMm.toFixed(2)} mm
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500">ΔdB:</span>
              <span
                className={`font-bold tabular-nums ${
                  dgsEval.deltaDbFromCurve >= 0 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {dgsEval.deltaDbFromCurve >= 0 ? `+${dgsEval.deltaDbFromCurve}` : dgsEval.deltaDbFromCurve} dB
              </span>
            </div>

            <div
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                dgsEval.status === 'REJECT'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}
            >
              {dgsEval.status === 'REJECT'
                ? isArabic
                  ? `مرفوض: > ${dgsConfig.acceptanceLimitMm}mm`
                  : `REJECT > ${dgsConfig.acceptanceLimitMm}mm`
                : isArabic
                  ? `مقبول: < ${dgsConfig.acceptanceLimitMm}mm`
                  : `ACCEPT < ${dgsConfig.acceptanceLimitMm}mm`}
            </div>
          </div>
        )}
      </div>

      {/* A-Scan Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[220px]">
        <canvas
          ref={canvasRef}
          width={700}
          height={380}
          className="w-full h-full cursor-pointer touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setActiveDrag(null)}
          onPointerLeave={() => setActiveDrag(null)}
        />

        {/* Gate A Direct Controls Bar */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded border border-slate-800 text-[11px] font-mono">
          <span className="text-rose-400 font-bold">Gate A:</span>
          <span>Start: {gateA.start}mm</span>
          <span>·</span>
          <span>Width: {gateA.width}mm</span>
          <span>·</span>
          <span>Thresh: {gateA.threshold}%</span>
          {dgsConfig.enabled && dgsEval.calculatedErsMm > 0 && (
            <>
              <span>·</span>
              <span className="text-cyan-400 font-bold">ERS: ⌀{dgsEval.calculatedErsMm}mm</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
