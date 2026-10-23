/**
 * Weld Joint Cross-Section & Acoustic Ray-Tracing Simulator
 * Renders the physical wedge, phased array transducer elements,
 * Snell's law refraction, skip legs off backwall, and flaw echo returns.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  SpecimenConfig,
  WedgeConfig,
  ProbeConfig,
  FocalLawConfig,
} from '../types/paut';

interface WeldSimulatorViewProps {
  specimen: SpecimenConfig;
  wedge: WedgeConfig;
  probe: ProbeConfig;
  focalLaws: FocalLawConfig;
  activeAngle: number;
  probeIndexX: number; // mm from weld centerline (center is 0)
  onProbeIndexChange: (x: number) => void;
  scanPosY: number;
  onScanPosChange: (y: number) => void;
  isAutoScanning: boolean;
  onToggleAutoScan: () => void;
  isArabic: boolean;
}

export const WeldSimulatorView: React.FC<WeldSimulatorViewProps> = ({
  specimen,
  wedge,
  probe,
  focalLaws,
  activeAngle,
  probeIndexX,
  onProbeIndexChange,
  scanPosY,
  onScanPosChange,
  isAutoScanning,
  onToggleAutoScan,
  isArabic,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderWeldScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark technical canvas
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Scale and coordinate mapping
    // Center of weld is at width * 0.45
    const weldCenterX = width * 0.48;
    const plateTopY = height * 0.38;
    const scale = 5.2; // pixels per mm
    const plateBottomY = plateTopY + specimen.thickness * scale;

    // 1. Draw Carbon Steel Base Metal Plate
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;

    // Left plate half
    ctx.beginPath();
    ctx.rect(20, plateTopY, weldCenterX - specimen.capWidth * 0.5 * scale - 20, specimen.thickness * scale);
    ctx.fill();
    ctx.stroke();

    // Right plate half
    const rightStart = weldCenterX + specimen.capWidth * 0.5 * scale;
    ctx.beginPath();
    ctx.rect(rightStart, plateTopY, width - rightStart - 20, specimen.thickness * scale);
    ctx.fill();
    ctx.stroke();

    // 2. Draw Weld Metal & Bevel (V-Groove, Double-V, or Single-U geometry)
    ctx.fillStyle = '#263346';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.8;

    const halfCap = (specimen.capWidth / 2) * scale;
    const halfGap = (specimen.rootGap / 2) * scale;
    const rootFaceH = specimen.rootFace * scale;
    const gType = specimen.grooveType || 'single_v';

    ctx.beginPath();
    // Cap crown on top
    ctx.moveTo(weldCenterX - halfCap, plateTopY);
    ctx.quadraticCurveTo(weldCenterX, plateTopY - specimen.capHeight * scale, weldCenterX + halfCap, plateTopY);

    if (gType === 'double_v') {
      const midY = plateTopY + (specimen.thickness * scale) / 2;
      // Right bevel top
      ctx.lineTo(weldCenterX + halfGap, midY - rootFaceH / 2);
      ctx.lineTo(weldCenterX + halfGap, midY + rootFaceH / 2);
      // Right bevel bottom
      ctx.lineTo(weldCenterX + halfCap * 0.85, plateBottomY);
      // Bottom cap underbead
      ctx.quadraticCurveTo(weldCenterX, plateBottomY + specimen.capHeight * 0.8 * scale, weldCenterX - halfCap * 0.85, plateBottomY);
      // Left bevel bottom
      ctx.lineTo(weldCenterX - halfGap, midY + rootFaceH / 2);
      ctx.lineTo(weldCenterX - halfGap, midY - rootFaceH / 2);
      // Left bevel top
      ctx.lineTo(weldCenterX - halfCap, plateTopY);
    } else if (gType === 'single_u') {
      const rad = (specimen.uRadius || 5.0) * scale;
      ctx.lineTo(weldCenterX + halfGap + rad * 0.4, plateBottomY - rootFaceH - rad);
      ctx.quadraticCurveTo(weldCenterX + halfGap, plateBottomY - rootFaceH, weldCenterX + halfGap, plateBottomY);
      ctx.quadraticCurveTo(weldCenterX, plateBottomY + 1.2 * scale, weldCenterX - halfGap, plateBottomY);
      ctx.quadraticCurveTo(weldCenterX - halfGap, plateBottomY - rootFaceH, weldCenterX - halfGap - rad * 0.4, plateBottomY - rootFaceH - rad);
      ctx.lineTo(weldCenterX - halfCap, plateTopY);
    } else {
      // Standard Single-V
      ctx.lineTo(weldCenterX + halfGap, plateBottomY - rootFaceH);
      ctx.lineTo(weldCenterX + halfGap, plateBottomY);
      // Root underbead
      ctx.quadraticCurveTo(weldCenterX, plateBottomY + 1.2 * scale, weldCenterX - halfGap, plateBottomY);
      // Left bevel
      ctx.lineTo(weldCenterX - halfGap, plateBottomY - rootFaceH);
      ctx.lineTo(weldCenterX - halfCap, plateTopY);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heat Affected Zone (HAZ) dashed outlines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(weldCenterX - halfCap - 12, plateTopY);
    ctx.lineTo(weldCenterX - halfGap - 8, plateBottomY);
    ctx.moveTo(weldCenterX + halfCap + 12, plateTopY);
    ctx.lineTo(weldCenterX + halfGap + 8, plateBottomY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Weld centerline
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(weldCenterX, plateTopY - 24);
    ctx.lineTo(weldCenterX, plateBottomY + 24);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('CL', weldCenterX, plateTopY - 28);

    // 3. Draw Flaws inside Weld Joint
    for (const flaw of specimen.flaws) {
      const yDist = Math.abs(scanPosY - flaw.yPosition);
      const isNearScanPos = yDist <= flaw.length / 2 + 1;

      const fx = weldCenterX + flaw.xOffset * scale;
      const fy = plateTopY + flaw.depth * scale;

      // Glow if currently illuminated
      if (isNearScanPos) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(fx, fy, 12, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = isNearScanPos ? '#ff2b2b' : '#94a3b8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;

      if (flaw.type === 'root_crack') {
        // Vertical crack notch
        ctx.beginPath();
        ctx.moveTo(fx, fy - 6);
        ctx.lineTo(fx, fy + 6);
        ctx.stroke();
      } else if (flaw.type === 'lack_of_fusion') {
        // Angled planar defect along bevel
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate((-specimen.bevelAngle * Math.PI) / 180);
        ctx.beginPath();
        ctx.rect(-6, -1.5, 12, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        // Volumetric round defect / SDH
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = isNearScanPos ? '#ffffff' : '#64748b';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(flaw.name.split(' ')[0], fx, fy - 8);
    }

    // 4. Draw Physical Rexolite Wedge & Probe
    // Probe index point is at probeIndexX mm from weld center
    // We assume probe is positioned on left side of weld, pointing towards weld center
    const probeX = weldCenterX - probeIndexX * scale;
    const wedgeExitX = probeX; // Beam exit point
    const wedgeW = wedge.length * scale;
    const wedgeH = wedge.heightFirstElement * 2.2 * scale;

    ctx.save();
    // Rexolite translucent amber wedge body
    ctx.fillStyle = 'rgba(217, 119, 6, 0.28)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    // Slanted wedge contour
    const wedgeFrontX = wedgeExitX + (wedge.length - wedge.indexOffset) * scale;
    const wedgeBackX = wedgeExitX - wedge.indexOffset * scale;

    ctx.moveTo(wedgeFrontX, plateTopY);
    ctx.lineTo(wedgeBackX, plateTopY);
    ctx.lineTo(wedgeBackX, plateTopY - wedgeH);
    ctx.lineTo(wedgeFrontX - 8, plateTopY - 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Probe housing on wedge top face
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    // Transducer element array
    const elemCount = probe.elementCount;
    const elemPitch = (probe.pitch * scale * 0.9);
    const arrayStartX = wedgeBackX + 10;
    const arrayStartY = plateTopY - wedgeH + 6;

    for (let e = 0; e < Math.min(16, elemCount); e++) {
      ctx.fillStyle = e % 2 === 0 ? '#38bdf8' : '#0284c7';
      ctx.fillRect(arrayStartX + e * (elemPitch + 0.8), arrayStartY, elemPitch, 6);
    }

    // Probe label
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`${probe.id}`, wedgeBackX + 2, plateTopY - wedgeH - 6);

    ctx.restore();

    // 5. Ultrasonic Sound Rays Fan (Acoustic Beam Simulation)
    // Draw sector rays from wedgeExitX
    const angles = [focalLaws.startAngle, 50, 55, 60, focalLaws.stopAngle];

    for (const ang of angles) {
      const isActive = Math.abs(ang - activeAngle) < 1.0;
      const angRad = (ang * Math.PI) / 180;
      const cosA = Math.cos(angRad);
      const sinA = Math.sin(angRad);

      ctx.strokeStyle = isActive ? '#00f0ff' : 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = isActive ? 2.2 : 1;

      // Leg 1: from wedge exit to backwall
      const leg1Path = specimen.thickness / cosA;
      const leg1Dx = leg1Path * sinA * scale;
      const leg1EndPtX = wedgeExitX + leg1Dx;
      const leg1EndPtY = plateBottomY;

      ctx.beginPath();
      ctx.moveTo(wedgeExitX, plateTopY);
      ctx.lineTo(leg1EndPtX, leg1EndPtY);
      ctx.stroke();

      // Leg 2: bounce off backwall towards top surface
      const leg2Path = specimen.thickness / cosA;
      const leg2Dx = leg2Path * sinA * scale;
      const leg2EndPtX = leg1EndPtX + leg2Dx;
      const leg2EndPtY = plateTopY;

      ctx.strokeStyle = isActive ? 'rgba(0, 240, 255, 0.65)' : 'rgba(6, 182, 212, 0.15)';
      ctx.setLineDash(isActive ? [4, 3] : [2, 4]);
      ctx.beginPath();
      ctx.moveTo(leg1EndPtX, leg1EndPtY);
      ctx.lineTo(leg2EndPtX, leg2EndPtY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highlight active ray wave packets
      if (isActive) {
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(leg1EndPtX, leg1EndPtY, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${ang}°`, leg1EndPtX, leg1EndPtY + 16);
      }
    }

    // 6. Index Scale Ruler on Plate Surface
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, plateTopY - 2);
    ctx.lineTo(width - 20, plateTopY - 2);
    ctx.stroke();

    for (let x = -80; x <= 80; x += 10) {
      const px = weldCenterX + x * scale;
      if (px > 20 && px < width - 20) {
        const isMajor = x % 20 === 0;
        ctx.beginPath();
        ctx.moveTo(px, plateTopY - 2);
        ctx.lineTo(px, plateTopY - (isMajor ? 10 : 5));
        ctx.stroke();

        if (isMajor) {
          ctx.fillStyle = '#64748b';
          ctx.font = '8px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.abs(x)}`, px, plateTopY - 12);
        }
      }
    }
  }, [
    specimen,
    wedge,
    probe,
    focalLaws,
    activeAngle,
    probeIndexX,
    scanPosY,
  ]);

  // Touch/drag handler to slide probe across plate surface
  const handlePointerDrag = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const weldCenterX = canvas.width * 0.48;
    const scale = 5.2;

    // Probe index distance from weld center
    const newIndexMm = (weldCenterX - x) / scale;
    const clampedIndex = Math.max(10, Math.min(80, newIndexMm));
    onProbeIndexChange(Number(clampedIndex.toFixed(1)));
  };

  useEffect(() => {
    renderWeldScene();
  }, [renderWeldScene]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-cyan-400">
            {isArabic ? 'محاكي مسار الموجات ودرز اللحام' : 'Acoustic Ray-Tracing & Weld Joint'}
          </span>
          <span className="text-slate-400 font-mono">
            T: {specimen.thickness}mm | Bevel: {specimen.bevelAngle}°
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoScan}
            className={`px-3 py-1 rounded text-xs font-medium font-mono transition-colors ${
              isAutoScanning
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold'
            }`}
          >
            {isAutoScanning
              ? isArabic
                ? 'إيقاف الفاحص الآلي'
                : 'Stop Scanner'
              : isArabic
                ? 'بدء الزاحف الآلي'
                : 'Start Crawler'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[220px]">
        <canvas
          ref={canvasRef}
          width={800}
          height={340}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDrag}
          onPointerMove={(e) => {
            if (e.buttons === 1) handlePointerDrag(e);
          }}
        />

        {/* Floating Probe Position Slider Bar */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">
              {isArabic ? 'إزاحة البروب (Index X):' : 'Probe Index (X):'}
            </span>
            <span className="text-slate-200 tabular-nums">{probeIndexX.toFixed(1)} mm</span>
          </div>

          <div className="flex-1 max-w-xs flex items-center gap-2">
            <input
              type="range"
              min={10}
              max={75}
              step={0.5}
              value={probeIndexX}
              onChange={(e) => onProbeIndexChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">
              {isArabic ? 'موضع المسح (Scan Y):' : 'Scan (Y):'}
            </span>
            <span className="text-slate-200 tabular-nums">{scanPosY.toFixed(1)} mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
