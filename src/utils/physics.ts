/**
 * Ultrasonic Wave Physics and Phased Array Calculations
 * Includes Snell's Law refraction, skip leg folding, ray-tracing,
 * beam steering delays, flaw echo synthesis, and palette lookup.
 */

import {
  PaletteName,
  SpecimenConfig,
  WedgeConfig,
  FocalLawConfig,
  UltrasonicParams,
  GateConfig,
  GateReadings,
  DgsConfig,
  DgsEvaluation,
  CalibrationState,
} from '../types/paut';

// Standard acoustic velocity constants (m/s)
export const VELOCITY_REXOLITE = 2330; // m/s in Rexolite wedge
export const VELOCITY_STEEL_SHEAR = 3240; // m/s shear wave in steel
export const VELOCITY_STEEL_LONG = 5920; // m/s longitudinal in steel
export const VELOCITY_WATER = 1480; // m/s couplant / water

/**
 * Calculates Snell's Law refracted angle in material
 * sin(theta_mat) = (V_mat / V_wedge) * sin(theta_wedge)
 */
export function calculateRefractedAngle(
  wedgeAngleDeg: number,
  vWedge: number,
  vMaterial: number
): number {
  const thetaWedgeRad = (wedgeAngleDeg * Math.PI) / 180;
  const sinMat = (vMaterial / vWedge) * Math.sin(thetaWedgeRad);
  if (Math.abs(sinMat) > 1.0) {
    return 90.0; // Total internal reflection / critical angle
  }
  return (Math.asin(sinMat) * 180) / Math.PI;
}

/**
 * Converts amplitude value (0 - 100%) to RGB color according to selected palette
 */
export function getPaletteColor(amplitude: number, palette: PaletteName): [number, number, number] {
  const a = Math.max(0, Math.min(100, amplitude));

  if (palette === 'HOT_IRON') {
    // Olympus Classic Hot Iron: Black -> Red -> Orange -> Yellow -> White
    if (a < 5) return [10, 14, 20];
    if (a < 25) {
      const t = (a - 5) / 20;
      return [Math.round(180 * t), 0, 0];
    }
    if (a < 50) {
      const t = (a - 25) / 25;
      return [Math.round(180 + 75 * t), Math.round(110 * t), 0];
    }
    if (a < 75) {
      const t = (a - 50) / 25;
      return [255, Math.round(110 + 120 * t), 0];
    }
    if (a < 95) {
      const t = (a - 75) / 20;
      return [255, 230 + Math.round(25 * t), Math.round(160 * t)];
    }
    const t = (a - 95) / 5;
    return [255, 255, Math.round(160 + 95 * t)];
  }

  if (palette === 'RAINBOW') {
    // Jet/Rainbow: Navy -> Blue -> Cyan -> Green -> Yellow -> Red -> White
    if (a < 5) return [8, 12, 24];
    if (a < 20) {
      const t = (a - 5) / 15;
      return [0, 0, Math.round(120 + 135 * t)];
    }
    if (a < 40) {
      const t = (a - 20) / 20;
      return [0, Math.round(220 * t), 255];
    }
    if (a < 60) {
      const t = (a - 40) / 20;
      return [Math.round(220 * t), 230, Math.round(255 * (1 - t))];
    }
    if (a < 80) {
      const t = (a - 60) / 20;
      return [255, Math.round(230 * (1 - t * 0.7)), 0];
    }
    if (a < 95) {
      const t = (a - 80) / 15;
      return [255, Math.round(70 * (1 - t)), Math.round(40 * t)];
    }
    return [255, 255, 255];
  }

  if (palette === 'ASME') {
    // ASME Code palette: Blue (<20%), Cyan (20-50%), Yellow (50-80%), Red (>80%)
    if (a < 10) return [15, 20, 30];
    if (a < 20) return [30, 80, 180];
    if (a < 50) return [0, 180, 220];
    if (a < 80) return [240, 200, 20];
    return [235, 35, 35];
  }

  // GRAYSCALE (Classic TOFD)
  const val = Math.round((a / 100) * 255);
  return [val, val, val];
}

/**
 * Calculates focal laws time delays for phased array steering
 */
