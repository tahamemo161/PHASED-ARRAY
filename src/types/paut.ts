/**
 * Phased Array Ultrasonic Testing (PAUT) Types
 * Modeled after Olympus / Evident OmniScan X3 / MX2 architecture
 */

export type PaletteName = 'HOT_IRON' | 'RAINBOW' | 'ASME' | 'GRAYSCALE';

export type WaveType = 'SHEAR' | 'LONGITUDINAL';

export type GateId = 'A' | 'B' | 'I';

export interface GateConfig {
  id: GateId;
  name: string;
  enabled: boolean;
  color: string;
  start: number; // in soundpath (mm) or depth (mm)
  width: number; // mm
  threshold: number; // 0 to 100% Full Screen Height (FSH)
  logic: 'POSITIVE' | 'NEGATIVE'; // Alarm when echo crosses or drops below
  measurePeak: boolean;
}

export interface GateReadings {
  peakAmplitude: number; // 0 - 100+% FSH
  soundpath: number; // mm (SA)
  trueDepth: number; // mm (DA)
  surfaceDistance: number; // mm (RA)
  probeFrontDistance: number; // mm (PA)
  beamAngle: number; // deg (LA)
  alarmTriggered: boolean;
}

export interface ProbeElement {
  id: number;
  active: boolean;
  impedance: number; // Ohms (e.g., 50 nominal)
  status: 'good' | 'weak' | 'dead';
  relativeGain: number; // dB normalized
}

export interface ProbeConfig {
  id: string;
  name: string;
  type: 'PA' | 'TOFD' | 'CONVENTIONAL';
  frequency: number; // MHz (e.g. 5.0)
  elementCount: number; // e.g. 16, 32, 64
  pitch: number; // mm (e.g. 0.6)
  elevation: number; // mm (e.g. 10.0)
  connector: 'IPEX_128' | 'HYPERTRONICS' | 'LEMO_00' | 'BNC';
  serialNumber: string;
  elements: ProbeElement[];
}

export interface WedgeConfig {
  id: string;
  name: string;
  nominalAngle: number; // degrees in carbon steel, e.g. 55°
  roofAngle: number; // degrees
  velocity: number; // m/s in wedge material (Rexolite ~ 2330 m/s)
  heightFirstElement: number; // mm (h1)
  indexOffset: number; // mm from front of wedge to exit point
  length: number; // mm
  width: number; // mm
  waveType: WaveType;
}

export interface EncoderConfig {
  id: number;
  connected: boolean;
  name: string;
  resolution: number; // pulses per mm (e.g. 12.0)
  currentPosition: number; // mm
  scanAxis: 'X' | 'Y';
  polarity: 'NORMAL' | 'INVERTED';
}

export type FlawType =
  | 'root_crack'
  | 'lack_of_fusion'
  | 'slag_inclusion'
  | 'porosity_cluster'
  | 'lamination'
  | 'sdh_cal_hole';

export interface WeldFlaw {
  id: string;
  name: string;
  type: FlawType;
  xOffset: number; // mm from weld centerline (Index axis, 0 is weld center)
  yPosition: number; // mm along weld scan axis (Length, e.g. 50mm)
  depth: number; // mm from top surface
  length: number; // mm along scan axis
  height: number; // mm through-wall extent
  orientationAngle: number; // deg tilt (e.g. 30° bevel)
  reflectivity: number; // 0 to 1.5 amplitude scale
  description: string;
}

export interface SpecimenConfig {
  type: 'butt_weld' | 'pipe_weld' | 'v1_block' | 'v2_block' | 'corrosion_plate';
  name: string;
  material: string;
  materialKey?: string; // id from materials database
  longitudinalVelocity: number; // m/s (e.g. 5920 m/s for Carbon Steel)
  shearVelocity: number; // m/s (e.g. 3240 m/s for Carbon Steel)
  density: number; // g/cm³
  acousticImpedance?: number; // MRayls (e.g. 46.5 for steel)
  attenuationDbPerMm?: number; // dB/mm ultrasonic attenuation (e.g. 0.022 for steel, 0.075 for stainless)
  thickness: number; // mm (e.g. 20mm)
  length: number; // mm (e.g. 250mm)
  width: number; // mm
  // Weld geometry
  grooveType?: 'single_v' | 'double_v' | 'single_u' | 'j_groove';
  bevelAngle: number; // degrees, e.g. 30° (60° included V)
  bottomBevelAngle?: number; // degrees for double-v
  rootFace: number; // mm, e.g. 1.5mm (land)
  rootGap: number; // mm, e.g. 2.0mm (root opening)
  capWidth: number; // mm, e.g. 16mm
  capHeight: number; // mm, e.g. 1.5mm (crown reinforcement)
  uRadius?: number; // mm for single-u radius
  hazWidth?: number; // mm HAZ extent
  flaws: WeldFlaw[];
}

