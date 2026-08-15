/**
 * ============================================================================
 * [MODULE: NEW IT TICKET REQUEST MODAL]
 * File: /src/components/Tickets/NewTicketModal.tsx
 * Description: Modal form for submitting IT helpdesk tickets, hardware repair requests,
 *              or software support with category selection and asset linkage.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Category Classification: หมวดหมู่อาการเสีย (Hardware, Software, Network, Access)
 * 2. Urgency Matrix: กำหนดระดับความสำคัญ (LOW, MEDIUM, HIGH, CRITICAL)
 * 3. Asset Binding: เลือกผูกกับรหัสทรัพย์สินของผู้แจ้งโดยตรง
 * ============================================================================
 */

import React, { useState } from 'react';
import { X, Ticket, AlertTriangle, Boxes, Send } from 'lucide-react';
import { Asset, ITTicket, TicketCategory, UserProfile } from '../../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: Partial<ITTicket>) => void;
  currentUser: UserProfile;
  assets: Asset[];
  initialAsset?: Asset | null;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  assets,
  initialAsset,
}) => {
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<TicketCategory>('HARDWARE_MALFUNCTION');
  const [priority, setPriority] = useState<ITTicket['priority']>('MEDIUM');
  const [selectedAssetId, setSelectedAssetId] = useState(initialAsset?.assetId || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;

    const matchedAsset = assets.find((a) => a.assetId === selectedAssetId);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newId = `#XT-${Math.floor(8000 + Math.random() * 1999)}`;

    onSubmit({
      id: newId,
      subject,
      details,
      category,
      priority,
      status: 'NEW',
      requesterStaffId: currentUser.staffId,
      requesterStaffName: currentUser.thaiName || currentUser.name,
      requesterDept: currentUser.departmentCode || 'XT018-IT',
      requesterBranch: currentUser.branchCode || 'TH100',
      assetId: matchedAsset ? matchedAsset.assetId : undefined,
      assetName: matchedAsset ? matchedAsset.assetName : undefined,
      createdAt: nowStr,
      updatedAt: nowStr,
      historyLog: [
        {
          timestamp: nowStr,
          action: 'Ticket submitted via Helpdesk Portal',
          byUser: currentUser.thaiName || currentUser.name,
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12141c] border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-[#161824] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">แจ้งปัญหา IT / เปิด Ticket ใหม่</h2>
              <p className="text-xs text-zinc-400">
                ผู้แจ้ง: <strong className="text-zinc-200">{currentUser.thaiName || currentUser.name}</strong> ({currentUser.staffId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">หัวข้อปัญหา (Subject) *</label>
            <input
              type="text"
              required
              placeholder="เช่น เครื่องสแกนบาร์โค้ดเปิดไม่ติด, อินเทอร์เน็ตหลุดบ่อย, ขอลงโปรแกรม..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 block mb-1">หมวดหมู่ปัญหา (Category) *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              >
                <option value="HARDWARE_MALFUNCTION">อุปกรณ์ชำรุด / ฮาร์ดแวร์เสีย (Hardware)</option>
                <option value="SOFTWARE_ISSUE">โปรแกรม / ระบบซอฟต์แวร์ (Software/ERP)</option>
                <option value="NETWORK_WIFI">เครือข่ายอินเทอร์เน็ต / VPN (Network)</option>
                <option value="NEW_EQUIPMENT">ขอเบิกอุปกรณ์ใหม่ / ติดตั้ง (New Setup)</option>
                <option value="ACCESS_PERMISSION">ขอสิทธิ์เข้าใช้งานระบบ (Access Rights)</option>
                <option value="OTHER">อื่นๆ (Other)</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">ระดับความเร่งด่วน (Priority) *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              >
                <option value="CRITICAL">🔥 P0 CRITICAL (ระบบหยุดชะงัก / ด่วนที่สุด)</option>
                <option value="HIGH">⚠️ HIGH (กระทบงานหลักของแผนก)</option>
                <option value="MEDIUM">MEDIUM (กระทบงานทั่วไป)</option>
                <option value="LOW">LOW (ปกติ / ไม่เร่งด่วน)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">
              ทรัพย์สินที่พบปัญหา (เลือกจากรายการถ้ามี)
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 font-mono"
            >
              <option value="">-- ไม่ได้ผูกกับอุปกรณ์เฉพาะชิ้น (เช่น ปัญหาเน็ตเวิร์ก/ซอฟต์แวร์) --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.assetId}>
                  [{a.assetId}] - {a.itemCode} - {a.assetName.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">
              รายละเอียดของปัญหา และสิ่งที่เกิดขึ้น (Details) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="ระบุสิ่งที่พบ รหัสข้อผิดพลาด หรือเหตุการณ์ที่เกิดขึ้น..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งคำร้องแจ้งซ่อม IT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
