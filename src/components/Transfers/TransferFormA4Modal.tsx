/**
 * ============================================================================
 * [MODULE: A4 TRANSFER DOCUMENT & DIGITAL SIGNATURE ENGINE]
 * File: /src/components/Transfers/TransferFormA4Modal.tsx
 * Description: Official 3-Language A4 Asset Transfer Form for Xing Tai Trading
 * 
 * [ส่วนที่แก้ไขและพัฒนา]:
 * 1. A4 Print Styling: ออกแบบขนาด A4 Fit 100% พร้อม CSS @media print
 * 2. 3-Step Digital Approvals:
 *    - Step 1 (IT Specialist / ผู้จัดทำ) -> itApproved, itSignature
 *    - Step 2 (Transferor Dept Manager / ผจก. แผนก) -> managerApproved, managerSignature
 *    - Step 3 (Accounting Controller / ฝ่ายบัญชี) -> accApproved, accSignature
 * 3. 9 Signature Boxes Customization: รองรับการสลับลำดับกล่องลายเซ็น 9 กล่อง
 * 4. Export Engines: ส่งออกเป็น PDF คุณภาพสูง (jsPDF/html2canvas) และ Excel (.xlsx)
 * 5. XingTaiLogo & Bilingual Header: แสดงตราสัญลักษณ์บริษัทและหัวกระดาษ 3 ภาษา
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  Sliders,
  RotateCcw,
  Save,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Asset, FormAdjustmentConfig, TransferForm, UserProfile } from '../../types';
import { DEFAULT_FORM_ADJUSTMENT } from '../../data/initialData';
import { exportElementToPdf, exportTransferFormToExcel } from '../../utils/exportUtils';
import {
  SIGNATURE_BOX_DEFINITIONS,
  getNormalizedBoxOrder,
} from '../../utils/signatureBoxes';
import confetti from 'canvas-confetti';
import { XingTaiLogo } from '../Common/XingTaiLogo';
import { DigitalSignatureModal } from './DigitalSignatureModal';

interface TransferFormA4ModalProps {
  transfer: TransferForm | null;
  currentUser: UserProfile;
  formConfig?: FormAdjustmentConfig;
  onUpdateFormConfig?: (config: FormAdjustmentConfig) => void;
  onClose: () => void;
  onApproveManager: (transferId: string, signature: string, signerName?: string) => void;
  onApproveIT: (transferId: string, signature: string, signerName?: string) => void;
  onApproveACC: (transferId: string, signature: string, signerName?: string) => void;
  onFinalizeTransfer: (transfer: TransferForm) => void;
  onEditTransfer?: (transfer: TransferForm) => void;
  onDeleteTransfer?: (transferId: string) => void;
}

export const formatDisplaySignerName = (name?: string, fallback = '...........................................') => {
  if (!name) return fallback;
  if (name.startsWith('data:image/') || name.startsWith('http') || name.length > 60) {
    return 'ผู้มีอำนาจลงนาม';
  }
  return name;
};

export const TransferFormA4Modal: React.FC<TransferFormA4ModalProps> = ({
  transfer,
  currentUser,
  formConfig = DEFAULT_FORM_ADJUSTMENT,
  onUpdateFormConfig,
  onClose,
  onApproveManager,
  onApproveIT,
  onApproveACC,
  onFinalizeTransfer,
  onEditTransfer,
  onDeleteTransfer,
}) => {
  const currentUserName = currentUser?.thaiName || currentUser?.name || 'ผู้ใช้งาน';
  const currentUserRole = currentUser?.role || 'USER';
  const [signatureText, setSignatureText] = useState(currentUserName);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showLayoutSettings, setShowLayoutSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<FormAdjustmentConfig>(formConfig);

  // Digital Signature Modal State
  const [sigModal, setSigModal] = useState<{
    isOpen: boolean;
    role: 'IT' | 'MANAGER' | 'ACC';
    roleTitle: string;
  }>({
    isOpen: false,
    role: 'IT',
    roleTitle: 'ฝ่ายไอที (IT Specialist)',
  });

  useEffect(() => {
    setLocalConfig(formConfig);
  }, [formConfig]);

  if (!transfer) return null;

  const isAllApproved = transfer.managerApproved && transfer.itApproved && transfer.accApproved;

  // Role permissions for each step
  const canApproveIT =
    (currentUserRole === 'IT' || currentUserRole === 'ADMIN') && !transfer.itApproved;
  const canApproveManager =
    (currentUserRole === 'MANAGER' || currentUserRole === 'ADMIN') &&
    transfer.itApproved &&
    !transfer.managerApproved;
  const canApproveACC =
    (currentUserRole === 'ACC' || currentUserRole === 'ADMIN') &&
    transfer.itApproved &&
    transfer.managerApproved &&
    !transfer.accApproved;

  const handleOpenSignatureModal = (role: 'IT' | 'MANAGER' | 'ACC', roleTitle: string) => {
    setSigModal({
      isOpen: true,
      role,
      roleTitle,
    });
  };

  const handleConfirmSignature = (signatureData: string, signerName: string) => {
    if (!transfer) return;
    const finalSignature = signatureData || signerName;
    const cleanSignerName = signerName || currentUserName || `${currentUserRole} Specialist`;
    if (sigModal.role === 'IT') {
      onApproveIT(transfer.id, finalSignature, cleanSignerName);
    } else if (sigModal.role === 'MANAGER') {
      onApproveManager(transfer.id, finalSignature, cleanSignerName);
    } else if (sigModal.role === 'ACC') {
      onApproveACC(transfer.id, finalSignature, cleanSignerName);
    }
  };

  // Helper to render signature item (Canvas image or typography)
  const renderSignatureItem = (
    isApproved: boolean,
    signature: string | undefined,
    approvedBy: string | undefined,
    approvedDate: string | undefined,
    defaultPlaceholder: string,
    onClickSign?: () => void,
    canSign?: boolean
  ) => {
    if (isApproved) {
      const isImg = signature && (signature.startsWith('data:image/') || signature.startsWith('http'));
      return (
        <div className="text-center w-full flex flex-col items-center justify-center">
          {isImg ? (
            <img
              src={signature}
              alt="ลายมือชื่อ"
              className="max-h-8 max-w-[130px] object-contain mx-auto"
            />
          ) : (
            <div className="font-serif italic text-[12px] text-zinc-900 font-bold border-b border-zinc-700 px-2 pb-0.5">
              {signature || approvedBy}
            </div>
          )}
          <div className="text-[7.5px] text-zinc-700 font-mono font-semibold mt-0.5">
            ✓ ลงนามเมื่อ {approvedDate}
          </div>
        </div>
      );
    }

    if (canSign && onClickSign) {
      return (
        <button
          type="button"
          onClick={onClickSign}
          className="group flex flex-col items-center justify-center py-1 px-2 rounded hover:bg-zinc-200/80 transition-all border border-dashed border-blue-400 bg-blue-50/50 cursor-pointer"
          title="คลิกเพื่อลงนามดิจิทัล"
        >
          <div className="flex items-center gap-1 text-blue-700 font-bold text-[9px]">
            <PenTool className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>คลิกลงนาม</span>
          </div>
          <div className="text-[7px] text-blue-600 font-mono">(Digital Sign)</div>
        </button>
      );
    }

    return (
      <div className="text-zinc-400 italic text-[9px] border-b border-dashed border-zinc-400 w-32 pb-0.5 text-center">
        {defaultPlaceholder}
      </div>
    );
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf('a4-landscape-transfer-form', `Transfer_Form_${transfer.formNo}.pdf`);
    setIsExportingPdf(false);
  };

  const handleFinalize = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onFinalizeTransfer(transfer);
  };

  const handleSaveAsDefault = () => {
    if (onUpdateFormConfig) {
      onUpdateFormConfig(localConfig);
      alert('บันทึกการจัดหน้าเป็นแม่แบบตั้งต้น (Master Default) เรียบร้อยแล้ว');
    }
  };

  const handleResetLayout = () => {
    setLocalConfig(DEFAULT_FORM_ADJUSTMENT);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#12141a] border border-zinc-700/80 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        {/* Modal Toolbar (No Print) */}
        <div className="p-4 border-b border-zinc-800 bg-[#161824] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
              A4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  {localConfig.formTitleTh} (Landscape A4)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {transfer.formNo}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                สิทธิ์ปัจจุบัน: <strong className="text-zinc-200">{currentUserName}</strong> ({currentUserRole})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Transfer Button */}
            {onEditTransfer && (
              <button
                onClick={() => onEditTransfer(transfer)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-900/60 rounded-lg text-xs font-semibold transition-colors"
                title="แก้ไขข้อมูลใบส่งมอบ"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขเอกสาร</span>
              </button>
            )}

            {/* Delete Transfer Button (Disabled if ACC approved) */}
            {onDeleteTransfer && (
              transfer.accApproved || transfer.status === 'APPROVED' ? (
                <button
                  disabled
                  title="ไม่สามารถลบเอกสารที่ฝ่ายบัญชี (ACC) อนุมัติแล้วได้"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-zinc-600 border border-zinc-800 rounded-lg text-xs font-medium cursor-not-allowed opacity-60"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ลบ (ACC อนุมัติแล้ว)</span>
                </button>
              ) : (
                <button
                  onClick={() => onDeleteTransfer(transfer.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 rounded-lg text-xs font-semibold transition-colors"
                  title="ลบใบส่งมอบนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบเอกสาร</span>
                </button>
              )
            )}

            {/* Form Adjustment Pre-Print Button */}
            <button
              onClick={() => setShowLayoutSettings(!showLayoutSettings)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                showLayoutSettings
                  ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-md shadow-cyan-950/50'
                  : 'bg-[#1b1e27] hover:bg-zinc-800 text-cyan-300 border-cyan-900/80'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>⚙️ จัดหน้าเอกสารก่อนพิมพ์ (Adjust Layout)</span>
            </button>

            <button
              onClick={() => exportTransferFormToExcel(transfer)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-900/60 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-900/60 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'Download PDF (A4)'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold border border-cyan-400 rounded-lg text-xs shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Pre-Print Layout Settings Drawer (No Print) */}
        {showLayoutSettings && (
          <div className="bg-[#181b28] border-b border-cyan-900/60 p-4 space-y-4 text-xs no-print">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>แผงควบคุมการจัดหน้าเอกสารก่อนพิมพ์ (Pre-Print Layout Adjustment Panel)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetLayout}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>รีเซ็ต</span>
                </button>
                {onUpdateFormConfig && (
                  <button
                    onClick={handleSaveAsDefault}
                    className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded text-[11px] flex items-center gap-1 font-semibold"
                  >
                    <Save className="w-3 h-3" />
                    <span>บันทึกเป็นค่าหลัก Master Data</span>
                  </button>
                )}
                <button
                  onClick={() => setShowLayoutSettings(false)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-[11px]"
                >
                  ปิดแผง
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Zoom Scale */}
              <div className="space-y-1.5 bg-[#12141a] p-3 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="font-semibold">สเกลย่อ/ขยาย A4:</span>
                  <span className="font-mono text-cyan-400 font-bold">{localConfig.pageScale}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="110"
                  step="1"
                  value={localConfig.pageScale}
                  onChange={(e) => setLocalConfig({ ...localConfig, pageScale: Number(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-[9.5px] text-zinc-500">
                  <span>80%</span>
                  <span>98% พอดี A4</span>
                  <span>110%</span>
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-1.5 bg-[#12141a] p-3 rounded-lg border border-zinc-800">
                <span className="font-semibold text-zinc-300 block">ระยะขอบหน้ากระดาษ:</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['compact', 'normal', 'relaxed'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setLocalConfig({ ...localConfig, pagePaddingPreset: p })}
                      className={`py-1.5 text-[10.5px] rounded ${
                        localConfig.pagePaddingPreset === p
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {p === 'compact' ? 'แคบ' : p === 'normal' ? 'ปกติ' : 'กว้าง'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Row Density */}
              <div className="space-y-1.5 bg-[#12141a] p-3 rounded-lg border border-zinc-800">
                <span className="font-semibold text-zinc-300 block">ขนาดฟอนต์ / ความสูงแถว:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={localConfig.fontSizePreset}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, fontSizePreset: e.target.value as any })
                    }
                    className="bg-zinc-900 border border-zinc-700 rounded p-1 text-[11px] text-white"
                  >
                    <option value="compact">ฟอนต์กะทัดรัด</option>
                    <option value="normal">ฟอนต์มาตรฐาน</option>
                    <option value="large">ฟอนต์ใหญ่ชัด</option>
                  </select>

                  <select
                    value={localConfig.tableRowDensity}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, tableRowDensity: e.target.value as any })
                    }
                    className="bg-zinc-900 border border-zinc-700 rounded p-1 text-[11px] text-white"
                  >
                    <option value="tight">แถวแน่น</option>
                    <option value="normal">แถวปกติ</option>
                    <option value="spacious">แถวโปร่ง</option>
                  </select>
                </div>
              </div>

              {/* Table Column Toggles */}
              <div className="space-y-1.5 bg-[#12141a] p-3 rounded-lg border border-zinc-800 text-[11px]">
                <span className="font-semibold text-zinc-300 block">รูปแบบและส่วนเสริม:</span>
                <div className="grid grid-cols-2 gap-1 text-zinc-400">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.signatureMode === '9_BOXES'}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          signatureMode: e.target.checked ? '9_BOXES' : '3_BOXES',
                        })
                      }
                      className="rounded bg-zinc-800 text-cyan-400"
                    />
                    <span className="text-cyan-300 font-semibold">9 กล่องลายเซ็น</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.showItemCode}
                      onChange={(e) => setLocalConfig({ ...localConfig, showItemCode: e.target.checked })}
                      className="rounded bg-zinc-800 text-cyan-400"
                    />
                    <span>Item Code</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.showSerialNo}
                      onChange={(e) => setLocalConfig({ ...localConfig, showSerialNo: e.target.checked })}
                      className="rounded bg-zinc-800 text-cyan-400"
                    />
                    <span>Serial No.</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.showWatermark}
                      onChange={(e) =>
                        setLocalConfig({ ...localConfig, showWatermark: e.target.checked })
                      }
                      className="rounded bg-zinc-800 text-cyan-400"
                    />
                    <span>ลายน้ำ</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Action Bar with Strict Role Permissions */}
        <div className="bg-[#181b26] p-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          {/* Current User Role Identity */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#12141a] px-3 py-1.5 rounded-lg border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-zinc-400">
                ผู้ลงนาม: <strong className="text-white">{currentUserName}</strong>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                Role: {currentUserRole}
              </span>
            </div>

            {/* Approval Progress Pills */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono">
              <span
                className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                  transfer.itApproved
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
              >
                {transfer.itApproved ? '✓' : '•'} ฝ่ายไอที (IT)
              </span>
              <span className="text-zinc-600">➔</span>
              <span
                className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                  transfer.managerApproved
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
              >
                {transfer.managerApproved ? '✓' : '•'} ผู้จัดการ (Manager)
              </span>
              <span className="text-zinc-600">➔</span>
              <span
                className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                  transfer.accApproved
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
              >
                {transfer.accApproved ? '✓' : '•'} ฝ่ายบัญชี (ACC)
              </span>
            </div>
          </div>

          {/* Action Buttons with Digital Signature Input */}
          <div className="flex items-center gap-2">
            {/* IT Button */}
            {canApproveIT && (
              <button
                type="button"
                onClick={() => handleOpenSignatureModal('IT', 'ฝ่ายไอที / ตรวจสอบ (IT Specialist)')}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>ลงนามอนุมัติ (ฝ่ายไอที - IT)</span>
              </button>
            )}

            {/* Manager Button */}
            {canApproveManager && (
              <button
                type="button"
                onClick={() => handleOpenSignatureModal('MANAGER', 'ผู้จัดการฝ่าย (Department Manager)')}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>ลงนามอนุมัติ (ผู้จัดการฝ่าย - Manager)</span>
              </button>
            )}

            {/* ACC Button */}
            {canApproveACC && (
              <button
                type="button"
                onClick={() => handleOpenSignatureModal('ACC', 'ฝ่ายบัญชีและการเงิน (Accounting Controller)')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>ลงนามอนุมัติ (ฝ่ายบัญชีและการเงิน - ACC)</span>
              </button>
            )}

            {/* Role Lock Indicators for non-matching current state */}
            {!transfer.itApproved && !canApproveIT && (
              <div className="px-3 py-1 bg-zinc-900 text-zinc-400 rounded-lg border border-zinc-800 text-[11px] flex items-center gap-1.5">
                <span>🔒 รอฝ่ายไอที (IT) ลงนาม</span>
                <span className="text-zinc-500 font-mono">(คุณถือสิทธิ์: {currentUserRole})</span>
              </div>
            )}

            {transfer.itApproved && !transfer.managerApproved && !canApproveManager && (
              <div className="px-3 py-1 bg-zinc-900 text-zinc-400 rounded-lg border border-zinc-800 text-[11px] flex items-center gap-1.5">
                <span>🔒 รอผู้จัดการ (Manager) ลงนาม</span>
                <span className="text-zinc-500 font-mono">(คุณถือสิทธิ์: {currentUserRole})</span>
              </div>
            )}

            {transfer.itApproved && transfer.managerApproved && !transfer.accApproved && !canApproveACC && (
              <div className="px-3 py-1 bg-zinc-900 text-zinc-400 rounded-lg border border-zinc-800 text-[11px] flex items-center gap-1.5">
                <span>🔒 รอฝ่ายบัญชี (ACC) ลงนาม</span>
                <span className="text-zinc-500 font-mono">(คุณถือสิทธิ์: {currentUserRole})</span>
              </div>
            )}

            {/* Finalization Button when all 3 have approved */}
            {isAllApproved && transfer.status !== 'APPROVED' && (
              <button
                onClick={handleFinalize}
                className="px-5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow-lg active:scale-95 animate-pulse cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>ยืนยันการส่งมอบ & ปรับปรุงทะเบียนทรัพย์สิน (Complete Delivery)</span>
              </button>
            )}

            {transfer.status === 'APPROVED' && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>เอกสารนี้ได้รับการลงนามครบถ้วนและส่งมอบเรียบร้อยแล้ว</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE 1-PAGE A4 LANDSCAPE PAPER DOCUMENT (Pixel-Perfect Matching Image 1) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-x-auto flex-1 bg-zinc-950/70 flex justify-center">
          <div
            id="a4-landscape-transfer-form"
            className={`bg-white text-zinc-900 w-[1080px] min-h-[720px] shadow-2xl border border-zinc-300 font-sans flex flex-col justify-between select-text relative transition-transform duration-150 ${
              localConfig.pagePaddingPreset === 'compact'
                ? 'p-4'
                : localConfig.pagePaddingPreset === 'relaxed'
                ? 'p-8'
                : 'p-6'
            } ${localConfig.fontSizePreset === 'compact' ? 'text-[11px]' : localConfig.fontSizePreset === 'large' ? 'text-[13px]' : 'text-xs'}`}
            style={{
              transform: `scale(${localConfig.pageScale / 100})`,
              transformOrigin: 'top center',
              fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
            }}
          >
            {/* Watermark Overlay if enabled */}
            {localConfig.showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden opacity-10">
                <span className="text-zinc-900 font-extrabold text-7xl uppercase rotate-[-25deg] tracking-widest text-center">
                  {localConfig.watermarkText || 'XING TAI TRADING'}
                </span>
              </div>
            )}

            {/* 1. DOCUMENT HEADER */}
            <div className="relative z-10">
              <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-3">
                {/* Left: Company Logo & Details */}
                <div className="flex items-start gap-3.5">
                  {localConfig.showLogo && (
                    <div className="shrink-0 flex items-center justify-center">
                      <XingTaiLogo size="sm" showText={false} variant="icon" />
                    </div>
                  )}
                  <div className="leading-tight">
                    <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                      {localConfig.companyNameTh}
                    </h1>
                    <div className="text-[11px] font-bold text-zinc-800 tracking-wide">
                      {localConfig.companyNameEn}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-serif">
                      {localConfig.companyChineseName} • เลขประจำตัวผู้เสียภาษี: {localConfig.companyTaxId}
                    </div>
                    <div className="text-[9px] text-zinc-600 mt-0.5 max-w-xl">
                      {localConfig.addressBkk} โทร. {localConfig.phone}
                    </div>
                    {localConfig.showBranchAddress && (
                      <div className="text-[8.5px] text-zinc-500">
                        RAYONG: {localConfig.addressRayong}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Transfer Title & Form No */}
                <div className="text-right leading-tight min-w-[240px]">
                  <div className="text-sm font-extrabold uppercase tracking-wider text-zinc-900 border-b border-zinc-400 pb-1 mb-1">
                    {localConfig.formTitleTh}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-700 tracking-widest uppercase">
                    {localConfig.formTitleEn}
                  </div>
                  <div className="mt-1 text-[11px] font-mono">
                    <span className="text-zinc-600">เลขที่เอกสาร: </span>
                    <strong className="text-zinc-900 font-extrabold text-xs">{transfer.formNo}</strong>
                  </div>
                  <div className="text-[11px] font-mono">
                    <span className="text-zinc-600">วันที่: </span>
                    <strong className="text-zinc-900">{transfer.createdDate}</strong>
                  </div>
                </div>
              </div>

              {/* 2. ORIGIN & REASON BANNER */}
              <div className="grid grid-cols-12 gap-2 my-2 py-1.5 px-3 bg-zinc-100 border border-zinc-300 rounded text-[11px]">
                <div className="col-span-7 flex items-center gap-2">
                  <span className="font-bold text-zinc-700">สาขา / แผนกต้นทาง:</span>
                  <span className="text-zinc-900 font-semibold">{transfer.originatingDept}</span>
                </div>

                <div className="col-span-5 flex items-center justify-end gap-3 text-[10px]">
                  <span className="font-bold text-zinc-700">สาเหตุ:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      transfer.reasonType === 'RESIGNATION'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {transfer.reasonNote ||
                      (transfer.reasonType === 'RESIGNATION'
                        ? 'พนักงานลาออก / 员工离职'
                        : 'ส่งมอบงาน / โอนย้าย')}
                  </span>
                </div>
              </div>

              {/* 3. ITEMS TABLE (Matching Image 1 Exact Headers & Config) */}
              <div className="border border-zinc-900 rounded overflow-hidden mt-1">
                <table
                  className={`w-full text-left border-collapse ${
                    localConfig.fontSizePreset === 'compact'
                      ? 'text-[9px]'
                      : localConfig.fontSizePreset === 'large'
                      ? 'text-[10.5px]'
                      : 'text-[9.5px]'
                  }`}
                >
                  <thead>
                    <tr className="bg-zinc-800 text-white font-bold text-center divide-x divide-zinc-700 text-[9px]">
                      <th className="py-1.5 px-1 w-8">{localConfig.colTitleNo}</th>
                      <th className="py-1.5 px-1.5 w-24">{localConfig.colTitleAssetId}</th>
                      {localConfig.showItemCode && (
                        <th className="py-1.5 px-1.5 w-24">{localConfig.colTitleItemCode}</th>
                      )}
                      <th className="py-1.5 px-2 text-left min-w-[190px]">{localConfig.colTitleAssetName}</th>
                      <th className="py-1.5 px-1 w-8">{localConfig.colTitleQty}</th>
                      <th className="py-1.5 px-1.5 w-20">{localConfig.colTitleTransferorDept}</th>
                      {localConfig.showTransferorStaffId && <th className="py-1.5 px-1.5 w-20">รหัสผู้โอน</th>}
                      <th className="py-1.5 px-1.5 w-28">{localConfig.colTitleTransferorName}</th>
                      <th className="py-1.5 px-1.5 w-20">{localConfig.colTitleReceiverDept}</th>
                      {localConfig.showReceiverStaffId && <th className="py-1.5 px-1.5 w-20">รหัสผู้รับ</th>}
                      <th className="py-1.5 px-1.5 w-28">{localConfig.colTitleReceiverName}</th>
                      {localConfig.showReceiverLocation && (
                        <th className="py-1.5 px-2 text-left">{localConfig.colTitleDestination}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-300 text-zinc-800">
                    {transfer.items.map((item) => (
                      <tr
                        key={item.no}
                        className={`divide-x divide-zinc-300 hover:bg-zinc-50 leading-tight ${
                          localConfig.tableRowDensity === 'tight'
                            ? 'py-1'
                            : localConfig.tableRowDensity === 'spacious'
                            ? 'py-3'
                            : 'py-2'
                        }`}
                      >
                        <td className="py-1.5 px-1 text-center font-mono font-bold text-zinc-600">{item.no}</td>
                        <td className="py-1.5 px-1.5 font-mono font-bold text-blue-900">{item.assetId}</td>
                        {localConfig.showItemCode && (
                          <td className="py-1.5 px-1.5 font-mono text-[9px]">
                            <div>{item.itemCode}</div>
                            {localConfig.showSerialNo && item.serialNo && (
                              <div className="text-zinc-500">S/N: {item.serialNo}</div>
                            )}
                          </td>
                        )}
                        <td className="py-1.5 px-2 text-left text-zinc-900 font-medium text-[9.5px]">
                          {item.assetName}
                        </td>
                        <td className="py-1.5 px-1 text-center font-mono font-bold">{item.qty}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono text-[9px]">{item.transferorDeptCode}</td>
                        {localConfig.showTransferorStaffId && (
                          <td className="py-1.5 px-1.5 text-center font-mono text-[9px]">{item.transferorStaffId}</td>
                        )}
                        <td className="py-1.5 px-1.5 text-zinc-900 font-semibold">{item.transferorStaffName}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono text-[9px] text-blue-900">
                          {item.receiverDeptCode}
                        </td>
                        {localConfig.showReceiverStaffId && (
                          <td className="py-1.5 px-1.5 text-center font-mono text-[9px] text-blue-900">
                            {item.receiverStaffId}
                          </td>
                        )}
                        <td className="py-1.5 px-1.5 text-blue-900 font-bold">{item.receiverStaffName}</td>
                        {localConfig.showReceiverLocation && (
                          <td className="py-1.5 px-2 text-zinc-700 text-[9px]">{item.receiverLocation}</td>
                        )}
                      </tr>
                    ))}

                    {/* Fill empty rows if less than minimum rows for neat A4 layout */}
                    {Array.from({ length: Math.max(0, (localConfig.tableMinRows || 3) - transfer.items.length) }).map(
                      (_, idx) => (
                        <tr key={`empty-${idx}`} className="divide-x divide-zinc-200 h-7 text-zinc-300">
                          <td className="text-center font-mono text-[9px]">{transfer.items.length + idx + 1}</td>
                          <td></td>
                          {localConfig.showItemCode && <td></td>}
                          <td></td>
                          <td></td>
                          <td></td>
                          {localConfig.showTransferorStaffId && <td></td>}
                          <td></td>
                          <td></td>
                          {localConfig.showReceiverStaffId && <td></td>}
                          <td></td>
                          {localConfig.showReceiverLocation && <td></td>}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. MANDATORY REGULATION & VEHICLE DISPATCH NOTE */}
              <div className="mt-2 text-[9.5px] text-zinc-700 bg-zinc-100/90 border border-zinc-300 p-1.5 rounded flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-900">หมายเหตุสำคัญ:</span>
                  <span>{localConfig.importantRemarkText}</span>
                </div>
                {localConfig.showVehicleDispatch && (
                  <div className="font-mono text-zinc-700 shrink-0">
                    ผู้นำส่ง: {transfer.deliveredBy || '-'} • ทะเบียนรถ: {transfer.vehiclePlateNo || '-'}
                  </div>
                )}
              </div>
            </div>

            {/* 5. 9-BOX OR 3-BOX SIGNATURE GRID */}
            <div className="mt-2.5 pt-2 border-t-2 border-zinc-900 relative z-10">
              {localConfig.signatureMode === '9_BOXES' ? (
                /* 9-BOX SIGNATURE GRID (3x3 Matrix, respects customized order) */
                <div className="grid grid-cols-3 gap-2 text-center text-[9.5px]">
                  {getNormalizedBoxOrder(localConfig.signBoxOrder).map((boxId) => {
                    const boxDef = SIGNATURE_BOX_DEFINITIONS[boxId] || SIGNATURE_BOX_DEFINITIONS['box1'];
                    const title = (localConfig[boxDef.defaultTitleKey] as string) || boxDef.defaultTitle;
                    const subtitle = (localConfig[boxDef.defaultSubtitleKey] as string) || boxDef.defaultSubtitle;
                    const minBoxHeight = Math.max(68, localConfig.signatureBoxHeight - 20);

                    switch (boxId) {
                      case 'box1': // Transferor
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                false,
                                undefined,
                                undefined,
                                undefined,
                                '(ลงลายมือชื่อผู้ส่งมอบ)'
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>...........................................</strong>
                            </div>
                          </div>
                        );

                      case 'box2': // IT Specialist
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                !!transfer.itApproved,
                                transfer.itSignature,
                                transfer.itApprovedBy,
                                transfer.itApprovedDate,
                                '(ลงลายมือชื่อฝ่ายไอที)',
                                () => handleOpenSignatureModal('IT', 'ฝ่ายไอที / ตรวจสอบ (IT Specialist)'),
                                canApproveIT
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>{formatDisplaySignerName(transfer.itApprovedBy)}</strong>
                            </div>
                          </div>
                        );

                      case 'box3': // Transferor Mgr
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                !!transfer.managerApproved,
                                transfer.managerSignature,
                                transfer.managerApprovedBy,
                                transfer.managerApprovedDate,
                                '(ลงลายมือชื่อผู้จัดการ)',
                                () => handleOpenSignatureModal('MANAGER', 'ผู้จัดการฝ่าย (Department Manager)'),
                                canApproveManager
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>{formatDisplaySignerName(transfer.managerApprovedBy)}</strong>
                            </div>
                          </div>
                        );

                      case 'box4': // Receiver
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                false,
                                undefined,
                                undefined,
                                undefined,
                                '(ลงลายมือชื่อผู้รับมอบ)'
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>...........................................</strong>
                            </div>
                          </div>
                        );

                      case 'box5': // Receiver Dept Manager
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                false,
                                undefined,
                                undefined,
                                undefined,
                                '(ลงลายมือชื่อ ผจก. ปลายทาง)'
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>...........................................</strong>
                            </div>
                          </div>
                        );

                      case 'box6': // ACC
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                !!transfer.accApproved,
                                transfer.accSignature,
                                transfer.accApprovedBy,
                                transfer.accApprovedDate,
                                '(ลงลายมือชื่อฝ่ายบัญชี)',
                                () => handleOpenSignatureModal('ACC', 'ฝ่ายบัญชีและการเงิน (Accounting Controller)'),
                                canApproveACC
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>{formatDisplaySignerName(transfer.accApprovedBy)}</strong>
                            </div>
                          </div>
                        );

                      case 'box7': // Store Keeper
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                false,
                                undefined,
                                undefined,
                                undefined,
                                '(ลงลายมือชื่อฝ่ายคลังสินค้า)'
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>...........................................</strong>
                            </div>
                          </div>
                        );

                      case 'box8': // Security Gate
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              <div className="text-[8px] text-zinc-600 font-mono mb-0.5">
                                ทะเบียน: {transfer.vehiclePlateNo || '-'}
                              </div>
                              {renderSignatureItem(
                                false,
                                undefined,
                                undefined,
                                undefined,
                                '(ลงลายมือชื่อ รปภ. ประตู)'
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>...........................................</strong>
                            </div>
                          </div>
                        );

                      case 'box9': // Executive / Audit
                      default:
                        return (
                          <div
                            key={boxId}
                            style={{ minHeight: `${minBoxHeight}px` }}
                            className="border border-zinc-300 rounded p-1.5 bg-zinc-50/70 flex flex-col justify-between"
                          >
                            <div>
                              <div className="font-bold text-zinc-900 text-[10px] leading-tight">
                                {title}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-sans">
                                {subtitle}
                              </div>
                            </div>

                            <div className="my-0.5 flex flex-col items-center justify-center flex-1">
                              {renderSignatureItem(
                                false,
                                undefined,
                                undefined,
                                undefined,
                                '(ลงลายมือชื่อผู้บริหาร)'
                              )}
                            </div>

                            <div className="text-[8px] text-zinc-700 truncate">
                              ชื่อ: <strong>...........................................</strong>
                            </div>
                          </div>
                        );
                    }
                  })}
                </div>
              ) : (
                /* 3-STEP APPROVAL SIGNATURE BOXES (Clean 3-Box Mode) */
                <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
                  {/* Sign Box 1: IT Specialist */}
                  <div
                    style={{ height: `${localConfig.signatureBoxHeight}px` }}
                    className="border border-zinc-300 rounded-lg p-2 bg-zinc-50/70 flex flex-col justify-between relative"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 uppercase tracking-wide text-[10.5px]">
                        {localConfig.step1Title}
                      </div>
                      <div className="text-[8.5px] text-zinc-500 font-sans">{localConfig.step1Subtitle}</div>
                    </div>

                    <div className="my-1 flex flex-col items-center justify-center flex-1">
                      {renderSignatureItem(
                        !!transfer.itApproved,
                        transfer.itSignature,
                        transfer.itApprovedBy,
                        transfer.itApprovedDate,
                        '(ลงลายมือชื่อฝ่ายไอที)',
                        () => handleOpenSignatureModal('IT', 'ฝ่ายไอที / ตรวจสอบ (IT Specialist)'),
                        canApproveIT
                      )}
                    </div>

                    <div className="text-[9px] text-zinc-700">
                      ชื่อ: <strong>{formatDisplaySignerName(transfer.itApprovedBy)}</strong>
                    </div>
                  </div>

                  {/* Sign Box 2: Manager */}
                  <div
                    style={{ height: `${localConfig.signatureBoxHeight}px` }}
                    className="border border-zinc-300 rounded-lg p-2 bg-zinc-50/70 flex flex-col justify-between relative"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 uppercase tracking-wide text-[10.5px]">
                        {localConfig.step2Title}
                      </div>
                      <div className="text-[8.5px] text-zinc-500 font-sans">{localConfig.step2Subtitle}</div>
                    </div>

                    <div className="my-1 flex flex-col items-center justify-center flex-1">
                      {renderSignatureItem(
                        !!transfer.managerApproved,
                        transfer.managerSignature,
                        transfer.managerApprovedBy,
                        transfer.managerApprovedDate,
                        '(ลงลายมือชื่อผู้จัดการ)',
                        () => handleOpenSignatureModal('MANAGER', 'ผู้จัดการฝ่าย (Department Manager)'),
                        canApproveManager
                      )}
                    </div>

                    <div className="text-[9px] text-zinc-700">
                      ชื่อ: <strong>{formatDisplaySignerName(transfer.managerApprovedBy)}</strong>
                    </div>
                  </div>

                  {/* Sign Box 3: ACC Accounting */}
                  <div
                    style={{ height: `${localConfig.signatureBoxHeight}px` }}
                    className="border border-zinc-300 rounded-lg p-2 bg-zinc-50/70 flex flex-col justify-between relative"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 uppercase tracking-wide text-[10.5px]">
                        {localConfig.step3Title}
                      </div>
                      <div className="text-[8.5px] text-zinc-500 font-sans">{localConfig.step3Subtitle}</div>
                    </div>

                    <div className="my-1 flex flex-col items-center justify-center flex-1">
                      {renderSignatureItem(
                        !!transfer.accApproved,
                        transfer.accSignature,
                        transfer.accApprovedBy,
                        transfer.accApprovedDate,
                        '(ลงลายมือชื่อฝ่ายบัญชี)',
                        () => handleOpenSignatureModal('ACC', 'ฝ่ายบัญชีและการเงิน (Accounting Controller)'),
                        canApproveACC
                      )}
                    </div>

                    <div className="text-[9px] text-zinc-700">
                      ชื่อ: <strong>{formatDisplaySignerName(transfer.accApprovedBy)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Footer Note */}
              <div className="mt-2 text-center text-[8.5px] text-zinc-500 font-mono">
                {localConfig.footerNote || 'XING TAI TRADING (THAILAND) CO., LTD. • ASSET GOVERNANCE & CONTROL SYSTEM v2.4'}
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature Drawing & Typing Modal */}
        <DigitalSignatureModal
          isOpen={sigModal.isOpen}
          currentUser={currentUser}
          targetRole={sigModal.role}
          role={sigModal.role}
          roleTitle={sigModal.roleTitle}
          transferFormNo={transfer.formNo}
          currentUserName={currentUser?.thaiName || currentUser?.name || ''}
          onClose={() => setSigModal({ ...sigModal, isOpen: false })}
          onConfirm={handleConfirmSignature}
        />
      </div>
    </div>
  );
};
