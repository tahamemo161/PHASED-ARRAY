/**
 * OmniScan PAUT Simulator - Phased Array NDT Workstation
 * Modeled after Olympus / Evident OmniScan X3 & MX2
 * Supports Work Probe Link, Wedge Mount, S-Scan, A-Scan, C-Scan,
 * Calibration Wizard, Weld Simulation, and ASME Inspection Report.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UltrasonicParams,
  FocalLawConfig,
  SpecimenConfig,
  ProbeConfig,
  WedgeConfig,
  EncoderConfig,
  GateConfig,
  GateReadings,
  LayoutViewMode,
  PaletteName,
  CalibrationState,
} from './types/paut';
import {
  STANDARD_PROBES,
  STANDARD_WEDGES,
  DEFAULT_SPECIMEN,
} from './data/probesAndWedges';
import { OmniScanHeader } from './components/OmniScanHeader';
import { OmniScanSidebar } from './components/OmniScanSidebar';
import { SScanView } from './components/SScanView';
import { AScanView } from './components/AScanView';
import { CScanView } from './components/CScanView';
import { WeldSimulatorView } from './components/WeldSimulatorView';
import { ProbeLinkModal } from './components/ProbeLinkModal';
import { CalibrationModal } from './components/CalibrationModal';
import { InspectionReportModal } from './components/InspectionReportModal';
import { WeldGeometryModal } from './components/WeldGeometryModal';
import { TabletBezel } from './components/TabletBezel';
import { TRANSLATIONS } from './utils/translations';
import {
  AlertTriangle,
  Radio,
  Sliders,
  Layers,
  Cpu,
  Info,
} from 'lucide-react';

export default function App() {
  // Localization
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const isArabic = lang === 'ar';
  const t = TRANSLATIONS[lang];

  // Instrument Casing Bezel toggle
  const [tabletBezel, setTabletBezel] = useState<boolean>(false);

  // Active Ultrasonic Parameters
  const [params, setParams] = useState<UltrasonicParams>({
    gain: 34.0, // dB
    analogGain: 14.0,
    digitalGain: 20.0,
    velocity: 3240, // m/s shear wave in steel
    wedgeDelay: 4.82, // µs
    pulseWidth: 100, // ns
    voltage: 100,
    prf: 3000,
    filter: '2-5 MHz',
    filterConfig: {
      enabled: true,
      preset: '2-5MHz',
      lowCutoffMHz: 2.0,
      highCutoffMHz: 5.0,
      noiseReductionLevel: 65,
      smoothing: true,
    },
    rectification: 'FULL_WAVE',
    range: 75.0, // mm soundpath range
    startDelay: 0.0,
  });

  // Focal Law Configuration (S-Scan angular sweep)
  const [focalLaws, setFocalLaws] = useState<FocalLawConfig>({
    startAngle: 40.0,
    stopAngle: 70.0,
    angleStep: 1.0,
    activeElements: 16,
    firstElement: 1,
    focusType: 'TRUE_DEPTH',
    focusDistance: 25.0,
    waveType: 'SHEAR',
  });

  // Active Beam Angle (cursor ray in S-Scan and source for A-Scan)
  const [activeAngle, setActiveAngle] = useState<number>(55.0);

  // Hardware: Probe, Wedge, Specimen, Encoder
  const [probe, setProbe] = useState<ProbeConfig>(STANDARD_PROBES[0]);
  const [wedge, setWedge] = useState<WedgeConfig>(STANDARD_WEDGES[0]);
  const [specimen, setSpecimen] = useState<SpecimenConfig>(DEFAULT_SPECIMEN);
  const [encoder, setEncoder] = useState<EncoderConfig>({
    id: 1,
    connected: true,
    name: 'Mini-Wheel Quadrature Encoder',
    resolution: 12.0,
    currentPosition: 65.0,
    scanAxis: 'Y',
    polarity: 'NORMAL',
  });

  // Scanner Mechanical Position
  const [probeIndexX, setProbeIndexX] = useState<number>(24.0); // mm from weld centerline
  const [scanPosY, setScanPosY] = useState<number>(65.0); // mm along weld seam (initial flaw position)
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(false);

  // Display & View Options
  const [layoutMode, setLayoutMode] = useState<LayoutViewMode>('S_A');
  const [palette, setPalette] = useState<PaletteName>('HOT_IRON');
  const [showWeldOverlay, setShowWeldOverlay] = useState<boolean>(true);
  const [frozen, setFrozen] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);

  // Gates Configuration
  const [gateA, setGateA] = useState<GateConfig>({
    id: 'A',
    name: 'Gate A (Flaw Detection)',
    enabled: true,
    color: '#ef4444',
    start: 22.0, // mm
    width: 28.0, // mm
    threshold: 40, // % FSH
    logic: 'POSITIVE',
    measurePeak: true,
  });

  const [gateB, setGateB] = useState<GateConfig>({
    id: 'B',
    name: 'Gate B (Backwall Monitoring)',
    enabled: true,
    color: '#10b981',
    start: 35.0,
    width: 30.0,
    threshold: 25,
    logic: 'POSITIVE',
    measurePeak: true,
  });

  // Live Gate Readings
  const [readingsA, setReadingsA] = useState<GateReadings>({
    peakAmplitude: 68.4,
    soundpath: 34.2,
    trueDepth: 19.6,
    surfaceDistance: 28.0,
    probeFrontDistance: 16.0,
    beamAngle: 55.0,
    alarmTriggered: true,
  });

  const [readingsB, setReadingsB] = useState<GateReadings>({
    peakAmplitude: 18.2,
    soundpath: 42.0,
    trueDepth: 20.0,
    surfaceDistance: 34.4,
    probeFrontDistance: 22.4,
    beamAngle: 55.0,
    alarmTriggered: false,
  });

  // Calibration State
  const [calState, setCalState] = useState<CalibrationState>({
    velocityCalibrated: true,
    velocityRefThickness: 25.0,
    wedgeDelayCalibrated: true,
    sensitivityCalibrated: true,
    tcgCalibrated: true,
    tcgPoints: [
      { depth: 10, gainOffset: 0.0 },
      { depth: 20, gainOffset: 3.2 },
      { depth: 30, gainOffset: 6.8 },
      { depth: 40, gainOffset: 10.5 },
      { depth: 50, gainOffset: 14.2 },
    ],
    encoderCalibrated: true,
  });

  // Modals
  const [showProbeLink, setShowProbeLink] = useState<boolean>(false);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showWeldGeometry, setShowWeldGeometry] = useState<boolean>(false);

  // Auto-scan robotic crawler loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isAutoScanning && !frozen) {
        setScanPosY((prev) => {
          const next = prev + 25 * dt; // 25 mm/sec crawler speed
          return next > specimen.length ? 0 : next;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isAutoScanning, frozen, specimen.length]);

  // Keep encoder position in sync with scanPosY
  useEffect(() => {
    setEncoder((prev) => {
      if (prev.currentPosition === scanPosY) return prev;
      return { ...prev, currentPosition: scanPosY };
    });
  }, [scanPosY]);

  // Handle probe link confirmation
  const handleApplyProbeConfig = (
    newProbe: ProbeConfig,
    newWedge: WedgeConfig,
    newEncoder: EncoderConfig
  ) => {
    setProbe(newProbe);
    setWedge(newWedge);
    setEncoder(newEncoder);
    // Update focal law aperture according to probe element count
    setFocalLaws((prev) => ({
      ...prev,
      activeElements: Math.min(newProbe.elementCount, 16),
    }));
  };

  const handleReadingsUpdate = useCallback(
    (newA: GateReadings, newB: GateReadings) => {
      setReadingsA((prev) => {
        if (
          Math.abs(prev.peakAmplitude - newA.peakAmplitude) < 0.1 &&
          Math.abs(prev.soundpath - newA.soundpath) < 0.1 &&
          Math.abs(prev.trueDepth - newA.trueDepth) < 0.1 &&
          prev.alarmTriggered === newA.alarmTriggered
        ) {
          return prev;
        }
        return newA;
      });
      setReadingsB((prev) => {
        if (
          Math.abs(prev.peakAmplitude - newB.peakAmplitude) < 0.1 &&
          Math.abs(prev.soundpath - newB.soundpath) < 0.1 &&
          Math.abs(prev.trueDepth - newB.trueDepth) < 0.1 &&
          prev.alarmTriggered === newB.alarmTriggered
        ) {
          return prev;
        }
        return newB;
      });
    },
    []
  );

  return (
    <div
      className="w-full h-screen flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <TabletBezel
        enabled={tabletBezel}
        gain={params.gain}
        onGainChange={(g) => setParams((p) => ({ ...p, gain: g }))}
        frozen={frozen}
        onToggleFreeze={() => setFrozen((f) => !f)}
        onOpenCalibration={() => setShowCalibration(true)}
        onOpenProbeLink={() => setShowProbeLink(true)}
        onToggleBezel={() => setTabletBezel((b) => !b)}
        isArabic={isArabic}
      >
        {/* OmniScan Top Telemetry Bar */}
        <OmniScanHeader
          params={params}
          onUpdateParams={setParams}
          probe={probe}
          activeAngle={activeAngle}
          layoutMode={layoutMode}
          onLayoutChange={setLayoutMode}
          palette={palette}
          onPaletteChange={setPalette}
          showWeldOverlay={showWeldOverlay}
          onToggleWeldOverlay={() => setShowWeldOverlay((v) => !v)}
          frozen={frozen}
          onToggleFreeze={() => setFrozen((f) => !f)}
          recording={recording}
          onToggleRecord={() => setRecording((r) => !r)}
          onOpenProbeLink={() => setShowProbeLink(true)}
          onOpenCalibration={() => setShowCalibration(true)}
          onOpenReport={() => setShowReport(true)}
          onOpenWeldGeometry={() => setShowWeldGeometry(true)}
          tabletBezel={tabletBezel}
          onToggleTabletBezel={() => setTabletBezel((b) => !b)}
          isArabic={isArabic}
          onToggleLanguage={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
        />

        {/* Central Workstation Stage */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Visual Display Views */}
          <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden bg-slate-950">
            {/* S+A Mode (Classic Phased Array view) */}
            {layoutMode === 'S_A' && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-hidden">
                <SScanView
                  params={params}
                  focalLaws={focalLaws}
                  specimen={specimen}
                  wedge={wedge}
                  activeAngle={activeAngle}
                  onAngleChange={setActiveAngle}
                  probeIndexX={probeIndexX}
                  scanPosY={scanPosY}
                  palette={palette}
                  showWeldOverlay={showWeldOverlay}
                  frozen={frozen}
                  isArabic={isArabic}
                />
                <AScanView
                  params={params}
                  focalLaws={focalLaws}
                  specimen={specimen}
                  wedge={wedge}
                  activeAngle={activeAngle}
                  probeIndexX={probeIndexX}
                  scanPosY={scanPosY}
                  gateA={gateA}
                  onGateAChange={setGateA}
                  gateB={gateB}
                  onGateBChange={setGateB}
                  onReadingsUpdate={handleReadingsUpdate}
                  isArabic={isArabic}
                  frozen={frozen}
                  calState={calState}
                />
              </div>
            )}

            {/* S+C+A Triple View */}
            {layoutMode === 'S_C_A' && (
              <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-[55%] overflow-hidden">
                  <SScanView
                    params={params}
                    focalLaws={focalLaws}
                    specimen={specimen}
                    wedge={wedge}
                    activeAngle={activeAngle}
                    onAngleChange={setActiveAngle}
                    probeIndexX={probeIndexX}
                    scanPosY={scanPosY}
                    palette={palette}
                    showWeldOverlay={showWeldOverlay}
                    frozen={frozen}
                    isArabic={isArabic}
                  />
                  <AScanView
                    params={params}
                    focalLaws={focalLaws}
                    specimen={specimen}
                    wedge={wedge}
                    activeAngle={activeAngle}
                    probeIndexX={probeIndexX}
                    scanPosY={scanPosY}
                    gateA={gateA}
                    onGateAChange={setGateA}
                    gateB={gateB}
                    onGateBChange={setGateB}
                    onReadingsUpdate={handleReadingsUpdate}
                    isArabic={isArabic}
                    frozen={frozen}
                    calState={calState}
                  />
                </div>
                <div className="h-36 sm:h-44">
                  <CScanView
                    specimen={specimen}
                    focalLaws={focalLaws}
                    params={params}
                    scanPosY={scanPosY}
                    probeIndexX={probeIndexX}
                    palette={palette}
                    onScanPosChange={setScanPosY}
                    isArabic={isArabic}
                  />
                </div>
              </div>
            )}

            {/* Maximized S-Scan Only */}
            {layoutMode === 'S_ONLY' && (
              <div className="flex-1 overflow-hidden">
                <SScanView
                  params={params}
                  focalLaws={focalLaws}
                  specimen={specimen}
                  wedge={wedge}
                  activeAngle={activeAngle}
                  onAngleChange={setActiveAngle}
                  probeIndexX={probeIndexX}
                  scanPosY={scanPosY}
                  palette={palette}
                  showWeldOverlay={showWeldOverlay}
                  frozen={frozen}
                  isArabic={isArabic}
                />
              </div>
            )}

            {/* Maximized A-Scan Only */}
            {layoutMode === 'A_ONLY' && (
              <div className="flex-1 overflow-hidden">
                <AScanView
                  params={params}
                  focalLaws={focalLaws}
                  specimen={specimen}
                  wedge={wedge}
                  activeAngle={activeAngle}
                  probeIndexX={probeIndexX}
                  scanPosY={scanPosY}
                  gateA={gateA}
                  onGateAChange={setGateA}
                  gateB={gateB}
                  onGateBChange={setGateB}
                  onReadingsUpdate={handleReadingsUpdate}
                  isArabic={isArabic}
                  frozen={frozen}
                  calState={calState}
                />
              </div>
            )}

            {/* Acoustic Ray Tracing & Physical Weld Cross Section */}
            {layoutMode === 'WELD_RAY' && (
              <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <WeldSimulatorView
                    specimen={specimen}
                    wedge={wedge}
                    probe={probe}
                    focalLaws={focalLaws}
                    activeAngle={activeAngle}
                    probeIndexX={probeIndexX}
                    onProbeIndexChange={setProbeIndexX}
                    scanPosY={scanPosY}
                    onScanPosChange={setScanPosY}
                    isAutoScanning={isAutoScanning}
                    onToggleAutoScan={() => setIsAutoScanning((a) => !a)}
                    isArabic={isArabic}
                  />
                </div>
                <div className="h-44">
                  <AScanView
                    params={params}
                    focalLaws={focalLaws}
                    specimen={specimen}
                    wedge={wedge}
                    activeAngle={activeAngle}
                    probeIndexX={probeIndexX}
                    scanPosY={scanPosY}
                    gateA={gateA}
                    onGateAChange={setGateA}
                    gateB={gateB}
                    onGateBChange={setGateB}
                    onReadingsUpdate={handleReadingsUpdate}
                    isArabic={isArabic}
                    frozen={frozen}
                  />
                </div>
              </div>
            )}

            {/* Bottom Comprehensive OmniScan Measurement Strip */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
              {/* Gate A Primary Values */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-bold text-sm">A%:</span>
                  <span
                    className={`text-base font-bold tabular-nums ${
                      readingsA.alarmTriggered ? 'text-rose-400 animate-pulse' : 'text-slate-100'
                    }`}
                  >
                    {readingsA.peakAmplitude.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">SA:</span>
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {readingsA.soundpath.toFixed(1)} mm
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">DA (Depth):</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {readingsA.trueDepth.toFixed(1)} mm
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">RA:</span>
                  <span className="text-slate-200 tabular-nums">
                    {readingsA.surfaceDistance.toFixed(1)} mm
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-slate-400">LA (Angle):</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{activeAngle}°</span>
                </div>
              </div>

              {/* Scanner Mechanical Location */}
              <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                <div className="flex items-center gap-1">
                  <span>Index X:</span>
                  <b className="text-slate-200">{probeIndexX.toFixed(1)} mm</b>
                </div>
                <div className="flex items-center gap-1">
                  <span>Scan Y:</span>
                  <b className="text-slate-200">{scanPosY.toFixed(1)} mm</b>
                </div>
                {readingsA.alarmTriggered && (
                  <div className="px-2 py-0.5 bg-rose-950 border border-rose-600 text-rose-300 rounded font-bold text-[10px] animate-pulse">
                    {isArabic ? 'إنذار عيب اللحام!' : 'DEFECT ALARM!'}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right Operational Sidebar */}
          <OmniScanSidebar
            params={params}
            onUpdateParams={setParams}
            focalLaws={focalLaws}
            onUpdateFocalLaws={setFocalLaws}
            specimen={specimen}
            onUpdateSpecimen={setSpecimen}
            gateA={gateA}
            onGateAChange={setGateA}
            gateB={gateB}
            onGateBChange={setGateB}
            wedge={wedge}
            probe={probe}
            onOpenProbeLink={() => setShowProbeLink(true)}
            onOpenCalibration={() => setShowCalibration(true)}
            onOpenReport={() => setShowReport(true)}
            onOpenWeldGeometry={() => setShowWeldGeometry(true)}
            isArabic={isArabic}
          />
        </div>

        {/* MODAL 1: Probe Link & Hardware Studio */}
        {showProbeLink && (
          <ProbeLinkModal
            currentProbe={probe}
            currentWedge={wedge}
            encoder={encoder}
            onApplyConfiguration={handleApplyProbeConfig}
            onClose={() => setShowProbeLink(false)}
            isArabic={isArabic}
          />
        )}

        {/* MODAL 2: Calibration Wizard */}
        {showCalibration && (
          <CalibrationModal
            params={params}
            onUpdateParams={setParams}
            focalLaws={focalLaws}
            specimen={specimen}
            calState={calState}
            onUpdateCalState={setCalState}
            onClose={() => setShowCalibration(false)}
            isArabic={isArabic}
          />
        )}

        {/* MODAL 3: Inspection Report Certificate */}
        {showReport && (
          <InspectionReportModal
            specimen={specimen}
            probe={probe}
            wedge={wedge}
            params={params}
            calState={calState}
            readingsA={readingsA}
            onClose={() => setShowReport(false)}
            isArabic={isArabic}
          />
        )}

        {/* MODAL 4: Custom Weld Geometry Designer */}
        {showWeldGeometry && (
          <WeldGeometryModal
            currentSpecimen={specimen}
            onApplySpecimen={setSpecimen}
            onClose={() => setShowWeldGeometry(false)}
            isArabic={isArabic}
          />
        )}
      </TabletBezel>
    </div>
  );
}