export function calculateFocalLawDelays(
  elementCount: number,
  pitchMm: number,
  steerAngleDeg: number,
  focusDepthMm: number,
  velocityMPerS: number
): number[] {
  const thetaRad = (steerAngleDeg * Math.PI) / 180;
  const delays: number[] = [];
  const vMmPerUs = velocityMPerS / 1000;

  for (let i = 0; i < elementCount; i++) {
    const x = (i - (elementCount - 1) / 2) * pitchMm;
    // Steering plane delay component + spherical focusing
    let delay = (x * Math.sin(thetaRad)) / vMmPerUs;
    if (focusDepthMm > 0) {
      const dist = Math.sqrt(Math.pow(x - focusDepthMm * Math.sin(thetaRad), 2) + Math.pow(focusDepthMm * Math.cos(thetaRad), 2));
      delay += dist / vMmPerUs;
    }
    delays.push(delay);
  }

  // Normalize so minimum delay is 0.0
  const minDelay = Math.min(...delays);
  return delays.map((d) => Number((d - minDelay).toFixed(3)));
}

/**
 * Ray tracing projection: Converts soundpath S and angle theta to
 * physical coordinates (x, depth, leg) taking into account plate thickness
 */
export interface SoundpathCoordinate {
  soundpath: number;
  angle: number;
  surfaceDistance: number; // R
  apparentDepth: number; // S * cos(theta)
  trueDepth: number; // Folded into plate thickness 0..T
  leg: number; // 1, 2, or 3
  plateX: number; // Offset from probe index point on plate surface
}

export function projectSoundpath(
  soundpath: number,
  angleDeg: number,
  plateThickness: number,
  probeIndexOnPlate: number // mm from weld centerline
): SoundpathCoordinate {
  const rad = (angleDeg * Math.PI) / 180;
  const surfaceDist = soundpath * Math.sin(rad);
  const unrolledDepth = soundpath * Math.cos(rad);

  // Skip leg folding
  const leg = Math.floor(unrolledDepth / plateThickness) + 1;
  const modDepth = unrolledDepth % (2 * plateThickness);
  let trueDepth = modDepth;
  if (modDepth > plateThickness) {
    trueDepth = 2 * plateThickness - modDepth; // Leg 2 bouncing back up
  }

  // Plate surface position along index axis (assuming beam directed toward weld center X=0)
  const plateX = probeIndexOnPlate - surfaceDist;

  return {
    soundpath,
    angle: angleDeg,
    surfaceDistance: surfaceDist,
    apparentDepth: unrolledDepth,
    trueDepth,
    leg,
    plateX,
  };
}

/**
 * Smooth cubic Hermite interpolation for Time Corrected Gain (TCG / TVG) points
 */
export function interpolateTcgGain(
  depthMm: number,
  points?: { depth: number; gainOffset: number }[]
): number {
  if (!points || points.length === 0) return 0;
  if (depthMm <= points[0].depth) return points[0].gainOffset;
  if (depthMm >= points[points.length - 1].depth) return points[points.length - 1].gainOffset;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (depthMm >= p1.depth && depthMm <= p2.depth) {
      const span = p2.depth - p1.depth;
      if (span <= 0.001) return p1.gainOffset;
      const t = (depthMm - p1.depth) / span;
      const smoothT = t * t * (3 - 2 * t);
      return p1.gainOffset + smoothT * (p2.gainOffset - p1.gainOffset);
    }
  }
  return 0;
}

/**
 * Synthesizes the full A-Scan waveform for a specific beam angle
 */
