import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  PenTool,
  Type,
  Upload,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string, signerName: string) => void;
  currentUser?: UserProfile | null;
  targetRole?: 'IT' | 'MANAGER' | 'ACC' | 'GENERAL';
  role?: 'IT' | 'MANAGER' | 'ACC' | 'GENERAL';
  roleTitle?: string;
  transferFormNo?: string;
  currentUserName?: string;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentUser,
  targetRole,
  role,
  roleTitle = 'ผู้มีอำนาจลงนาม',
  transferFormNo = '-',
  currentUserName,
}) => {
  const effectiveRole = targetRole || role || 'GENERAL';
  const effectiveUserName =
    currentUser?.thaiName || currentUser?.name || currentUserName || 'ผู้มีอำนาจลงนาม';
  const effectiveStaffId = currentUser?.staffId || currentUser?.role || effectiveRole;

  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signerName, setSignerName] = useState(effectiveUserName);
  const [selectedFont, setSelectedFont] = useState<'script' | 'brush' | 'formal' | 'modern'>('script');
  const [penColor, setPenColor] = useState<'#002b80' | '#111827' | '#0f4c81'>('#002b80');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setSignerName(effectiveUserName);
      setHasDrawn(false);
      setUploadedImage(null);
      // Clear canvas on open
      setTimeout(() => {
        clearCanvas();
      }, 100);
    }
  }, [isOpen, currentUser, effectiveUserName]);

  if (!isOpen) return null;

  // Canvas drawing helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate signature from font text onto canvas to get crisp PNG data URL
  const generateTypedSignatureDataUrl = (): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 120;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return signerName;

    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.fillStyle = penColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    let fontStyle = "italic 32px 'Brush Script MT', 'Segoe Script', cursive, sans-serif";
    if (selectedFont === 'formal') {
      fontStyle = "italic bold 28px 'Playfair Display', 'Georgia', serif";
    } else if (selectedFont === 'modern') {
      fontStyle = "italic 26px 'Lucida Handwriting', cursive, sans-serif";
    } else if (selectedFont === 'brush') {
      fontStyle = "italic bold 34px 'Caveat', 'Comic Sans MS', cursive";
    }

    ctx.font = fontStyle;
    ctx.fillText(signerName, tempCanvas.width / 2, tempCanvas.height / 2);

    return tempCanvas.toDataURL('image/png');
  };

  const handleSubmit = () => {
    let finalSignature = '';

    const cleanUserNameWithId = currentUser?.staffId
      ? `${signerName || effectiveUserName} (${currentUser.staffId})`
      : signerName || effectiveUserName;

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        finalSignature = canvas.toDataURL('image/png');
      } else {
        finalSignature = signerName || effectiveUserName;
      }
    } else if (activeTab === 'upload') {
      if (uploadedImage) {
        finalSignature = uploadedImage;
      } else {
        finalSignature = signerName || effectiveUserName;
      }
    } else {
      // Typed
      finalSignature = generateTypedSignatureDataUrl();
    }

    onConfirm(finalSignature, cleanUserNameWithId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#14161f] border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#1a1d2b] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">ลงนามลายมือชื่อดิจิทัล</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-cyan-300 border border-zinc-700">
                  {roleTitle}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                เอกสารใบส่งมอบเลขที่: <strong className="text-white font-mono">{transferFormNo}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Signer Identity Box */}
          <div className="bg-[#0f1118] p-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-zinc-400 block text-[10px]">ผู้มีอำนาจลงนามประจำสิทธิ์:</span>
                <strong className="text-white font-semibold text-xs">
                  {effectiveUserName} ({effectiveStaffId})
                </strong>
              </div>
            </div>
            <div className="text-right text-[10px] text-zinc-400 font-mono">
              Role: <span className="text-cyan-400 font-bold">{effectiveRole}</span>
            </div>
          </div>

          {/* Signer Name Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              ชื่อ-นามสกุล ผู้ลงนาม (จะปรากฏใต้ช่องลายเซ็น)
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="ระบุชื่อ-นามสกุล..."
              className="w-full bg-[#0f1118] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#0f1118] p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'draw'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>วาดลายเซ็นสด</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('type')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'type'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>ฟอนต์ลายมือ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดรูป</span>
            </button>
          </div>

          {/* TAB 1: DRAW CANVAS */}
          {activeTab === 'draw' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-[11px]">สีหมึก:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPenColor('#002b80')}
                      className={`w-5 h-5 rounded-full bg-[#002b80] border-2 transition-all cursor-pointer ${
                        penColor === '#002b80' ? 'border-white scale-110' : 'border-transparent opacity-70'
                      }`}
                      title="น้ำเงินราชการ"
                    />
                    <button
                      type="button"
                      onClick={() => setPenColor('#111827')}
                      className={`w-5 h-5 rounded-full bg-black border-2 transition-all cursor-pointer ${
                        penColor === '#111827' ? 'border-white scale-110' : 'border-transparent opacity-70'
                      }`}
                      title="ดำ"
                    />
                    <button
                      type="button"
                      onClick={() => setPenColor('#0f4c81')}
                      className={`w-5 h-5 rounded-full bg-[#0f4c81] border-2 transition-all cursor-pointer ${
                        penColor === '#0f4c81' ? 'border-white scale-110' : 'border-transparent opacity-70'
                      }`}
                      title="น้ำเงินเข้ม"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-[11px]">เส้น:</span>
                  <button
                    type="button"
                    onClick={() => setPenWidth(2)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                      penWidth === 2 ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    บาง
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(3)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                      penWidth === 3 ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    ปกติ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(4.5)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                      penWidth === 4.5 ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    หนา
                  </button>
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-400 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างหน้าจอ</span>
                </button>
              </div>

              {/* Canvas Board */}
              <div className="bg-white rounded-xl border border-zinc-300 overflow-hidden relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[140px] cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-zinc-400 text-xs select-none">
                    <PenTool className="w-5 h-5 mb-1 opacity-40 text-zinc-400" />
                    <span>ใช้เมาส์หรือนิ้วมือวาดลายเซ็นบนพื้นที่นี้</span>
                    <span className="text-[10px] text-zinc-400/80">(Draw signature here)</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-4 right-4 border-b border-dashed border-zinc-300 pointer-events-none" />
              </div>
            </div>
          )}

          {/* TAB 2: TYPED SCRIPT SIGNATURE */}
          {activeTab === 'type' && (
            <div className="space-y-3">
              <span className="text-zinc-400 text-xs block">เลือกสไตล์ลายมือชื่อ:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'script', label: 'Classic Script', fontStyle: "'Brush Script MT', 'Segoe Script', cursive" },
                  { id: 'brush', label: 'Brush Handwritten', fontStyle: "'Caveat', cursive, sans-serif" },
                  { id: 'formal', label: 'Formal Serif', fontStyle: "'Playfair Display', serif" },
                  { id: 'modern', label: 'Casual Cursive', fontStyle: "'Lucida Handwriting', cursive" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedFont(st.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedFont === st.id
                        ? 'bg-blue-950/50 border-blue-500 text-white shadow-sm'
                        : 'bg-[#0f1118] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 font-mono mb-1">{st.label}</span>
                    <div
                      style={{ fontFamily: st.fontStyle }}
                      className="text-lg italic font-bold text-cyan-300 truncate"
                    >
                      {signerName || effectiveUserName}
                    </div>
                  </button>
                ))}
              </div>

              {/* Preview Box */}
              <div className="bg-white rounded-xl p-4 text-center border border-zinc-300">
                <div className="text-[10px] text-zinc-400 font-mono mb-1">ตัวอย่างลายมือชื่อที่จะแสดงในเอกสาร:</div>
                <div
                  style={{
                    fontFamily:
                      selectedFont === 'script'
                        ? "'Brush Script MT', 'Segoe Script', cursive"
                        : selectedFont === 'brush'
                        ? "'Caveat', cursive, sans-serif"
                        : selectedFont === 'formal'
                        ? "'Playfair Display', serif"
                        : "'Lucida Handwriting', cursive",
                    color: penColor,
                  }}
                  className="text-2xl italic font-bold py-2 border-b border-zinc-300 inline-block px-6"
                >
                  {signerName || effectiveUserName}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-[#0f1118]">
                <input
                  type="file"
                  id="signature-file-upload"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="signature-file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <Upload className="w-8 h-8 text-blue-400" />
                  <div className="text-xs text-zinc-200 font-semibold">
                    คลิกเพื่อเลือกไฟล์ภาพลายเซ็น (PNG / JPG)
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    แนะนำเป็นไฟล์ PNG พื้นหลังโปร่งใส (Transparent Background)
                  </div>
                </label>
              </div>

              {uploadedImage && (
                <div className="bg-white p-3 rounded-xl border border-zinc-300 flex items-center justify-center">
                  <img
                    src={uploadedImage}
                    alt="Uploaded Signature"
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Info Badge */}
          <div className="text-[11px] text-zinc-400 flex items-start gap-1.5 bg-[#0f1118] p-2.5 rounded-lg border border-zinc-800/80">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              การลงนามดิจิทัลจะบันทึกชื่อผู้ลงนาม วันที่และเวลาลงในเอกสาร A4 และปรับสถานะเอกสารตามลำดับความรับผิดชอบ
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#1a1d2b] border-t border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ยืนยันและลงนามอนุมัติ (Sign & Approve)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
