/**
 * ============================================================================
 * [MODULE: A4 FORM & 9-BOX SIGNATURE CONFIGURATOR]
 * File: /src/components/Admin/FormAdjustmentEditor.tsx
 * Description: Real-time visual editor for customizing the A4 Transfer Document,
 *              typography scale, table column widths, and 9 signature boxes sequence.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. 9-Signature Box Reordering: สลับตำแหน่งกล่องลายเซ็น 9 กล่องตามลำดับสายบังคับบัญชา
 * 2. Visual Layout Fine-Tuning: ปรับขนาดฟอนต์หัวกระดาษ, ระยะขอบกระดาษ และขนาดช่องตาราง
 * 3. Bilingual Header Customizer: แก้ไขชื่อบริษัท 3 ภาษา (ไทย, อังกฤษ, จีน)
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  Building,
  Table,
  PenTool,
  CheckCircle2,
  RotateCcw,
  Save,
  ZoomIn,
  Sparkles,
  Eye,
  Shield,
  Layers,
  HelpCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Move,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  Sparkle,
} from 'lucide-react';
import { FormAdjustmentConfig } from '../../types';
import { DEFAULT_FORM_ADJUSTMENT } from '../../data/initialData';
import {
  SIGNATURE_BOX_DEFINITIONS,
  DEFAULT_BOX_ORDER,
  getNormalizedBoxOrder,
} from '../../utils/signatureBoxes';

interface FormAdjustmentEditorProps {
  config: FormAdjustmentConfig;
  onSaveConfig: (newConfig: FormAdjustmentConfig) => void;
}

export const FormAdjustmentEditor: React.FC<FormAdjustmentEditorProps> = ({
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<FormAdjustmentConfig>(config);
  const [activeSection, setActiveSection] = useState<'header' | 'layout' | 'columns' | 'approvals' | 'remarks'>('header');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleChange = <K extends keyof FormAdjustmentConfig>(key: K, value: FormAdjustmentConfig[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const currentBoxOrder = getNormalizedBoxOrder(formData.signBoxOrder);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const order = [...currentBoxOrder];
    const [moved] = order.splice(draggedIndex, 1);
    order.splice(targetIndex, 0, moved);
    handleChange('signBoxOrder', order);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveBox = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentBoxOrder.length) return;
    const order = [...currentBoxOrder];
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;
    handleChange('signBoxOrder', order);
  };

  const handleResetBoxOrder = () => {
    handleChange('signBoxOrder', [...DEFAULT_BOX_ORDER]);
  };

  const handleApplyWorkflowOrder = () => {
    // IT (box2), Manager (box3), ACC (box6) first, then Transferor (box1), Receiver (box4), Receiver Mgr (box5), Store (box7), Security (box8), Exec (box9)
    handleChange('signBoxOrder', ['box2', 'box3', 'box6', 'box1', 'box4', 'box5', 'box7', 'box8', 'box9']);
  };

  const handleSave = () => {
    onSaveConfig(formData);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleResetDefault = () => {
    if (confirm('ต้องการคืนค่าการจัดหน้าแบบฟอร์มกลับเป็นค่าเริ่มต้นมาตรฐานหรือไม่?')) {
      setFormData(DEFAULT_FORM_ADJUSTMENT);
      onSaveConfig(DEFAULT_FORM_ADJUSTMENT);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    }
  };

  const applyPreset = (preset: 'standard' | 'compact' | 'spacious') => {
    if (preset === 'standard') {
      setFormData((prev) => ({
        ...prev,
        pageScale: 98,
        pagePaddingPreset: 'normal',
        fontSizePreset: 'normal',
        tableRowDensity: 'normal',
        tableMinRows: 3,
        signatureBoxHeight: 112,
      }));
    } else if (preset === 'compact') {
      setFormData((prev) => ({
        ...prev,
        pageScale: 92,
        pagePaddingPreset: 'compact',
        fontSizePreset: 'compact',
        tableRowDensity: 'tight',
        tableMinRows: 4,
        signatureBoxHeight: 98,
      }));
    } else if (preset === 'spacious') {
      setFormData((prev) => ({
        ...prev,
        pageScale: 100,
        pagePaddingPreset: 'relaxed',
        fontSizePreset: 'large',
        tableRowDensity: 'spacious',
        tableMinRows: 2,
        signatureBoxHeight: 125,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-[#161824] p-5 rounded-2xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded uppercase">
                A4 Landscape Designer
              </span>
              <span className="text-xs text-zinc-400">แบบฟอร์มใบส่งมอบทรัพย์สิน 1 หน้า A4 แนวนอน</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Form Adjustment & Layout Management (จัดหน้าแบบฟอร์มเอกสาร)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              ปรับแต่งขนาดตัวอักษร, ระยะขอบหน้ากระดาษ, สเกลพิมพ์ 1 หน้า A4, หัวกระดาษบริษัท และข้อความหัวตารางให้ตรงตามความต้องการ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น (Reset)</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการจัดหน้า (Save Adjustment)</span>
          </button>
        </div>
      </div>

      {/* Saved Toast Notice */}
      {isSavedToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>บันทึกการตั้งค่าจัดหน้าแบบฟอร์มเรียบร้อยแล้ว — รูปแบบจะถูกนำไปใช้ในหน้าพิมพ์และดาวน์โหลด PDF ทันที</span>
          </div>
        </div>
      )}

      {/* Quick Layout Presets */}
      <div className="bg-[#12141a] p-4 rounded-xl border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">ชุดแม่แบบด่วน (Quick Presets):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset('standard')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-900/60"
          >
            📋 มาตรฐาน ซิงไท่ (Standard 98%)
          </button>
          <button
            onClick={() => applyPreset('compact')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-900/60"
          >
            📏 แบบกะทัดรัด (Compact 92% - จุข้อมูลเยอะ)
          </button>
          <button
            onClick={() => applyPreset('spacious')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-900/60"
          >
            ✨ แบบระยะสบายตา (Spacious 100%)
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Section Navigator */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-[#161824] p-2 rounded-xl border border-zinc-800 flex flex-col gap-1 text-xs">
            <button
              onClick={() => setActiveSection('header')}
              className={`p-3 rounded-lg font-medium flex items-center gap-2.5 transition-colors text-left ${
                activeSection === 'header'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Building className="w-4 h-4" />
              <div>
                <div className="font-semibold text-white">1. หัวกระดาษและข้อมูลองค์กร</div>
                <div className="text-[10px] text-zinc-400">ชื่อบริษัท, ที่อยู่ 2 สาขา, โลโก้</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('layout')}
              className={`p-3 rounded-lg font-medium flex items-center gap-2.5 transition-colors text-left ${
                activeSection === 'layout'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <div>
                <div className="font-semibold text-white">2. การจัดสเกล 1 หน้า A4</div>
                <div className="text-[10px] text-zinc-400">Zoom Scale, ระยะขอบ, ความสูงแถว</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('columns')}
              className={`p-3 rounded-lg font-medium flex items-center gap-2.5 transition-colors text-left ${
                activeSection === 'columns'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Table className="w-4 h-4" />
              <div>
                <div className="font-semibold text-white">3. หัวตาราง & คอลัมน์ (12 คอลัมน์)</div>
                <div className="text-[10px] text-zinc-400">เปิด-ปิดคอลัมน์, ปรับชื่อหัวตาราง</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('approvals')}
              className={`p-3 rounded-lg font-medium flex items-center gap-2.5 transition-colors text-left ${
                activeSection === 'approvals'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <div>
                <div className="font-semibold text-white">4. กล่องอนุมัติ 3 ฝ่าย</div>
                <div className="text-[10px] text-zinc-400">IT ➔ Manager ➔ ACC</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('remarks')}
              className={`p-3 rounded-lg font-medium flex items-center gap-2.5 transition-colors text-left ${
                activeSection === 'remarks'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <div>
                <div className="font-semibold text-white">5. หมายเหตุ & ความปลอดภัย</div>
                <div className="text-[10px] text-zinc-400">ข้อความระเบียบ, ข้อมูลรถ, ลายน้ำ</div>
              </div>
            </button>
          </div>
        </div>

        {/* Right: Section Form Controls */}
        <div className="lg:col-span-9">
          <div className="bg-[#161824] p-5 rounded-2xl border border-zinc-800 space-y-5">
            {/* 1. Header & Company Section */}
            {activeSection === 'header' && (
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-cyan-400" />
                    <span>ข้อมูลหัวกระดาษเอกสาร (Company Header Details)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    กำหนดชื่อบริษัท 3 ภาษา, เลขประจำตัวผู้เสียภาษี และที่อยู่ทั้งสาขากรุงเทพฯและระยอง
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">ชื่อบริษัท (ภาษาไทย)</label>
                    <input
                      type="text"
                      value={formData.companyNameTh}
                      onChange={(e) => handleChange('companyNameTh', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Company Name (English)</label>
                    <input
                      type="text"
                      value={formData.companyNameEn}
                      onChange={(e) => handleChange('companyNameEn', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">公司名称 (Chinese)</label>
                    <input
                      type="text"
                      value={formData.companyChineseName}
                      onChange={(e) => handleChange('companyChineseName', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zinc-400 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                      <input
                        type="text"
                        value={formData.companyTaxId}
                        onChange={(e) => handleChange('companyTaxId', e.target.value)}
                        className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">เบอร์โทรศัพท์</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 mb-1">ที่อยู่สาขากรุงเทพฯ (Head Office ศรีนครินทร์)</label>
                    <textarea
                      rows={2}
                      value={formData.addressBkk}
                      onChange={(e) => handleChange('addressBkk', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 mb-1">ที่อยู่สาขาระยอง (Rayong Logistic Hub)</label>
                    <textarea
                      rows={2}
                      value={formData.addressRayong}
                      onChange={(e) => handleChange('addressRayong', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showLogo}
                        onChange={(e) => handleChange('showLogo', e.target.checked)}
                        className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                      />
                      <span className="text-zinc-300">แสดงโลโก้บริษัท</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showBranchAddress}
                        onChange={(e) => handleChange('showBranchAddress', e.target.checked)}
                        className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                      />
                      <span className="text-zinc-300">แสดงที่อยู่สาขาระยองในหัวกระดาษ</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Layout & Zoom Scaling Section */}
            {activeSection === 'layout' && (
              <div className="space-y-5">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>การจัดขนาดและสเกล 1 หน้า A4 แนวนอน (Page Scale & Geometry)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ปรับความพอดีเพื่อให้พิมพ์และบันทึกเป็น PDF ใน 1 หน้ากระดาษ A4 ได้อย่างสวยงาม ไม่ล้นหน้า
                  </p>
                </div>

                {/* Scale Slider */}
                <div className="bg-[#101217] p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ZoomIn className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white">สเกลย่อ-ขยายหน้ากระดาษ (Page Zoom Scale):</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400 text-sm">{formData.pageScale}%</span>
                  </div>

                  <input
                    type="range"
                    min="80"
                    max="110"
                    step="1"
                    value={formData.pageScale}
                    onChange={(e) => handleChange('pageScale', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>80% (เล็กลง - สำหรับรายการเยอะ)</span>
                    <span>98% (แนะนำสำหรับ A4 แนวนอน)</span>
                    <span>110% (ใหญ่คมชัด)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Padding Preset */}
                  <div className="bg-[#101217] p-4 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">ระยะขอบกระดาษ (Page Padding)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['compact', 'normal', 'relaxed'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleChange('pagePaddingPreset', p)}
                          className={`py-2 text-[11px] font-medium rounded-lg capitalize ${
                            formData.pagePaddingPreset === p
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {p === 'compact' ? 'แคบ (16px)' : p === 'normal' ? 'ปกติ (24px)' : 'กว้าง (32px)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Preset */}
                  <div className="bg-[#101217] p-4 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">ขนาดตัวอักษร (Font Scale)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['compact', 'normal', 'large'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleChange('fontSizePreset', f)}
                          className={`py-2 text-[11px] font-medium rounded-lg capitalize ${
                            formData.fontSizePreset === f
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {f === 'compact' ? 'กะทัดรัด' : f === 'normal' ? 'มาตรฐาน' : 'ใหญ่ชัด'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Row Density */}
                  <div className="bg-[#101217] p-4 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">ความสูงแถวตาราง (Row Density)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['tight', 'normal', 'spacious'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleChange('tableRowDensity', d)}
                          className={`py-2 text-[11px] font-medium rounded-lg capitalize ${
                            formData.tableRowDensity === d
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {d === 'tight' ? 'แคบ' : d === 'normal' ? 'ปกติ' : 'โปร่ง'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">ชื่อหัวเอกสาร (ภาษาไทย)</label>
                    <input
                      type="text"
                      value={formData.formTitleTh}
                      onChange={(e) => handleChange('formTitleTh', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white font-bold focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Form Title (English / Subtitle)</label>
                    <input
                      type="text"
                      value={formData.formTitleEn}
                      onChange={(e) => handleChange('formTitleEn', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Table Columns Section */}
            {activeSection === 'columns' && (
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Table className="w-4 h-4 text-cyan-400" />
                    <span>ปรับแต่งคอลัมน์ตาราง 12 ช่อง (Table Columns & Headers)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    สามารถเปิด/ปิดการแสดงบางคอลัมน์ และเปลี่ยนชื่อหัวตารางได้ตามที่ต้องการ
                  </p>
                </div>

                {/* Column visibility toggles */}
                <div className="p-3.5 bg-[#101217] rounded-xl border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-white">แสดง/ซ่อน รายละเอียดในตาราง:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showItemCode}
                        onChange={(e) => handleChange('showItemCode', e.target.checked)}
                        className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                      />
                      <span className="text-zinc-300">แสดง Item Code</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showSerialNo}
                        onChange={(e) => handleChange('showSerialNo', e.target.checked)}
                        className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                      />
                      <span className="text-zinc-300">แสดง Serial Number (S/N)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showTransferorStaffId}
                        onChange={(e) => handleChange('showTransferorStaffId', e.target.checked)}
                        className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                      />
                      <span className="text-zinc-300">แสดง รหัสผู้ส่งมอบ</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showReceiverStaffId}
                        onChange={(e) => handleChange('showReceiverStaffId', e.target.checked)}
                        className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                      />
                      <span className="text-zinc-300">แสดง รหัสผู้รับมอบ</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showReceiverLocation}
                        onChange={(e) => handleChange('showReceiverLocation', e.target.checked)}
                        className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                      />
                      <span className="text-zinc-300">แสดง สถานที่ปลายทาง</span>
                    </label>
                  </div>
                </div>

                {/* Column header custom labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">หัวคอลัมน์: รหัสทรัพย์สิน</label>
                    <input
                      type="text"
                      value={formData.colTitleAssetId}
                      onChange={(e) => handleChange('colTitleAssetId', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">หัวคอลัมน์: รายการทรัพย์สิน</label>
                    <input
                      type="text"
                      value={formData.colTitleAssetName}
                      onChange={(e) => handleChange('colTitleAssetName', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">หัวคอลัมน์: จำนวน</label>
                    <input
                      type="text"
                      value={formData.colTitleQty}
                      onChange={(e) => handleChange('colTitleQty', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">หัวคอลัมน์: แผนกผู้โอน</label>
                    <input
                      type="text"
                      value={formData.colTitleTransferorDept}
                      onChange={(e) => handleChange('colTitleTransferorDept', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">หัวคอลัมน์: ชื่อผู้ส่งมอบ</label>
                    <input
                      type="text"
                      value={formData.colTitleTransferorName}
                      onChange={(e) => handleChange('colTitleTransferorName', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">หัวคอลัมน์: ชื่อผู้รับมอบ</label>
                    <input
                      type="text"
                      value={formData.colTitleReceiverName}
                      onChange={(e) => handleChange('colTitleReceiverName', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Approvals Section */}
            {activeSection === 'approvals' && (
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-cyan-400" />
                      <span>กล่องลายมือชื่อ 9 คน/ตำแหน่ง & ขั้นตอนการอนุมัติ (9 Signatures & 3-Step Approval)</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      สามารถ <strong>ลากและวาง (Drag & Drop)</strong> หรือกดลูกศรขึ้น/ลง เพื่อจัดเรียงลำดับกล่องลายมือชื่อทั้ง 9 ช่องได้อิสระ
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#101217] p-1 rounded-lg border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => handleChange('signatureMode', '9_BOXES')}
                      className={`px-3 py-1 rounded font-bold transition-all ${
                        formData.signatureMode === '9_BOXES'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      9 กล่อง (ครบ 9 ฝ่าย)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('signatureMode', '3_BOXES')}
                      className={`px-3 py-1 rounded font-bold transition-all ${
                        formData.signatureMode === '3_BOXES'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      3 กล่อง (เฉพาะผู้อนุมัติ)
                    </button>
                  </div>
                </div>

                {formData.signatureMode === '9_BOXES' ? (
                  <div className="space-y-3">
                    {/* Header & Quick Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <Move className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-zinc-200 font-semibold">
                          แตะที่แถบ <strong>Grip</strong> แล้วลากเพื่อสลับตำแหน่ง (Drag & Drop) หรือกดลูกศร <strong>↑ / ↓</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplyWorkflowOrder}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded text-[11px] border border-cyan-800/60 font-medium transition-colors"
                        >
                          ⚡ เรียงผู้อนุมัติ (IT/Mgr/ACC) ขึ้นก่อน
                        </button>
                        <button
                          type="button"
                          onClick={handleResetBoxOrder}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3 text-zinc-400" />
                          <span>รีเซ็ตลำดับ 1-9 มาตรฐาน</span>
                        </button>
                      </div>
                    </div>

                    {/* 9 Draggable Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {currentBoxOrder.map((boxId, index) => {
                        const boxDef = SIGNATURE_BOX_DEFINITIONS[boxId] || SIGNATURE_BOX_DEFINITIONS['box1'];
                        const titleKey = boxDef.defaultTitleKey;
                        const subtitleKey = boxDef.defaultSubtitleKey;
                        const currentTitle = (formData[titleKey] as string) || boxDef.defaultTitle;
                        const currentSubtitle = (formData[subtitleKey] as string) || boxDef.defaultSubtitle;
                        const isDragging = draggedIndex === index;
                        const isDragOver = dragOverIndex === index;

                        return (
                          <div
                            key={boxId}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={() => handleDrop(index)}
                            onDragEnd={handleDragEnd}
                            className={`p-3 rounded-xl border transition-all relative flex flex-col justify-between select-none ${
                              isDragging
                                ? 'opacity-40 border-dashed border-cyan-400 bg-cyan-950/30 scale-95'
                                : isDragOver
                                ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400 scale-[1.02]'
                                : boxDef.isDigitalApproval
                                ? 'bg-[#101217] border-cyan-700/60 shadow-sm'
                                : 'bg-[#101217] border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {/* Card Header with Grip Handle, Position Badge & Move Buttons */}
                            <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-zinc-800/80">
                              <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-zinc-400 hover:text-cyan-400" />
                                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                                  #{index + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {boxDef.isDigitalApproval && (
                                  <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                                    Digital Sign
                                  </span>
                                )}

                                {/* Up / Down Order Buttons */}
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveBox(index, -1)}
                                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 bg-zinc-900 rounded border border-zinc-800"
                                  title="เลื่อนขึ้น / ไปทางซ้าย"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === currentBoxOrder.length - 1}
                                  onClick={() => handleMoveBox(index, 1)}
                                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 bg-zinc-900 rounded border border-zinc-800"
                                  title="เลื่อนลง / ไปทางขวา"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Card Inputs */}
                            <div className="space-y-2 flex-1">
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                                  ชื่อหัวข้อกล่องลายเซ็น:
                                </label>
                                <input
                                  type="text"
                                  value={currentTitle}
                                  onChange={(e) => {
                                    handleChange(titleKey, e.target.value);
                                    if (boxDef.id === 'box2') handleChange('step1Title', e.target.value);
                                    if (boxDef.id === 'box3') handleChange('step2Title', e.target.value);
                                    if (boxDef.id === 'box6') handleChange('step3Title', e.target.value);
                                  }}
                                  className={`w-full bg-zinc-900 rounded-lg p-2 text-white text-xs font-semibold border ${
                                    boxDef.isDigitalApproval
                                      ? 'border-cyan-700/80 focus:border-cyan-400'
                                      : 'border-zinc-700 focus:border-zinc-500'
                                  }`}
                                  placeholder={boxDef.defaultTitle}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                                  คำอธิบายย่อย (Subtitle):
                                </label>
                                <input
                                  type="text"
                                  value={currentSubtitle}
                                  onChange={(e) => {
                                    handleChange(subtitleKey, e.target.value);
                                    if (boxDef.id === 'box2') handleChange('step1Subtitle', e.target.value);
                                    if (boxDef.id === 'box3') handleChange('step2Subtitle', e.target.value);
                                    if (boxDef.id === 'box6') handleChange('step3Subtitle', e.target.value);
                                  }}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 text-zinc-300 text-[11px] focus:border-zinc-500"
                                  placeholder={boxDef.defaultSubtitle}
                                />
                              </div>
                            </div>

                            {/* Card Bottom Indicator */}
                            <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[9.5px] text-zinc-500 font-mono">
                              <span>ID: {boxDef.id}</span>
                              <span>{boxDef.isDigitalApproval ? '⚡ ระบบอนุมัติ' : '📄 บันทึกลายเซ็น'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Step 1: IT */}
                    <div className="bg-[#101217] p-4 rounded-xl border border-cyan-900/60 space-y-2">
                      <div className="text-[10px] font-mono font-bold text-cyan-400">ลำดับที่ 1 (STEP 1)</div>
                      <div>
                        <label className="block text-zinc-400 mb-1">ชื่อตำแหน่ง / ผู้จัดทำ</label>
                        <input
                          type="text"
                          value={formData.step1Title}
                          onChange={(e) => handleChange('step1Title', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">คำอธิบายย่อย (Subtitle)</label>
                        <input
                          type="text"
                          value={formData.step1Subtitle}
                          onChange={(e) => handleChange('step1Subtitle', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-300"
                        />
                      </div>
                    </div>

                    {/* Step 2: Manager */}
                    <div className="bg-[#101217] p-4 rounded-xl border border-amber-900/60 space-y-2">
                      <div className="text-[10px] font-mono font-bold text-amber-400">ลำดับที่ 2 (STEP 2)</div>
                      <div>
                        <label className="block text-zinc-400 mb-1">ชื่อตำแหน่ง / ผู้จัดการ</label>
                        <input
                          type="text"
                          value={formData.step2Title}
                          onChange={(e) => handleChange('step2Title', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">คำอธิบายย่อย (Subtitle)</label>
                        <input
                          type="text"
                          value={formData.step2Subtitle}
                          onChange={(e) => handleChange('step2Subtitle', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-300"
                        />
                      </div>
                    </div>

                    {/* Step 3: ACC */}
                    <div className="bg-[#101217] p-4 rounded-xl border border-emerald-900/60 space-y-2">
                      <div className="text-[10px] font-mono font-bold text-emerald-400">ลำดับที่ 3 (STEP 3)</div>
                      <div>
                        <label className="block text-zinc-400 mb-1">ชื่อตำแหน่ง / บัญชีและการเงิน</label>
                        <input
                          type="text"
                          value={formData.step3Title}
                          onChange={(e) => handleChange('step3Title', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">คำอธิบายย่อย (Subtitle)</label>
                        <input
                          type="text"
                          value={formData.step3Subtitle}
                          onChange={(e) => handleChange('step3Subtitle', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-[#101217] p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">ความสูงกล่องลายมือชื่อ (Signature Box Height):</span>
                    <span className="text-zinc-400 text-[11px]">ปรับพื้นที่ความสูงกล่องสำหรับลงลายเซ็น (แนะนำ 75px - 95px สำหรับ 9 กล่อง)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="70"
                      max="140"
                      value={formData.signatureBoxHeight}
                      onChange={(e) => handleChange('signatureBoxHeight', Number(e.target.value))}
                      className="w-32 accent-cyan-400"
                    />
                    <span className="font-mono text-cyan-400 font-bold">{formData.signatureBoxHeight}px</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Remarks & Security Section */}
            {activeSection === 'remarks' && (
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>ข้อความระเบียบบริษัท และความปลอดภัย (Remarks & Security)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ข้อกำหนดการนำทรัพย์สินออกนอกสถานที่ และการแสดงลายน้ำป้องกันการปลอมแปลง
                  </p>
                </div>

                <div className="text-xs space-y-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">ข้อความหมายเหตุสำคัญ (กรอบสีเหลืองท้ายตาราง)</label>
                    <textarea
                      rows={2}
                      value={formData.importantRemarkText}
                      onChange={(e) => handleChange('importantRemarkText', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-[#101217] rounded-xl border border-zinc-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.showVehicleDispatch}
                          onChange={(e) => handleChange('showVehicleDispatch', e.target.checked)}
                          className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                        />
                        <span className="text-zinc-200 font-bold">แสดงข้อมูลผู้นำส่งและทะเบียนรถ</span>
                      </label>
                      <p className="text-[11px] text-zinc-400 pl-6">
                        แสดงชื่อผู้นำส่งและทะเบียนรถยนต์สำหรับตรวจสอบ ณ ประตูรักษาความปลอดภัย
                      </p>
                    </div>

                    <div className="p-3 bg-[#101217] rounded-xl border border-zinc-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.showWatermark}
                          onChange={(e) => handleChange('showWatermark', e.target.checked)}
                          className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-400 bg-zinc-800"
                        />
                        <span className="text-zinc-200 font-bold">แสดงลายน้ำเอกสาร (Watermark)</span>
                      </label>
                      {formData.showWatermark && (
                        <input
                          type="text"
                          value={formData.watermarkText}
                          onChange={(e) => handleChange('watermarkText', e.target.value)}
                          placeholder="ข้อความลายน้ำ เช่น OFFICIAL TRANSFER"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-white"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">ข้อความท้ายเอกสาร (Footer Note)</label>
                    <input
                      type="text"
                      value={formData.footerNote}
                      onChange={(e) => handleChange('footerNote', e.target.value)}
                      className="w-full bg-[#101217] border border-zinc-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Visual Preview Container */}
      <div className="bg-[#161824] p-5 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              ตัวอย่างการแสดงผลจริงบนกระดาษ 1 หน้า A4 แนวนอน (Live Interactive Preview)
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            สเกลปัจจุบัน: <strong className="text-cyan-400">{formData.pageScale}%</strong> | ระยะขอบ: <strong className="text-zinc-200">{formData.pagePaddingPreset}</strong>
          </span>
        </div>

        {/* Scaled Preview Box */}
        <div className="overflow-x-auto p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 flex justify-center shadow-inner">
          <div
            style={{
              transform: `scale(${formData.pageScale / 100})`,
              transformOrigin: 'top center',
              fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
            }}
            className={`bg-white text-zinc-900 w-[1040px] min-h-[660px] shadow-2xl border border-zinc-300 font-sans flex flex-col justify-between select-none transition-transform duration-200 ${
              formData.pagePaddingPreset === 'compact' ? 'p-4' : formData.pagePaddingPreset === 'relaxed' ? 'p-8' : 'p-6'
            }`}
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-2.5">
                <div className="flex items-start gap-3">
                  {formData.showLogo && (
                    <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold text-lg tracking-tighter shrink-0">
                      {formData.logoText || 'XT'}
                    </div>
                  )}
                  <div className="leading-tight">
                    <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                      {formData.companyNameTh}
                    </h1>
                    <div className="text-[11px] font-bold text-zinc-800">
                      {formData.companyNameEn}
                    </div>
                    <div className="text-[9.5px] text-zinc-600">
                      {formData.companyChineseName} • เลขประจำตัวผู้เสียภาษี: {formData.companyTaxId}
                    </div>
                    <div className="text-[9px] text-zinc-600 mt-0.5 max-w-xl">
                      {formData.addressBkk} โทร. {formData.phone}
                    </div>
                    {formData.showBranchAddress && (
                      <div className="text-[8.5px] text-zinc-500">
                        RAYONG: {formData.addressRayong}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right leading-tight min-w-[220px]">
                  <div className="text-sm font-extrabold uppercase tracking-wider text-zinc-900 border-b border-zinc-400 pb-0.5 mb-1">
                    {formData.formTitleTh}
                  </div>
                  <div className="text-[9.5px] font-bold text-zinc-700 tracking-widest uppercase">
                    {formData.formTitleEn}
                  </div>
                  <div className="mt-1 text-[10.5px] font-mono">
                    <span className="text-zinc-600">เลขที่เอกสาร: </span>
                    <strong className="text-zinc-900 font-extrabold">TF6908001</strong>
                  </div>
                  <div className="text-[10.5px] font-mono">
                    <span className="text-zinc-600">วันที่: </span>
                    <strong className="text-zinc-900">2026-08-15</strong>
                  </div>
                </div>
              </div>

              {/* Origin Banner */}
              <div className="grid grid-cols-12 gap-2 my-2 py-1 px-3 bg-zinc-100 border border-zinc-300 rounded text-[10.5px]">
                <div className="col-span-7 flex items-center gap-2">
                  <span className="font-bold text-zinc-700">สาขา / แผนกต้นทาง:</span>
                  <span className="text-zinc-900 font-semibold">สำนักงานใหญ่ ศรีนครินทร์ (TH100) / XT018-IT</span>
                </div>
                <div className="col-span-5 flex items-center justify-end gap-3 text-[10px]">
                  <span className="font-bold text-zinc-700">สาเหตุ:</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-900">
                    ส่งมอบเครื่องประจำตำแหน่งพนักงานใหม่
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-zinc-900 rounded overflow-hidden mt-1">
                <table className="w-full text-left border-collapse text-[9.5px]">
                  <thead>
                    <tr className="bg-zinc-800 text-white font-bold text-center divide-x divide-zinc-700 text-[9px]">
                      <th className="py-1 px-1 w-7">{formData.colTitleNo}</th>
                      <th className="py-1 px-1.5 w-24">{formData.colTitleAssetId}</th>
                      {formData.showItemCode && <th className="py-1 px-1.5 w-24">{formData.colTitleItemCode}</th>}
                      <th className="py-1 px-2 text-left">{formData.colTitleAssetName}</th>
                      <th className="py-1 px-1 w-8">{formData.colTitleQty}</th>
                      <th className="py-1 px-1.5 w-20">{formData.colTitleTransferorDept}</th>
                      {formData.showTransferorStaffId && <th className="py-1 px-1.5 w-20">รหัสผู้โอน</th>}
                      <th className="py-1 px-1.5 w-28">{formData.colTitleTransferorName}</th>
                      <th className="py-1 px-1.5 w-20">{formData.colTitleReceiverDept}</th>
                      {formData.showReceiverStaffId && <th className="py-1 px-1.5 w-20">รหัสผู้รับ</th>}
                      <th className="py-1 px-1.5 w-28">{formData.colTitleReceiverName}</th>
                      {formData.showReceiverLocation && <th className="py-1 px-2 text-left">{formData.colTitleDestination}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-300 text-zinc-800">
                    <tr className="divide-x divide-zinc-300">
                      <td className="py-1.5 px-1 text-center font-mono font-bold text-zinc-600">1</td>
                      <td className="py-1.5 px-1.5 font-mono font-bold text-blue-900">3-100-880124</td>
                      {formData.showItemCode && (
                        <td className="py-1.5 px-1.5 font-mono text-[8.5px]">
                          <div>XT-IT-001</div>
                          {formData.showSerialNo && <div className="text-zinc-500">S/N: 5CG2398XPT</div>}
                        </td>
                      )}
                      <td className="py-1.5 px-2 text-zinc-900 font-medium">
                        HP EliteBook 840 G9 (Core i7-1260P / 16GB / 512GB)
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono font-bold">1</td>
                      <td className="py-1.5 px-1.5 text-center font-mono text-[8.5px]">XT018-IT</td>
                      {formData.showTransferorStaffId && <td className="py-1.5 px-1.5 text-center font-mono text-[8.5px]">IT-250801</td>}
                      <td className="py-1.5 px-1.5 font-semibold text-zinc-900">นายคเชนทร์ ทรัพย์เจริญ</td>
                      <td className="py-1.5 px-1.5 text-center font-mono text-[8.5px] text-blue-900">XT008-ACC</td>
                      {formData.showReceiverStaffId && <td className="py-1.5 px-1.5 text-center font-mono text-[8.5px] text-blue-900">ACC-240102</td>}
                      <td className="py-1.5 px-1.5 text-blue-900 font-bold">นางสาวศศิธร สุขสมบูรณ์</td>
                      {formData.showReceiverLocation && <td className="py-1.5 px-2 text-[8.5px] text-zinc-700">สำนักงานใหญ่ ศรีนครินทร์ ชั้น 4</td>}
                    </tr>
                    <tr className="divide-x divide-zinc-200 h-6 text-zinc-300">
                      <td className="text-center font-mono text-[8.5px]">2</td>
                      <td colSpan={11} className="text-center text-[8.5px] text-zinc-400 italic">
                        (พื้นที่สำหรับรายการถัดไป)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks Banner */}
              <div className="mt-2 text-[9px] text-zinc-700 bg-amber-50 border border-amber-300/80 p-1.5 rounded flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-900">⚠️ หมายเหตุ:</span>
                  <span>{formData.importantRemarkText}</span>
                </div>
                {formData.showVehicleDispatch && (
                  <div className="font-mono text-zinc-700 shrink-0 text-[8.5px]">
                    ผู้นำส่ง: นายคเชนทร์ ทรัพย์เจริญ • ทะเบียนรถ: 7กง-1288 กทม.
                  </div>
                )}
              </div>
            </div>

            {/* Signature Boxes Preview */}
            <div className="mt-3 pt-2.5 border-t-2 border-zinc-900">
              {formData.signatureMode === '9_BOXES' ? (
                <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
                  {currentBoxOrder.map((boxId, idx) => {
                    const boxDef = SIGNATURE_BOX_DEFINITIONS[boxId] || SIGNATURE_BOX_DEFINITIONS['box1'];
                    const title = (formData[boxDef.defaultTitleKey] as string) || boxDef.defaultTitle;
                    const subtitle = (formData[boxDef.defaultSubtitleKey] as string) || boxDef.defaultSubtitle;

                    return (
                      <div
                        key={boxId}
                        style={{ minHeight: `${Math.max(62, formData.signatureBoxHeight * 0.72)}px` }}
                        className={`border rounded p-1.5 flex flex-col justify-between ${
                          boxDef.isDigitalApproval
                            ? 'border-cyan-500 bg-cyan-50/70 shadow-xs'
                            : 'border-zinc-300 bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="text-left leading-tight">
                            <div className="font-bold text-zinc-900 text-[9.5px]">
                              {title}
                            </div>
                            <div className="text-[7.5px] text-zinc-500 font-sans">
                              {subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="my-0.5 text-zinc-400 italic text-[8px] border-b border-dashed border-zinc-400 w-24 mx-auto pb-0.5">
                          {boxDef.isDigitalApproval ? '(ลงลายมือชื่อดิจิทัล)' : '(ลงลายมือชื่อ)'}
                        </div>

                        <div className="text-[7.5px] text-zinc-600 truncate">
                          ชื่อ: <strong>...........................................</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center text-[9.5px]">
                  {/* 1. IT */}
                  <div
                    style={{ height: `${formData.signatureBoxHeight * 0.85}px` }}
                    className="border border-zinc-400 rounded-lg p-2 bg-zinc-50 flex flex-col justify-between"
                  >
                    <div className="font-bold text-zinc-800 uppercase tracking-tight text-[10px]">
                      {formData.step1Title}
                    </div>
                    <div className="text-zinc-400 italic text-[9px] border-b border-dashed border-zinc-400 w-32 mx-auto pb-0.5">
                      (ลงลายมือชื่อไอที/ผู้จัดทำ)
                    </div>
                    <div className="text-[8.5px] text-zinc-600">
                      ชื่อ: <strong>...........................................</strong>
                    </div>
                  </div>

                  {/* 2. Manager */}
                  <div
                    style={{ height: `${formData.signatureBoxHeight * 0.85}px` }}
                    className="border border-zinc-400 rounded-lg p-2 bg-zinc-50 flex flex-col justify-between"
                  >
                    <div className="font-bold text-zinc-800 uppercase tracking-tight text-[10px]">
                      {formData.step2Title}
                    </div>
                    <div className="text-zinc-400 italic text-[9px] border-b border-dashed border-zinc-400 w-32 mx-auto pb-0.5">
                      (ลงลายมือชื่อผู้จัดการฝ่าย)
                    </div>
                    <div className="text-[8.5px] text-zinc-600">
                      ชื่อ: <strong>...........................................</strong>
                    </div>
                  </div>

                  {/* 3. ACC */}
                  <div
                    style={{ height: `${formData.signatureBoxHeight * 0.85}px` }}
                    className="border border-zinc-400 rounded-lg p-2 bg-zinc-50 flex flex-col justify-between"
                  >
                    <div className="font-bold text-zinc-800 uppercase tracking-tight text-[10px]">
                      {formData.step3Title}
                    </div>
                    <div className="text-zinc-400 italic text-[9px] border-b border-dashed border-zinc-400 w-32 mx-auto pb-0.5">
                      (ลงลายมือชื่อฝ่ายบัญชี/การเงิน)
                    </div>
                    <div className="text-[8.5px] text-zinc-600">
                      ชื่อ: <strong>...........................................</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