export function generateAScanTrace(
  angleDeg: number,
  params: UltrasonicParams,
  focalLaws: FocalLawConfig,
  specimen: SpecimenConfig,
  wedge: WedgeConfig,
  probeIndexX: number, // mm from weld center
  scanPosY: number, // mm along scan axis
  numSamples: number = 400,
  calState?: CalibrationState
): {
  samples: number[]; // 0 to 100% FSH
  rfSamples: number[]; // -100 to +100%
  soundpaths: number[]; // mm for each sample
} {
  const samples: number[] = new Array(numSamples).fill(0);
  const rfSamples: number[] = new Array(numSamples).fill(0);
  const soundpaths: number[] = new Array(numSamples).fill(0);

  const rad = (angleDeg * Math.PI) / 180;
  const maxSoundpath = params.range;
  const step = maxSoundpath / numSamples;
  const t = specimen.thickness;

  // System Gain multiplier (reference 30 dB is unity 1.0)
  const gainMultiplier = Math.pow(10, (params.gain - 30) / 20);

  // Filter & Noise Reduction Factor
  const filterCfg = params.filterConfig;
  const isFilterActive = filterCfg && filterCfg.enabled;
  const noiseAtten = isFilterActive ? 1.0 - (filterCfg.noiseReductionLevel / 100) * 0.88 : 1.0;

  // Filter Frequency Transfer Factor: check probe nominal center frequency (~5MHz)
  let filterTransfer = 1.0;
  if (isFilterActive && filterCfg.preset !== 'NONE') {
    const f0 = 5.0; // MHz probe fundamental
    if (f0 < filterCfg.lowCutoffMHz) {
      filterTransfer = Math.max(0.18, 1.0 - (filterCfg.lowCutoffMHz - f0) * 0.35);
    } else if (f0 > filterCfg.highCutoffMHz) {
      filterTransfer = Math.max(0.18, 1.0 - (f0 - filterCfg.highCutoffMHz) * 0.35);
    }
  }

  // 1. Electronic grass & grain noise (attenuated when filter is active)
  for (let i = 0; i < numSamples; i++) {
    soundpaths[i] = i * step;
    const rawNoise = (Math.random() * 2.5 + Math.sin(i * 0.4) * 0.8) * Math.min(1.5, gainMultiplier * 0.35);
    const noise = rawNoise * noiseAtten;
    samples[i] = noise;
    rfSamples[i] = (Math.random() - 0.5) * noise * 2;
  }

  // 2. Wedge interface echo (near origin S=0..4mm)
  const wedgePeakIndex = Math.round((wedge.heightFirstElement * 0.4) / step);
  if (wedgePeakIndex < numSamples) {
    const pulseWidthSamples = Math.max(3, Math.round(2.5 / step));
    for (let k = -pulseWidthSamples * 2; k <= pulseWidthSamples * 2; k++) {
      const idx = wedgePeakIndex + k;
      if (idx >= 0 && idx < numSamples) {
        const env = Math.exp(-Math.pow(k / pulseWidthSamples, 2));
        const amp = 18 * env;
        samples[idx] = Math.min(100, Math.max(samples[idx], amp));
        rfSamples[idx] += amp * Math.cos(k * 1.2);
      }
    }
  }

  // 3. Backwall Echo (Leg 1 reflection at S = t / cos(angle))
  const cosAngle = Math.cos(rad);
  if (cosAngle > 0.1) {
    const leg1BackwallSoundpath = t / cosAngle;
    const leg1Index = Math.round(leg1BackwallSoundpath / step);
    if (leg1Index < numSamples) {
      // Corner reflection off backwall or bevel
      const pulseWidthSamples = Math.max(4, Math.round(3.0 / step));
      // Attenuation drops with steeper angles
      const backwallReflectivity = Math.max(0.15, Math.cos(rad) * 0.85);
      const backwallTcgDb =
        calState?.tcgCalibrated && calState.tcgPoints?.length
          ? interpolateTcgGain(t, calState.tcgPoints)
          : 0;
      const backwallTcgMult = Math.pow(10, backwallTcgDb / 20);
      const peakAmp = 65 * backwallReflectivity * gainMultiplier * filterTransfer * backwallTcgMult;

      for (let k = -pulseWidthSamples * 3; k <= pulseWidthSamples * 3; k++) {
        const idx = leg1Index + k;
        if (idx >= 0 && idx < numSamples) {
          const env = Math.exp(-Math.pow(k / pulseWidthSamples, 2));
          const amp = peakAmp * env;
          samples[idx] = Math.min(105, Math.max(samples[idx], amp));
          rfSamples[idx] += amp * Math.cos(k * 0.95);
        }
      }
    }
  }

  // 4. Specimen Flaws & Indications
  for (const flaw of specimen.flaws) {
    // Check if probe scan position is within flaw length along Y-axis
    const yDist = Math.abs(scanPosY - flaw.yPosition);
    if (yDist > flaw.length / 2 + 6) continue; // Outside flaw scan range

    // Acoustic beam coordinates at flaw depth
    // In Leg 1: unrolled depth = flaw.depth
    // In Leg 2: unrolled depth = 2*t - flaw.depth
    const possibleDepths = [flaw.depth, 2 * t - flaw.depth];

    for (let leg = 1; leg <= 2; leg++) {
      const unrolledDepth = possibleDepths[leg - 1];
      const soundpathTarget = unrolledDepth / Math.cos(rad);
      if (soundpathTarget > maxSoundpath) continue;

      // Surface distance traveled by the sound beam
      const surfDist = soundpathTarget * Math.sin(rad);
      const beamPlateX = probeIndexX - surfDist; // Where beam arrives

      // Distance from beam axis to flaw X center
      const xMiss = Math.abs(beamPlateX - flaw.xOffset);

      // Beam width calculation (divergence ~ 3 to 6mm depending on angle)
      const beamHalfWidth = 2.5 + soundpathTarget * 0.05;

      if (xMiss <= beamHalfWidth * 2) {
        // High acoustic interaction!
        // Calculate orientation gain (specular reflection if beam hits flaw perpendicular)
        let orientationFactor = 1.0;
        if (flaw.type === 'lack_of_fusion') {
          // Aligned with bevel angle (e.g. 30°)
          const optimalAngle = 90 - specimen.bevelAngle; // 60°
          const angleDelta = Math.abs(angleDeg - optimalAngle);
          orientationFactor = Math.max(0.2, Math.exp(-Math.pow(angleDelta / 8, 2)));
        } else if (flaw.type === 'root_crack') {
          // Corner reflector with backwall -> sharp 45°-70° response
          orientationFactor = Math.max(0.4, Math.sin(rad));
        }

        const scanFactor = Math.exp(-Math.pow(yDist / (flaw.length / 2 + 1.5), 2));
        const spatialFactor = Math.exp(-Math.pow(xMiss / beamHalfWidth, 2));

        const flawTcgDb =
          calState?.tcgCalibrated && calState.tcgPoints?.length
            ? interpolateTcgGain(flaw.depth, calState.tcgPoints)
            : 0;
        const flawTcgMult = Math.pow(10, flawTcgDb / 20);

        const flawPeakAmp =
          75 *
          flaw.reflectivity *
          orientationFactor *
          scanFactor *
          spatialFactor *
          gainMultiplier *
          filterTransfer *
          flawTcgMult;

        const targetIdx = Math.round(soundpathTarget / step);
        const pulseWidthSamples = Math.max(4, Math.round(2.6 / step));

        for (let k = -pulseWidthSamples * 3; k <= pulseWidthSamples * 3; k++) {
          const idx = targetIdx + k;
          if (idx >= 0 && idx < numSamples) {
            const env = Math.exp(-Math.pow(k / pulseWidthSamples, 2));
            const echoVal = flawPeakAmp * env;
            samples[idx] = Math.min(115, Math.max(samples[idx], echoVal));
            rfSamples[idx] += echoVal * Math.cos(k * 1.1 + Math.PI / 4);
          }
        }
      }
    }
  }

  // 5. Digital Smoothing Filter
  if (filterCfg && filterCfg.smoothing) {
    const smoothed = [...samples];
    for (let i = 1; i < numSamples - 1; i++) {
      smoothed[i] = 0.25 * samples[i - 1] + 0.5 * samples[i] + 0.25 * samples[i + 1];
    }
    return { samples: smoothed, rfSamples, soundpaths };
  }

  return { samples, rfSamples, soundpaths };
}

