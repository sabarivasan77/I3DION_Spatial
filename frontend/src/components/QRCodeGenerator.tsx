import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2 } from 'lucide-react';
import { useToast } from './Toast';

interface QRCodeGeneratorProps {
  url: string;
  logoUrl?: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ url, logoUrl, size = 256, className = '' }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgString, setSvgString] = useState<string>('');
  const { success, error: showError } = useToast();

  const finalLogoUrl = logoUrl || '/images/logos/03_icon_only.png';

  useEffect(() => {
    let isMounted = true;

    async function generate() {
      if (!canvasRef.current || !url) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        // High error correction needed when covering center
        await QRCode.toCanvas(canvas, url, {
          width: size,
          margin: 1,
          color: {
            dark: '#0f172a', // Deep Navy
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        });

        // Generate SVG string
        let svg = await QRCode.toString(url, {
          type: 'svg',
          width: size,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'H'
        });

        // Add logo to canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = finalLogoUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            // If custom org logo fails, try default
            if (finalLogoUrl !== '/images/logos/03_icon_only.png') {
              img.src = '/images/logos/03_icon_only.png';
              resolve(null);
            } else {
              reject(new Error('Logo load failed'));
            }
          };
        });

        if (!isMounted) return;

        const logoSize = size * 0.22; // Logo covers ~22% of QR (safe with 'H' error correction)
        const xy = (size - logoSize) / 2;
        
        // Draw white background circle/square for logo
        ctx.fillStyle = '#ffffff';
        const padding = logoSize * 0.1;
        ctx.fillRect(xy - padding, xy - padding, logoSize + padding * 2, logoSize + padding * 2);
        
        // Draw the logo
        ctx.drawImage(img, xy, xy, logoSize, logoSize);

        // Inject logo into SVG
        // Convert image to base64 for standalone SVG
        const logoCanvas = document.createElement('canvas');
        logoCanvas.width = img.width;
        logoCanvas.height = img.height;
        const lctx = logoCanvas.getContext('2d');
        if (lctx) {
          lctx.drawImage(img, 0, 0);
          const base64Logo = logoCanvas.toDataURL('image/png');
          
          // Insert image tag right before closing </svg>
          const insertIdx = svg.lastIndexOf('</svg>');
          if (insertIdx !== -1) {
            const imageTag = `<rect x="${xy - padding}" y="${xy - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" fill="#ffffff" />
            <image href="${base64Logo}" x="${xy}" y="${xy}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`;
            svg = svg.slice(0, insertIdx) + imageTag + svg.slice(insertIdx);
          }
        }

        setSvgString(svg);

      } catch (err) {
        console.error('QR Gen error', err);
      }
    }

    generate();

    return () => { isMounted = false; };
  }, [url, finalLogoUrl, size]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    downloadString(dataUrl, 'qr_code.png');
  };

  const handleDownloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadString(url, 'qr_code.svg');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'qrcode.png', { type: 'image/png' });
          await navigator.share({
            title: 'QR Code',
            url: url,
            files: [file]
          });
          success('Shared successfully');
        });
      } catch (err) {
        // Fallback or ignore
      }
    } else {
      navigator.clipboard.writeText(url);
      success('URL copied to clipboard');
    }
  };

  function downloadString(href: string, filename: string) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <canvas ref={canvasRef} className="rounded-lg" style={{ width: size, height: size }} />
      </div>
      
      <div className="flex gap-2 w-full justify-center">
        <button 
          onClick={handleDownloadPNG}
          className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
        >
          <Download size={14} /> PNG
        </button>
        <button 
          onClick={handleDownloadSVG}
          className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
        >
          <Download size={14} /> SVG
        </button>
        <button 
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          title="Share or Copy URL"
        >
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}