export interface SignalFilterConfig {
  enabled: boolean;
  preset: 'NONE' | '0.5-2MHz' | '2-5MHz' | '5-10MHz' | 'CUSTOM';
  lowCutoffMHz: number; // High-pass filter (cuts frequencies below this, e.g. 1.5 MHz)
  highCutoffMHz: number; // Low-pass filter (cuts frequencies above this, e.g. 8.5 MHz)
  noiseReductionLevel: number; // 0% to 100% (electronic noise filtering)
  smoothing: boolean;
}

export interface UltrasonicParams {
  gain: number; // dB, total system gain (e.g. 32.0 dB)
  analogGain: number; // dB
  digitalGain: number; // dB
  velocity: number; // m/s (shear wave 3240 m/s)
  wedgeDelay: number; // microseconds (e.g. 4.85 µs)
  pulseWidth: number; // ns (half-cycle tuned to probe frequency)
  voltage: 50 | 100 | 150; // Volts
  prf: number; // Hz (Pulse Repetition Frequency, e.g. 3000 Hz)
  filter: string; // display name e.g. '2-5 MHz'
  filterConfig: SignalFilterConfig;
  rectification: 'FULL_WAVE' | 'RF' | 'HALF_WAVE_POS' | 'HALF_WAVE_NEG';
  range: number; // mm (Soundpath range on screen, e.g. 80mm)
  startDelay: number; // mm
}

export interface FocalLawConfig {
  startAngle: number; // deg, e.g. 40°
  stopAngle: number; // deg, e.g. 70°
  angleStep: number; // deg, e.g. 1.0°
  activeElements: number; // e.g. 16 elements sub-aperture
  firstElement: number; // 1 to 64
  focusType: 'TRUE_DEPTH' | 'SOUNDPATH' | 'UNFOCUSED';
  focusDistance: number; // mm (e.g. 25mm)
  waveType: WaveType;
}

export interface CalibrationState {
  velocityCalibrated: boolean;
  velocityRefThickness: number;
  wedgeDelayCalibrated: boolean;
  sensitivityCalibrated: boolean;
  tcgCalibrated: boolean;
  tcgPoints: { depth: number; gainOffset: number }[];
  encoderCalibrated: boolean;
}

export type LayoutViewMode = 'S_A' | 'S_C_A' | 'A_ONLY' | 'S_ONLY' | 'WELD_RAY' | 'TOFD';

export interface DgsConfig {
  enabled: boolean;
  nominalDiameter: number; // mm effective aperture
  frequency: number; // MHz
  referenceType: 'FBH' | 'BACKWALL';
  referenceSize: number; // mm (e.g. 2.0mm or 3.0mm FBH)
  showWarningCurve: boolean; // -6dB registration curve
  acceptanceLimitMm: number; // rejection threshold mm (e.g. 2.5mm)
}

export interface DgsEvaluation {
  calculatedErsMm: number; // mm Equivalent Reflector Size
  deltaDbFromCurve: number; // dB offset from reference DGS curve
  status: 'ACCEPT' | 'REJECT';
}

export interface PeakHoldConfig {
  enabled: boolean;
  mode: 'INFINITE' | 'DECAY';
  decayRate?: number;
}

export interface InspectionReportData {
  inspectorName: string;
  inspectorLevel: 'Level II' | 'Level III';
  company: string;
  date: string;
  componentId: string;
  weldId: string;
  material: string;
  thickness: number;
  procedure: string;
  acceptanceStandard: 'ASME Sec V Art 4' | 'ISO 13588' | 'AWS D1.1' | 'API 1104';
  equipmentModel: string;
  serialNumber: string;
  probeModel: string;
  wedgeModel: string;
  overallResult: 'ACCEPT' | 'REJECT';
  indications: {
    id: number;
    flawType: string;
    scanPos: number; // mm
    indexOffset: number; // mm
    depth: number; // mm
    soundpath: number; // mm
    length: number; // mm
    height: number; // mm
    amplitudePercent: number; // % FSH
    verdict: 'Accept' | 'Reject';
  }[];
}