/**
 * Calculates gate peak readings for an A-Scan trace
 */
export function evaluateGate(
  gate: GateConfig,
  samples: number[],
  soundpaths: number[],
  angleDeg: number,
  plateThickness: number,
  wedgeDelayMm: number
): GateReadings {
  if (!gate.enabled || samples.length === 0) {
    return {
      peakAmplitude: 0,
      soundpath: 0,
      trueDepth: 0,
      surfaceDistance: 0,
      probeFrontDistance: 0,
      beamAngle: angleDeg,
      alarmTriggered: false,
    };
  }

  const gateStart = gate.start;
  const gateEnd = gate.start + gate.width;
  let maxAmp = 0;
  let peakSoundpath = gateStart;

  for (let i = 0; i < samples.length; i++) {
    const s = soundpaths[i];
    if (s >= gateStart && s <= gateEnd) {
      if (samples[i] > maxAmp) {
        maxAmp = samples[i];
        peakSoundpath = s;
      }
    }
  }

  const rad = (angleDeg * Math.PI) / 180;
  const trueSoundpath = Math.max(0, peakSoundpath - wedgeDelayMm);
  const unrolledDepth = trueSoundpath * Math.cos(rad);
  const surfaceDist = trueSoundpath * Math.sin(rad);

  // Depth in plate
  const modDepth = unrolledDepth % (2 * plateThickness);
  const trueDepth = modDepth > plateThickness ? 2 * plateThickness - modDepth : modDepth;

  const alarmTriggered =
    gate.logic === 'POSITIVE' ? maxAmp >= gate.threshold : maxAmp < gate.threshold;

  return {
    peakAmplitude: Number(maxAmp.toFixed(1)),
    soundpath: Number(trueSoundpath.toFixed(1)),
    trueDepth: Number(trueDepth.toFixed(1)),
    surfaceDistance: Number(surfaceDist.toFixed(1)),
    probeFrontDistance: Number((surfaceDist - 12).toFixed(1)),
    beamAngle: angleDeg,
    alarmTriggered,
  };
}

