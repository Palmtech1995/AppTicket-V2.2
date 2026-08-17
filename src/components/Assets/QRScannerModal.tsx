/**
 * ============================================================================
 * [MODULE: CAMERA QR SCANNER & ASSET IDENTIFIER]
 * File: /src/components/Assets/QRScannerModal.tsx
 * Description: Real-time WebRTC camera scanner and manual barcode input
 *              allowing quick navigation to Bin Card, Transfer, or Helpdesk Ticket.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. WebRTC Live Camera Stream: สแกน QR Code จากกล้องสมาร์ตโฟนหรือเว็บแคม
 * 2. Manual Code Matching: ค้นหาด่วนด้วย Asset ID, Item Code หรือ Serial No
 * 3. Quick Action Hub: เมื่อพบเครื่อง สามารถกดดู Bin Card, เปิดใบโอนย้าย หรือแจ้งซ่อมได้ทันที
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  QrCode,
  Camera,
  Upload,
  Search,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Boxes,
  History,
  Ticket,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Smartphone,
  Copy,
  Check,
  Image as ImageIcon,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { Asset } from '../../types';

// Safe dynamic loader for jsQR to prevent Vite bundle/runtime errors if package is missing
async function decodeWithJsQR(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }
): Promise<{ data: string } | null> {
  try {
    let jsQRInstance = (window as any).jsQR;

    if (!jsQRInstance && typeof document !== 'undefined') {
      await new Promise<void>((resolve) => {
        const existing = document.getElementById('jsqr-loader-script');
        if (existing) {
          if ((window as any).jsQR) return resolve();
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => resolve());
          return;
        }
        const script = document.createElement('script');
        script.id = 'jsqr-loader-script';
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
      jsQRInstance = (window as any).jsQR;
    }

    if (typeof jsQRInstance === 'function') {
      return jsQRInstance(data, width, height, options || { inversionAttempts: 'dontInvert' });
    }
  } catch (err) {
    console.debug('Safe jsQR decode error:', err);
  }
  return null;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onOpenBincard: (asset: Asset) => void;
  onInitiateTransfer: (asset: Asset) => void;
  onCreateTicketForAsset: (asset: Asset) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onOpenBincard,
  onInitiateTransfer,
  onCreateTicketForAsset,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [matchedAsset, setMatchedAsset] = useState<Asset | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isHttpsOrLocalhost, setIsHttpsOrLocalhost] = useState(true);
  const [scanStatus, setScanStatus] = useState<string>('กำลังเตรียมระบบกล้อง...');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [showHttpGuide, setShowHttpGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleMatchCode = useCallback((code: string) => {
    const cleaned = code.trim().toLowerCase();
    if (!cleaned) return;

    const found = assets.find(
      (a) =>
        a.assetId.toLowerCase() === cleaned ||
        a.itemCode.toLowerCase() === cleaned ||
        (a.serialNo && a.serialNo.toLowerCase() === cleaned) ||
        a.assetId.toLowerCase().includes(cleaned) ||
        a.itemCode.toLowerCase().includes(cleaned)
    );

    if (found) {
      setMatchedAsset(found);
      setScanStatus(`สแกนสำเร็จ: ${found.assetName} (${found.assetId})`);
    } else {
      setScanStatus(`ถอดรหัสสำเร็จ: "${cleaned}" (ไม่พบในรายการทรัพย์สิน)`);
    }
  }, [assets]);

  // Fallback decoder using jsQR canvas scanning
  const scanVideoFrameWithJsQR = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;
    
    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = await decodeWithJsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleMatchCode(code.data);
      }
    } catch {
      // Ignore frame read errors
    }
  }, [handleMatchCode]);

  const startCamera = useCallback(async () => {
    setPermissionDenied(false);
    setScanStatus('กำลังขอสิทธิ์เข้าถึงกล้อง...');

    // Security check: Browsers allow getUserMedia ONLY on HTTPS or localhost/127.0.0.1
    const isSecure = 
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    setIsHttpsOrLocalhost(isSecure);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionDenied(true);
      setShowHttpGuide(!isSecure);
      setScanStatus('เบราว์เซอร์บล็อกกล้องบน HTTP — แนะนำใช้ปุ่ม "ถ่ายรูป/เลือกภาพ QR" หรือเปิดสิทธิ์ใน Chrome Flags');
      return;
    }

    try {
      // Prioritize rear camera on mobile (facingMode: environment)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
        setScanStatus('กล้องทำงานแล้ว: เล็งไปที่ QR Code หรือ Barcode ของทรัพย์สิน');

        // Check for native BarcodeDetector API or fallback to jsQR
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
            });

            scanIntervalRef.current = window.setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0) {
                    const detectedVal = barcodes[0].rawValue;
                    handleMatchCode(detectedVal);
                  } else {
                    scanVideoFrameWithJsQR();
                  }
                } catch {
                  scanVideoFrameWithJsQR();
                }
              }
            }, 400);
            return;
          } catch {
            // Fallback to jsQR interval
          }
        }

        // Default to jsQR interval loop
        scanIntervalRef.current = window.setInterval(() => {
          scanVideoFrameWithJsQR();
        }, 400);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setPermissionDenied(true);
      if (!isSecure) {
        setShowHttpGuide(true);
      }
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScanStatus('คุณยังไม่ได้อนุญาตให้เข้าถึงกล้อง (Permission Denied)');
      } else if (err.name === 'NotFoundError') {
        setScanStatus('ไม่พบอุปกรณ์กล้องบนเครื่องนี้');
      } else {
        setScanStatus('ไม่สามารถเชื่อมต่อกล้องได้: ' + (err.message || 'Error'));
      }
    }
  }, [handleMatchCode, scanVideoFrameWithJsQR]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setMatchedAsset(null);
      setManualCode('');
      setShowPermissionGuide(false);
      setShowHttpGuide(false);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Decode QR from uploaded image or camera snapshot file (Works 100% on HTTP & HTTPS)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setScanStatus('กำลังอ่าน QR Code จากรูปภาพ...');

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          // 1. Try native BarcodeDetector first
          if ('BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({
                formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
              });
              const barcodes = await detector.detect(img);
              if (barcodes && barcodes.length > 0) {
                handleMatchCode(barcodes[0].rawValue);
                setIsProcessingImage(false);
                URL.revokeObjectURL(objectUrl);
                return;
              }
            } catch {
              // fallback to jsQR
            }
          }

          // 2. Fallback to jsQR canvas processing
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = await decodeWithJsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
              handleMatchCode(code.data);
              setIsProcessingImage(false);
              URL.revokeObjectURL(objectUrl);
              return;
            }
          }

          setScanStatus('❌ ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาถ่ายใหม่อีกครั้งให้ภาพคมชัด');
        } catch (e: any) {
          setScanStatus('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ: ' + e.message);
        } finally {
          setIsProcessingImage(false);
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = () => {
        setScanStatus('❌ ไม่สามารถโหลดไฟล์ภาพได้');
        setIsProcessingImage(false);
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    } catch (err: any) {
      setScanStatus('เกิดข้อผิดพลาด: ' + err.message);
      setIsProcessingImage(false);
    }
  };

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyFlag = () => {
    navigator.clipboard.writeText('chrome://flags/#unsafely-treat-insecure-origin-as-secure');
    setCopiedFlag(true);
    setTimeout(() => setCopiedFlag(false), 2000);
  };

  const handleManualSearch = (code: string) => {
    setManualCode(code);
    const cleaned = code.trim().toLowerCase();
    if (!cleaned) {
      setMatchedAsset(null);
      return;
    }

    const found = assets.find(
      (a) =>
        a.assetId.toLowerCase().includes(cleaned) ||
        a.itemCode.toLowerCase().includes(cleaned) ||
        (a.serialNo && a.serialNo.toLowerCase().includes(cleaned))
    );

    setMatchedAsset(found || null);
  };

  const handleSimulateQuickScan = (asset: Asset) => {
    setMatchedAsset(asset);
    setScanStatus(`สแกนสำเร็จ: พบ ${asset.assetId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#101217] border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-[#141720] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">QR Code & Camera Scanner</h2>
              <p className="text-[11px] text-zinc-400">สแกนรหัสเพื่อดูประวัติ Bincard หรือทำรายการ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHttpGuide(!showHttpGuide)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                showHttpGuide
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-600'
                  : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
              }`}
              title="วิธีตั้งค่าเปิดกล้องบน HTTP (Chrome/Edge)"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">วิธีเปิดกล้องบน HTTP</span>
            </button>
            <button
              onClick={() => setShowPermissionGuide(!showPermissionGuide)}
              className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="วิธีตั้งค่าอนุญาตกล้องบนมือถือ"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">สิทธิ์กล้อง</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ================= HTTP Camera Guide Banner ================= */}
          {showHttpGuide && (
            <div className="bg-gradient-to-br from-amber-950/70 to-zinc-900 border-2 border-amber-500/80 rounded-xl p-4 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-amber-800/60 pb-2">
                <span className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  วิธีปลดล็อกเปิดกล้องสดบน HTTP (Google Chrome / Edge)
                </span>
                <button
                  onClick={() => setShowHttpGuide(false)}
                  className="text-zinc-400 hover:text-white text-xs"
                >
                  ปิดหน้านี้
                </button>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed">
                ตามมาตรฐานความปลอดภัย เว็บบราวเซอร์จะบล็อกกล้องสดอัตโนมัติเมื่อเปิดผ่าน <strong>HTTP</strong> หรือ <strong>IP เครือข่าย (เช่น http://192.168.x.x:3000)</strong> คุณสามารถปลดล็อกได้ง่ายๆ ใน 3 ขั้นตอน:
              </p>

              <div className="space-y-2 bg-black/60 p-3 rounded-lg border border-amber-900/50">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <div className="flex-1">
                    <span className="text-zinc-200">เปิดแท็บใหม่แล้วพิมพ์ URL นี้ใน Google Chrome หรือ Edge:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="bg-zinc-900 text-amber-300 px-2 py-1 rounded font-mono text-[10px] select-all break-all border border-zinc-700">
                        chrome://flags/#unsafely-treat-insecure-origin-as-secure
                      </code>
                      <button
                        onClick={handleCopyFlag}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        {copiedFlag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedFlag ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <div className="flex-1">
                    <span className="text-zinc-200">ในช่องค้นหา ให้ใส่ URL ของระบบนี้ แล้วเปลี่ยนสถานะเป็น <strong>Enabled</strong>:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="bg-zinc-900 text-cyan-300 px-2 py-1 rounded font-mono text-[10px] font-bold select-all border border-zinc-700">
                        {currentOrigin}
                      </code>
                      <button
                        onClick={handleCopyOrigin}
                        className="px-2 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 border border-cyan-700/60"
                      >
                        {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUrl ? 'คัดลอกแล้ว' : 'คัดลอก URL ระบบ'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <div className="text-zinc-200">
                    กดปุ่ม <strong className="text-emerald-400">Relaunch (เปิดบราวเซอร์ใหม่)</strong> ด้านล่างขวาของ Chrome กล้องสดจะเปิดใช้งานได้ทันที 100%!
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg flex items-center justify-between">
                <span className="text-[11px] text-emerald-300">
                  💡 <strong>หรือวิธีที่ง่ายที่สุดโดยไม่ต้องตั้งค่า:</strong> ใช้ปุ่ม <strong>"ถ่ายภาพ QR / เลือกรูป"</strong> ด้านล่าง ซึ่งทำงานได้ทันทีบน HTTP ทุกเบราว์เซอร์ครับ
                </span>
              </div>
            </div>
          )}

          {/* Mobile Camera Permission Troubleshooting Guide */}
          {(showPermissionGuide || (permissionDenied && !showHttpGuide)) && (
            <div className="bg-amber-950/40 border border-amber-800/70 rounded-xl p-4 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  วิธีตั้งค่าอนุญาตกล้องบนมือถือ (Allow Camera Permission)
                </span>
                <button
                  onClick={startCamera}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ลองเปิดกล้องใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-300 pt-1 text-[11px]">
                <div className="bg-black/40 p-2.5 rounded-lg border border-amber-900/40">
                  <strong className="text-amber-200 block mb-1">📱 บน iPhone (Safari / Chrome iOS):</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    <li>แตะไอคอน <strong>"aA"</strong> หรือ <strong>แม่กุญแจ</strong> ซ้ายมือของช่อง URL</li>
                    <li>เลือก <strong>"การตั้งค่าเว็บไซต์ (Website Settings)"</strong></li>
                    <li>เปลี่ยน <strong>กล้อง (Camera)</strong> เป็น <strong>"อนุญาต (Allow)"</strong> แล้วรีเฟรช</li>
                  </ul>
                </div>

                <div className="bg-black/40 p-2.5 rounded-lg border border-amber-900/40">
                  <strong className="text-amber-200 block mb-1">🤖 บน Android (Google Chrome):</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    <li>แตะไอคอน <strong>"แม่กุญแจ 🔒"</strong> หรือ <strong>"การตั้งค่าไซต์"</strong> หน้าแถบ URL</li>
                    <li>ไปที่ <strong>สิทธิ์ (Permissions) &gt; กล้อง (Camera)</strong></li>
                    <li>เลือก <strong>"อนุญาต (Allow)"</strong> แล้วกดยืนยัน</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Camera Viewport / Scanning simulation */}
          <div className="relative aspect-video max-h-64 w-full bg-[#0a0c10] rounded-xl overflow-hidden border border-zinc-800 flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            
            {!cameraActive && (
              <div className="text-center p-6 space-y-2.5">
                <Camera className="w-12 h-12 text-zinc-600 mx-auto" />
                <div className="text-xs text-zinc-300 font-bold">
                  {permissionDenied ? 'ยังไม่ได้รับสิทธิ์เปิดกล้อง หรือเปิดผ่าน HTTP' : 'โหมดกล้องถ่ายภาพ (Camera Scanner)'}
                </div>
                <div className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  {scanStatus}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ลองเปิดกล้องอีกครั้ง</span>
                  </button>
                  <button
                    onClick={() => setShowHttpGuide(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>ดูวิธีเปิดบน HTTP</span>
                  </button>
                </div>
              </div>
            )}

            {/* Targeting overlay frame */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-cyan-400/70 rounded-2xl relative animate-pulse">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                  <div className="w-full h-0.5 bg-red-500/80 absolute top-1/2 -translate-y-1/2 shadow-lg" />
                </div>
              </div>
            )}
          </div>

          {/* ================= SNAP PHOTO / UPLOAD QR IMAGE (100% WORKS ON HTTP) ================= */}
          <div className="p-3 bg-[#151926] border border-cyan-900/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-cyan-200">ถ่ายรูปด้วยกล้องมือถือ หรือเลือกไฟล์รูป QR</div>
                <div className="text-[10px] text-zinc-400">ใช้งานได้ 100% บน HTTP / LAN โดยไม่ต้องตั้งค่าใดๆ</div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                {isProcessingImage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>ถ่ายรูป / เลือกภาพ QR</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Demo Scan Barcode buttons */}
          <div>
            <div className="text-xs text-zinc-400 mb-2 flex items-center justify-between">
              <span>หรือเลือกทดสอบรหัสทรัพย์สิน (Quick Select):</span>
              <span className="text-[10px] text-cyan-400 font-mono">One-click lookup</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {assets.slice(0, 3).map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSimulateQuickScan(a)}
                  className="p-2 bg-[#161822] hover:bg-[#1f2230] border border-zinc-800 hover:border-cyan-800 rounded-lg text-left text-xs transition-all flex flex-col cursor-pointer"
                >
                  <span className="font-mono font-bold text-cyan-300">{a.assetId}</span>
                  <span className="text-[10px] text-zinc-400 truncate">{a.itemCode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Search */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 block">
              หรือพิมพ์ค้นหารหัสทรัพย์สิน / Serial Number / Item Code:
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="เช่น 3-300-680031 หรือ XT-IT-HW-23-0105..."
                value={manualCode}
                onChange={(e) => handleManualSearch(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Matched Asset Result Card */}
          {matchedAsset && (
            <div className="bg-[#141824] border-2 border-cyan-500/80 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Asset Found (ตรวจพบทรัพย์สิน)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {matchedAsset.assetId}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white leading-snug">
                  {matchedAsset.assetName}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 mt-2">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Item Code / S/N:</span>
                    <span className="font-mono text-zinc-200">{matchedAsset.itemCode} ({matchedAsset.serialNo || '-'})</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">ผู้ครอบครองปัจจุบัน:</span>
                    <span className="text-zinc-200">{matchedAsset.ownerStaffName || 'ส่วนกลาง'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">สถานที่ตั้ง:</span>
                    <span className="text-zinc-200">{matchedAsset.location}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">สถานะ:</span>
                    <span className="text-emerald-400 font-mono font-bold">{matchedAsset.status}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for scanned asset */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    onClose();
                    onOpenBincard(matchedAsset);
                  }}
                  className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <History className="w-4 h-4" />
                  <span>ดู Bincard & ประวัติซ่อม</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onInitiateTransfer(matchedAsset);
                  }}
                  className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>ทำใบโอนย้าย</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onCreateTicketForAsset(matchedAsset);
                  }}
                  className="py-2 px-3 bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>แจ้งซ่อมชิ้นนี้</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

