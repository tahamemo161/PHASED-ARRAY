/**
 * C-Scan (Top-down Plan View) Canvas View
 * Displays encoded scan length vs angle / index axis,
 * flaw length sizing, and real-time scanner carriage tracking.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  SpecimenConfig,
  FocalLawConfig,
  PaletteName,
  UltrasonicParams,
} from '../types/paut';
import { getPaletteColor } from '../utils/physics';

interface CScanViewProps {
  specimen: SpecimenConfig;
  focalLaws: FocalLawConfig;
  params: UltrasonicParams;
  scanPosY: number;
  probeIndexX: number;
  palette: PaletteName;
  onScanPosChange: (y: number) => void;
  isArabic: boolean;
}

export const CScanView: React.FC<CScanViewProps> = ({
  specimen,
  focalLaws,
  params,
  scanPosY,
  probeIndexX,
  palette,
  onScanPosChange,
  isArabic,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderCScan = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 45;
    const padRight = 15;
    const padTop = 15;
    const padBottom = 25;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxScanLen = specimen.length; // e.g. 250mm
    const startAngle = focalLaws.startAngle;
    const stopAngle = focalLaws.stopAngle;

    // 1. Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Scan Length Ticks (X-Axis)
    const scanStep = 50;
    for (let s = 0; s <= maxScanLen; s += scanStep) {
      const x = padLeft + (s / maxScanLen) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${s}`, x, height - padBottom + 16);
    }

    // Angle Ticks (Y-Axis)
    for (let a = startAngle; a <= stopAngle; a += 10) {
      const y = padTop + ((a - startAngle) / (stopAngle - startAngle)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`${a}°`, padLeft - 6, y + 4);
    }

    // 2. Synthesize C-Scan Amplitude Surface
    const numX = 120;
    const numY = 40;
    const cellW = plotW / numX;
    const cellH = plotH / numY;

    for (let ix = 0; ix < numX; ix++) {
      const sX = (ix / numX) * maxScanLen;

      for (let iy = 0; iy < numY; iy++) {
        const angle = startAngle + (iy / numY) * (stopAngle - startAngle);
        let amp = Math.random() * 6; // Background noise

        // Flaw indications on C-Scan
        for (const flaw of specimen.flaws) {
          const yDist = Math.abs(sX - flaw.yPosition);
          if (yDist <= flaw.length / 2 + 1.5) {
            // Check angle response
            let angAmp = 0;
            if (flaw.type === 'lack_of_fusion') {
              const optAngle = 90 - specimen.bevelAngle;
              angAmp = Math.exp(-Math.pow((angle - optAngle) / 8, 2));
            } else {
              angAmp = Math.sin((angle * Math.PI) / 180);
            }

            const xLenFactor = Math.exp(-Math.pow(yDist / (flaw.length / 2), 2));
            amp += 80 * flaw.reflectivity * angAmp * xLenFactor;
          }
        }

        if (amp > 8) {
          const [r, g, b] = getPaletteColor(Math.min(100, amp), palette);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(padLeft + ix * cellW, padTop + iy * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // 3. Current Scanner Position Cursor (Yellow Hairline)
    const curX = padLeft + (scanPosY / maxScanLen) * plotW;
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, height - padBottom);
    ctx.stroke();

    // Probe carriage icon
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX - 6, padTop - 8);
    ctx.lineTo(curX + 6, padTop - 8);
    ctx.closePath();
    ctx.fill();

    // Position text
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`${scanPosY.toFixed(0)}mm`, curX, padTop - 12);
  }, [specimen, focalLaws, params, scanPosY, probeIndexX, palette]);

  const handlePointer = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const padLeft = 45;
    const padRight = 15;
    const plotW = canvas.width - padLeft - padRight;

    const clampedX = Math.max(padLeft, Math.min(padLeft + plotW, x));
    const newY = ((clampedX - padLeft) / plotW) * specimen.length;
    onScanPosChange(Number(newY.toFixed(1)));
  };

  useEffect(() => {
    renderCScan();
  }, [renderCScan]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-amber-400">
            {isArabic ? 'المسح السطحي C-Scan (المشفر)' : 'C-Scan (Encoded Top View)'}
          </span>
          <span className="text-slate-400 font-mono">
            Axis: 0 - {specimen.length} mm
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Encoder 1: Active</span>
          <span>·</span>
          <span className="text-amber-400">Pos: {scanPosY.toFixed(1)} mm</span>
        </div>
      </div>

      <div className="relative flex-1 w-full h-full min-h-[140px]">
        <canvas
          ref={canvasRef}
          width={700}
          height={200}
          className="w-full h-full cursor-ew-resize touch-none"
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons === 1) handlePointer(e);
          }}
        />
      </div>
    </div>
  );
};
