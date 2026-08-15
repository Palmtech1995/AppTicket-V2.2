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
} from 'lucide-react';
import { Asset } from '../../types';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

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
    }
  }, [assets]);

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
      setScanStatus('เบราว์เซอร์ของคุณไม่รองรับ Camera API หรือต้องเปิดผ่าน HTTPS/Localhost');
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
        setScanStatus('กำลังเปิดกล้อง... เล็งไปที่ QR Code หรือ Barcode ของทรัพย์สิน');

        // Check for native BarcodeDetector API (supported in Chrome Android, Safari 17+)
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
                  }
                } catch {
                  // Silently continue frame scan
                }
              }
            }, 500);
          } catch {
            // BarcodeDetector setup skipped
          }
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setPermissionDenied(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScanStatus('คุณยังไม่ได้อนุญาตให้เข้าถึงกล้อง (Permission Denied)');
      } else if (err.name === 'NotFoundError') {
        setScanStatus('ไม่พบอุปกรณ์กล้องบนเครื่องนี้');
      } else {
        setScanStatus('ไม่สามารถเชื่อมต่อกล้องได้: ' + (err.message || 'Error'));
      }
    }
  }, [handleMatchCode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setMatchedAsset(null);
      setManualCode('');
      setShowPermissionGuide(false);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

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
              onClick={() => setShowPermissionGuide(!showPermissionGuide)}
              className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="วิธีตั้งค่าอนุญาตกล้องบนมือถือ"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">วิธีเปิดกล้อง</span>
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
          {/* Mobile Camera Permission Troubleshooting Guide */}
          {(showPermissionGuide || permissionDenied || !isHttpsOrLocalhost) && (
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

              {!isHttpsOrLocalhost && (
                <p className="text-[11px] text-amber-400/90 pt-1">
                  ⚠️ <em>หมายเหตุ: เบราว์เซอร์บนมือถือจะอนุญาตให้เปิดกล้องได้เฉพาะ URL ที่เป็น <strong>HTTPS</strong> หรือเปิดผ่าน <strong>Localhost</strong> เท่านั้น หากเข้าผ่าน IP เครือข่าย (เช่น 192.168.x.x) ให้เปิดผ่าน HTTPS หรือ Cloud URL ของระบบครับ</em>
                </p>
              )}
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
              <div className="text-center p-6 space-y-2">
                <Camera className="w-12 h-12 text-zinc-600 mx-auto" />
                <div className="text-xs text-zinc-300 font-bold">
                  {permissionDenied ? 'ยังไม่ได้รับสิทธิ์เปิดกล้อง' : 'โหมดกล้องถ่ายภาพ (Camera Scanner)'}
                </div>
                <div className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  {scanStatus}
                </div>
                {permissionDenied && (
                  <button
                    onClick={startCamera}
                    className="mt-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>กดอนุญาตกล้องอีกครั้ง</span>
                  </button>
                )}
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
