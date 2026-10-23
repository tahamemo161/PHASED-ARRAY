/**
 * Sectorial Scan (S-Scan) Canvas View
 * Renders real-time polar fan beam sweep with ray grids, skip leg boundaries,
 * weld profile overlay, flaw acoustic indications, and touch-interactive cursor.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  UltrasonicParams,
  FocalLawConfig,
  SpecimenConfig,
  WedgeConfig,
  PaletteName,
  WeldFlaw,
} from '../types/paut';
import { getPaletteColor } from '../utils/physics';

interface SScanViewProps {
  params: UltrasonicParams;
  focalLaws: FocalLawConfig;
  specimen: SpecimenConfig;
  wedge: WedgeConfig;
  activeAngle: number;
  onAngleChange: (angle: number) => void;
  probeIndexX: number; // mm from weld center
  scanPosY: number; // mm along weld scan axis
  palette: PaletteName;
  showWeldOverlay: boolean;
  frozen: boolean;
  isArabic: boolean;
}

export const SScanView: React.FC<SScanViewProps> = ({
  params,
  focalLaws,
  specimen,
  wedge,
  activeAngle,
  onAngleChange,
  probeIndexX,
  scanPosY,
  palette,
  showWeldOverlay,
  frozen,
  isArabic,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{
    angle: number;
    soundpath: number;
    depth: number;
    surfaceDist: number;
  } | null>(null);

  // Redraw S-Scan canvas whenever parameters change
  const renderSScan = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark instrument background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Coordinate system: Origin of acoustic beam at top (representing wedge exit point)
    // Offset from left to allow sector fan room
    const originX = width * 0.22;
    const originY = 32;

    const maxRange = params.range; // mm (e.g. 70-80mm)
    const startAngle = focalLaws.startAngle; // e.g. 40°
    const stopAngle = focalLaws.stopAngle; // e.g. 70°
    const scale = (height - 60) / maxRange; // pixels per mm

    // 1. Draw polar fan background & acoustic field
    const startRad = (startAngle * Math.PI) / 180;
    const stopRad = (stopAngle * Math.PI) / 180;
    const maxRadius = maxRange * scale;

    ctx.save();
    // Clip to polar sector
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.arc(originX, originY, maxRadius, startRad, stopRad, false);
    ctx.closePath();
    ctx.clip();

    // Background field inside sector
    ctx.fillStyle = '#0a101d';
    ctx.fill();

    // 2. Synthesize S-Scan Heatmap Data (Discrete angle rays and soundpath bins)
    const numRays = Math.round((stopAngle - startAngle) / focalLaws.angleStep) + 1;
    const numBins = 160;
    const binStepMm = maxRange / numBins;
    const t = specimen.thickness;
    const gainFactor = Math.pow(10, (params.gain - 30) / 20);

    for (let r = 0; r < numRays; r++) {
      const angle = startAngle + r * focalLaws.angleStep;
      const angleRad = (angle * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      for (let b = 0; b < numBins; b++) {
        const soundpath = b * binStepMm;
        let amp = 0;

        // Baseline grain noise
        amp += (Math.random() * 2.5 + Math.sin(r * 0.3 + b * 0.2) * 1.5) * gainFactor * 0.3;

        // Backwall echo (Leg 1 reflection at depth t)
        if (cosA > 0.1) {
          const backwallSoundpath = t / cosA;
          const distToBackwall = Math.abs(soundpath - backwallSoundpath);
          if (distToBackwall < 2.5) {
            const env = Math.exp(-Math.pow(distToBackwall / 1.2, 2));
            amp += 65 * Math.max(0.2, cosA) * env * gainFactor;
          }
        }

        // Flaw interaction in S-Scan
        for (const flaw of specimen.flaws) {
          const yDist = Math.abs(scanPosY - flaw.yPosition);
          if (yDist > flaw.length / 2 + 5) continue;

          // Leg 1 and Leg 2
          const targetDepths = [flaw.depth, 2 * t - flaw.depth];
          for (let leg = 1; leg <= 2; leg++) {
            const unrolledDepth = targetDepths[leg - 1];
            const targetSoundpath = unrolledDepth / cosA;
            const distSoundpath = Math.abs(soundpath - targetSoundpath);

            if (distSoundpath < 3.5) {
              const surfDist = targetSoundpath * sinA;
              const beamPlateX = probeIndexX - surfDist;
              const xMiss = Math.abs(beamPlateX - flaw.xOffset);

              const beamWidth = 3.0 + targetSoundpath * 0.04;
              if (xMiss <= beamWidth * 1.8) {
                let orientFactor = 1.0;
                if (flaw.type === 'lack_of_fusion') {
                  const optAngle = 90 - specimen.bevelAngle;
                  orientFactor = Math.exp(-Math.pow((angle - optAngle) / 8, 2));
                } else if (flaw.type === 'root_crack') {
                  orientFactor = Math.sin(angleRad);
                }

                const sFactor = Math.exp(-Math.pow(yDist / (flaw.length / 2 + 1), 2));
                const xFactor = Math.exp(-Math.pow(xMiss / beamWidth, 2));
                const env = Math.exp(-Math.pow(distSoundpath / 1.4, 2));

                amp += 75 * flaw.reflectivity * orientFactor * sFactor * xFactor * env * gainFactor;
              }
            }
          }
        }

        if (amp > 5) {
          const [red, green, blue] = getPaletteColor(Math.min(100, amp), palette);
          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

          // Draw small polygon/quad for this angle ray bin
          const r1 = soundpath * scale;
          const r2 = (soundpath + binStepMm * 1.2) * scale;
          const halfAngle = ((focalLaws.angleStep * Math.PI) / 180) * 0.65;

          const a1 = angleRad - halfAngle;
          const a2 = angleRad + halfAngle;

          ctx.beginPath();
          ctx.arc(originX, originY, r1, a1, a2, false);
          ctx.arc(originX, originY, r2, a2, a1, true);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.restore(); // Restore clipping

    // 3. Draw Concentric Depth & Soundpath Grids
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Soundpath radial arcs (every 10mm or 20mm)
    const arcInterval = maxRange > 60 ? 20 : 10;
    for (let s = arcInterval; s <= maxRange; s += arcInterval) {
      const r = s * scale;
      ctx.beginPath();
      ctx.arc(originX, originY, r, startRad, stopRad, false);
      ctx.stroke();

      // Soundpath arc label
      const midAngle = (startAngle + stopAngle) / 2;
      const labelX = originX + r * Math.sin((midAngle * Math.PI) / 180);
      const labelY = originY + r * Math.cos((midAngle * Math.PI) / 180);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${s}mm`, labelX, labelY);
    }

    // Angle rays
    for (let a = Math.ceil(startAngle / 5) * 5; a <= stopAngle; a += 5) {
      const aRad = (a * Math.PI) / 180;
      const x1 = originX + maxRadius * Math.sin(aRad);
      const y1 = originY + maxRadius * Math.cos(aRad);

      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Angle label at perimeter
      ctx.fillStyle = a === activeAngle ? '#38bdf8' : '#94a3b8';
      ctx.font = a === activeAngle ? 'bold 11px JetBrains Mono' : '10px JetBrains Mono';
      ctx.fillText(`${a}°`, x1 + Math.sin(aRad) * 12, y1 + Math.cos(aRad) * 12);
    }

    // 4. Skip Leg 1 (Plate Thickness Backwall) & Skip Leg 2 (Top Surface) Lines
    // Leg 1 backwall: y = originY + t * scale
    const leg1Y = originY + t * scale;
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(originX - 10, leg1Y);
    ctx.lineTo(width - 20, leg1Y);
    ctx.stroke();

    ctx.fillStyle = '#eab308';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(isArabic ? `قاع اللوح (Leg 1) ${t}mm` : `Backwall (Leg 1) ${t}mm`, originX + 10, leg1Y - 4);

    // Leg 2 line (2 * t)
    const leg2Y = originY + 2 * t * scale;
    if (leg2Y < height - 10) {
      ctx.strokeStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(originX - 10, leg2Y);
      ctx.lineTo(width - 20, leg2Y);
      ctx.stroke();
      ctx.fillStyle = '#f97316';
      ctx.fillText(isArabic ? `سطح اللوح (Leg 2) ${2 * t}mm` : `Cap Surface (Leg 2) ${2 * t}mm`, originX + 10, leg2Y - 4);
    }
    ctx.setLineDash([]);

    // 5. Weld Profile Overlay (V-bevel, Root gap, Cap, HAZ)
    if (showWeldOverlay && specimen.type === 'butt_weld') {
      ctx.save();
      // Plate X = 0 is weld center
      // Probe index point is at probeIndexX mm from weld center
      // Therefore, weld center is located at:
      // X = originX + (probeIndexX * scale)
      const weldCenterX = originX + (probeIndexX * scale);

      ctx.strokeStyle = '#06b6d4';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1.5;

      const halfGap = specimen.rootGap / 2;
      const halfCap = specimen.capWidth / 2;
      const rootY = originY + t * scale;
      const topY = originY;

      // Draw Groove Bevel Lines according to grooveType
      const gType = specimen.grooveType || 'single_v';
      ctx.beginPath();

      if (gType === 'double_v') {
        const midY = topY + (t * scale) / 2;
        // Top V
        ctx.moveTo(weldCenterX - halfCap * scale, topY);
        ctx.lineTo(weldCenterX - halfGap * scale, midY - (specimen.rootFace * scale) / 2);
        ctx.lineTo(weldCenterX - halfGap * scale, midY + (specimen.rootFace * scale) / 2);
        // Bottom V
        ctx.lineTo(weldCenterX - halfCap * 0.85 * scale, rootY);
        ctx.lineTo(weldCenterX + halfCap * 0.85 * scale, rootY);
        ctx.lineTo(weldCenterX + halfGap * scale, midY + (specimen.rootFace * scale) / 2);
        ctx.lineTo(weldCenterX + halfGap * scale, midY - (specimen.rootFace * scale) / 2);
        ctx.lineTo(weldCenterX + halfCap * scale, topY);
      } else if (gType === 'single_u') {
        const rad = (specimen.uRadius || 5.0) * scale;
        ctx.moveTo(weldCenterX - halfCap * scale, topY);
        ctx.lineTo(weldCenterX - halfGap * scale - rad * 0.4, rootY - specimen.rootFace * scale - rad);
        ctx.quadraticCurveTo(weldCenterX - halfGap * scale, rootY - specimen.rootFace * scale, weldCenterX - halfGap * scale, rootY);
        ctx.lineTo(weldCenterX + halfGap * scale, rootY);
        ctx.quadraticCurveTo(weldCenterX + halfGap * scale, rootY - specimen.rootFace * scale, weldCenterX + halfGap * scale + rad * 0.4, rootY - specimen.rootFace * scale - rad);
        ctx.lineTo(weldCenterX + halfCap * scale, topY);
      } else {
        // Standard single_v and j_groove
        ctx.moveTo(weldCenterX - halfCap * scale, topY);
        ctx.lineTo(weldCenterX - halfGap * scale, rootY - specimen.rootFace * scale);
        ctx.lineTo(weldCenterX - halfGap * scale, rootY);
        ctx.lineTo(weldCenterX + halfGap * scale, rootY);
        ctx.lineTo(weldCenterX + halfGap * scale, rootY - specimen.rootFace * scale);
        ctx.lineTo(weldCenterX + halfCap * scale, topY);
      }

      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Weld centerline
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(weldCenterX, topY - 10);
      ctx.lineTo(weldCenterX, rootY + 10);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(isArabic ? 'مركز اللحام' : 'Weld Center', weldCenterX + 4, topY + 12);

      // Draw Flaw Icons on the Weld Overlay
      for (const flaw of specimen.flaws) {
        const yDist = Math.abs(scanPosY - flaw.yPosition);
        if (yDist < flaw.length / 2 + 2) {
          const fx = weldCenterX + (flaw.xOffset * scale);
          const fy = originY + (flaw.depth * scale);

          ctx.fillStyle = '#ff2b2b';
          ctx.beginPath();
          ctx.arc(fx, fy, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '9px JetBrains Mono';
          ctx.fillText(flaw.name.slice(0, 14), fx + 6, fy - 2);
        }
      }

      ctx.restore();
    }

    // 6. Active Angle Ray Cursor (Bright Cyan Line with Pointer)
    const curRad = (activeAngle * Math.PI) / 180;
    const curX = originX + maxRadius * Math.sin(curRad);
    const curY = originY + maxRadius * Math.cos(curRad);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    // Beam pointer dot
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // 7. Touch / Hover Crosshair Tooltip
    if (hoverCoord) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      const boxW = 160;
      const boxH = 58;
      const boxX = Math.min(width - boxW - 10, Math.max(10, curX - boxW / 2));
      const boxY = Math.max(10, curY - boxH - 12);

      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Angle (LA): ${hoverCoord.angle.toFixed(1)}°`, boxX + 8, boxY + 16);
      ctx.fillText(`Soundpath (SA): ${hoverCoord.soundpath.toFixed(1)} mm`, boxX + 8, boxY + 30);
      ctx.fillText(`True Depth (DA): ${hoverCoord.depth.toFixed(1)} mm`, boxX + 8, boxY + 44);
    }
  }, [
    params,
    focalLaws,
    specimen,
    wedge,
    activeAngle,
    probeIndexX,
    scanPosY,
    palette,
    showWeldOverlay,
    hoverCoord,
    isArabic,
  ]);

  // Handle touch or mouse interaction to select angle and position
  const handlePointerInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const originX = canvas.width * 0.22;
    const originY = 32;

    const dx = x - originX;
    const dy = y - originY;

    // Angle from vertical: dy = R * cos(theta), dx = R * sin(theta)
    const angleRad = Math.atan2(dx, dy);
    let angleDeg = (angleRad * 180) / Math.PI;

    // Clamp to focal law limits
    angleDeg = Math.max(focalLaws.startAngle, Math.min(focalLaws.stopAngle, angleDeg));
    const roundedAngle = Math.round(angleDeg / focalLaws.angleStep) * focalLaws.angleStep;
    onAngleChange(roundedAngle);

    // Compute soundpath from distance to origin
    const scale = (canvas.height - 60) / params.range;
    const soundpathMm = Math.sqrt(dx * dx + dy * dy) / scale;
    const rad = (roundedAngle * Math.PI) / 180;
    const apparentDepth = soundpathMm * Math.cos(rad);
    const modDepth = apparentDepth % (2 * specimen.thickness);
    const trueDepth = modDepth > specimen.thickness ? 2 * specimen.thickness - modDepth : modDepth;

    setHoverCoord({
      angle: roundedAngle,
      soundpath: soundpathMm,
      depth: trueDepth,
      surfaceDist: soundpathMm * Math.sin(rad),
    });
  };

  useEffect(() => {
    renderSScan();
  }, [renderSScan]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      {/* S-Scan Top Banner */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-cyan-400">
            {isArabic ? 'المسح القطاعي S-Scan' : 'S-Scan (Sectorial)'}
          </span>
          <span className="text-slate-400 font-mono">
            {focalLaws.startAngle}° - {focalLaws.stopAngle}° ({focalLaws.angleStep}° step)
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-emerald-400 font-mono font-semibold">
            {isArabic ? `الزاوية الحالية: ${activeAngle}°` : `Active: ${activeAngle}°`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>T: {specimen.thickness}mm</span>
          <span>·</span>
          <span>Index: {probeIndexX}mm</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[280px]">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={(e) => handlePointerInteraction(e.clientX, e.clientY)}
          onPointerMove={(e) => {
            if (e.buttons === 1) {
              handlePointerInteraction(e.clientX, e.clientY);
            }
          }}
          onPointerLeave={() => setHoverCoord(null)}
        />

        {/* Quick Angle Stepper Buttons for Mobile/Tablet */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm p-1 rounded-md border border-slate-800 shadow-md">
          <button
            onClick={() => onAngleChange(Math.max(focalLaws.startAngle, activeAngle - 1))}
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 font-bold font-mono text-sm"
            title="Decrease 1°"
          >
            -1°
          </button>
          <div className="px-2 py-1 font-mono font-bold text-cyan-400 text-xs">
            {activeAngle}°
          </div>
          <button
            onClick={() => onAngleChange(Math.min(focalLaws.stopAngle, activeAngle + 1))}
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 font-bold font-mono text-sm"
            title="Increase 1°"
          >
            +1°
          </button>
        </div>
      </div>
    </div>
  );
};