/**
 * Calculates Near Field Length N (mm)
 * N = (D_eff^2 * f) / (4 * V)
 */
export function calculateNearField(
  effectiveDiamMm: number,
  frequencyMHz: number,
  velocityMPerS: number
): number {
  const wavelengthMm = (velocityMPerS / (frequencyMHz * 1e6)) * 1000;
  return Number(((effectiveDiamMm * effectiveDiamMm) / (4 * wavelengthMm)).toFixed(1));
}

/**
 * Calculates DGS / AVG curve amplitude (% FSH) at a given soundpath distance
 * according to Krautkrämer DGS diagram formulation for Flat Bottom Holes (FBH).
 */
export function calculateDgsCurveAmplitude(
  soundpathMm: number,
  fbhDiameterMm: number,
  nearFieldMm: number,
  nominalRefAmpPercent: number = 80,
  refFbhDiameterMm: number = 2.0,
  attenuationDbPerMm: number = 0.015
): number {
  if (soundpathMm <= 1.0) return nominalRefAmpPercent;

  // Normalized distance s = S / N
  const sNorm = soundpathMm / Math.max(1, nearFieldMm);

  // Far-field echo ratio scales as: A ~ (d_FBH / d_ref)^2 * (s_ref / s)
  // Transition smoothly from near field zone to far field decay (1/s)
  const farFieldFactor = 1.0 / Math.max(0.7, sNorm);
  const sizeFactor = Math.pow(fbhDiameterMm / refFbhDiameterMm, 2);

  // Material attenuation damping
  const attenuationFactor = Math.pow(10, -(attenuationDbPerMm * soundpathMm) / 20);

  const amp = nominalRefAmpPercent * sizeFactor * farFieldFactor * attenuationFactor;
  return Math.max(2, Math.min(105, amp));
}

/**
 * Evaluates Equivalent Reflector Size (ERS / ERC in mm FBH)
 * and delta dB relative to the selected DGS curve
 */
export function evaluateDgsFlawSizing(
  peakAmpPercent: number,
  peakSoundpathMm: number,
  dgsConfig: DgsConfig,
  nearFieldMm: number
): DgsEvaluation {
  if (peakAmpPercent <= 2.0 || peakSoundpathMm <= 2.0) {
    return {
      calculatedErsMm: 0,
      deltaDbFromCurve: -99,
      status: 'ACCEPT',
    };
  }

  // Target curve amplitude at this exact soundpath
  const curveAmpAtSoundpath = calculateDgsCurveAmplitude(
    peakSoundpathMm,
    dgsConfig.referenceSize,
    nearFieldMm,
    80,
    dgsConfig.referenceSize
  );

  // Delta dB between echo peak and DGS curve
  const deltaDb = 20 * Math.log10(Math.max(0.1, peakAmpPercent) / Math.max(0.1, curveAmpAtSoundpath));

  // In DGS: Amplitude scales with area of FBH, i.e., d_FBH^2
  // Therefore: d_ERS = d_ref * sqrt(A_echo / A_curve)
  const ampRatio = Math.max(0.01, peakAmpPercent / Math.max(1, curveAmpAtSoundpath));
  const calculatedErs = dgsConfig.referenceSize * Math.sqrt(ampRatio);
  const roundedErs = Number(calculatedErs.toFixed(2));

  const isReject = roundedErs >= dgsConfig.acceptanceLimitMm;

  return {
    calculatedErsMm: roundedErs,
    deltaDbFromCurve: Number(deltaDb.toFixed(1)),
    status: isReject ? 'REJECT' : 'ACCEPT',
  };
}

