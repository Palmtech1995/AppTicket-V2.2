/**
 * ============================================================================
 * [MODULE: IT TICKET WORKBENCH & RESOLUTION MODAL]
 * File: /src/components/Tickets/TicketDetailModal.tsx
 * Description: IT Technician workbench for updating resolution notes, vendor repair costs,
 *              SLA hours, status transitions, and viewing the associated Bin Card.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Technician Assignment & Worklog: มอบหมายช่าง บันทึกการแก้ไขปัญหา
 * 2. Vendor Repair & Cost Tracking: บันทึกค่าซ่อมภายนอกและอะไหล่
 * 3. Status Transitions: NEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  X,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Wrench,
  DollarSign,
  Building,
  Calendar,
  Send,
  History,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Asset, ITTicket, TechnicianMetric, UserProfile } from '../../types';

interface TicketDetailModalProps {
  ticket: ITTicket | null;
  currentUser: UserProfile;
  technicians: TechnicianMetric[];
  assets: Asset[];
  onClose: () => void;
  onUpdateTicket: (updatedTicket: ITTicket) => void;
  onOpenAssetBincard: (asset: Asset) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  currentUser,
  technicians,
  assets,
  onClose,
  onUpdateTicket,
  onOpenAssetBincard,
}) => {
  if (!ticket) return null;

  const isITOrAdmin = currentUser.role === 'IT' || currentUser.role === 'ADMIN';

  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignedTechnician, setAssignedTechnician] = useState(ticket.assignedToTechnician || '');
  const [resolutionHours, setResolutionHours] = useState(ticket.resolutionHours || 0);
  const [resolutionNote, setResolutionNote] = useState(ticket.resolutionNote || '');
  const [repairCost, setRepairCost] = useState(ticket.repairCost || 0);
  const [repairVendor, setRepairVendor] = useState(ticket.repairVendor || '');
  const [repairSentDate, setRepairSentDate] = useState(ticket.repairSentDate || '');
  const [repairReturnedDate, setRepairReturnedDate] = useState(ticket.repairReturnedDate || '');

  const [newComment, setNewComment] = useState('');

  const matchedAsset = assets.find((a) => a.assetId === ticket.assetId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const techObj = technicians.find((t) => t.id === assignedTechnician);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const historyEntry = {
      timestamp: nowStr,
      action: `Status: ${status} | Assigned: ${techObj?.name || 'Unassigned'} | Notes: ${resolutionNote || 'Updated by ' + currentUser.name}`,
      byUser: currentUser.thaiName || currentUser.name,
    };

    const updated: ITTicket = {
      ...ticket,
      status,
      priority,
      assignedToTechnician: assignedTechnician || undefined,
      assignedTechnicianName: techObj ? techObj.name : undefined,
      resolutionHours: Number(resolutionHours) || undefined,
      resolutionNote: resolutionNote || undefined,
      resolvedAt: status === 'RESOLVED' ? (ticket.resolvedAt || nowStr) : undefined,
      repairCost: Number(repairCost) || undefined,
      repairVendor: repairVendor || undefined,
      repairSentDate: repairSentDate || undefined,
      repairReturnedDate: repairReturnedDate || undefined,
      updatedAt: nowStr,
      historyLog: [historyEntry, ...(ticket.historyLog || [])],
    };

    onUpdateTicket(updated);
    onClose();
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated: ITTicket = {
      ...ticket,
      updatedAt: nowStr,
      historyLog: [
        {
          timestamp: nowStr,
          action: newComment,
          byUser: currentUser.thaiName || currentUser.name,
        },
        ...(ticket.historyLog || []),
      ],
    };

    onUpdateTicket(updated);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12141c] border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-[#161824] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-extrabold text-cyan-400">
                  {ticket.id}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {ticket.category}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 line-clamp-1">{ticket.subject}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Details & Timeline */}
          <div className="lg:col-span-7 space-y-5">
            {/* Subject & Description */}
            <div className="bg-[#161822] p-4 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-xs text-zinc-400 font-semibold">รายละเอียดปัญหา (Details):</div>
              <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {ticket.details}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-3 border-t border-zinc-800">
                <div>
                  ผู้แจ้ง: <strong className="text-zinc-200">{ticket.requesterStaffName}</strong>
                </div>
                <div>
                  แผนก: <strong className="text-zinc-200">{ticket.requesterDept}</strong> ({ticket.requesterBranch})
                </div>
                <div>
                  วันที่แจ้ง: <strong className="text-zinc-200 font-mono">{ticket.createdAt}</strong>
                </div>
                <div>
                  อัปเดตล่าสุด: <strong className="text-zinc-200 font-mono">{ticket.updatedAt}</strong>
                </div>
              </div>
            </div>

            {/* Linked Asset Card */}
            {ticket.assetId && (
              <div className="bg-[#161822] p-4 rounded-xl border border-cyan-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> ทรัพย์สินที่เกี่ยวข้อง (Linked Asset)
                  </div>
                  {matchedAsset && (
                    <button
                      type="button"
                      onClick={() => onOpenAssetBincard(matchedAsset)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>เปิดดู Bincard</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-white font-medium">
                  [{ticket.assetId}] - {ticket.assetName || matchedAsset?.assetName}
                </div>

                {matchedAsset && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
                    <div>Location: {matchedAsset.location}</div>
                    <div>Owner: {matchedAsset.ownerStaffName || 'ส่วนกลาง'}</div>
                  </div>
                )}
              </div>
            )}

            {/* History Log Timeline */}
            <div className="bg-[#161822] p-4 rounded-xl border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-300">
                บันทึกการทำงาน & ความคืบหน้า (Activity Log):
              </div>

              {/* Add comment quick input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ข้อความอัปเดตงาน หรือบันทึกความคืบหน้า..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  className="flex-1 bg-[#11131a] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่ง</span>
                </button>
              </div>

              <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {(ticket.historyLog || []).map((item, idx) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#161822]" />
                    <div className="text-[10px] font-mono text-zinc-400">
                      {item.timestamp} • <strong className="text-zinc-300">{item.byUser}</strong>
                    </div>
                    <div className="text-zinc-200 mt-0.5">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: IT Operations & Resolution Editor */}
          <div className="lg:col-span-5 bg-[#161822] p-5 rounded-xl border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
              <span>การบริหารจัดการงาน IT & ค่าซ่อม</span>
              {!isITOrAdmin && <span className="text-[10px] text-zinc-500 font-normal">(View Only)</span>}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Status */}
              <div>
                <label className="text-zinc-400 block mb-1">สถานะงาน (Status)</label>
                <select
                  disabled={!isITOrAdmin}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-zinc-200 font-semibold disabled:opacity-60"
                >
                  <option value="NEW">NEW (รอดำเนินการ)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (กำลังแก้ไข)</option>
                  <option value="RESOLVED">RESOLVED (แก้ไขเสร็จแล้ว)</option>
                  <option value="CLOSED">CLOSED (ปิดงานสมบูรณ์)</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-zinc-400 block mb-1">ระดับความสำคัญ (Priority)</label>
                <select
                  disabled={!isITOrAdmin}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-zinc-200 disabled:opacity-60"
                >
                  <option value="CRITICAL">P0 CRITICAL (ด่วนที่สุด)</option>
                  <option value="HIGH">HIGH (สูง)</option>
                  <option value="MEDIUM">MEDIUM (ปานกลาง)</option>
                  <option value="LOW">LOW (ปกติ)</option>
                </select>
              </div>

              {/* Assign Technician */}
              <div>
                <label className="text-zinc-400 block mb-1">มอบหมายช่างผู้รับผิดชอบ (Assign Tech)</label>
                <select
                  disabled={!isITOrAdmin}
                  value={assignedTechnician}
                  onChange={(e) => setAssignedTechnician(e.target.value)}
                  className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-cyan-300 font-semibold disabled:opacity-60"
                >
                  <option value="">-- ยังไม่ได้มอบหมาย --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.shortCode}) - Eff: {tech.efficiency}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolution Hours */}
              <div>
                <label className="text-zinc-400 block mb-1">เวลาที่ใช้แก้ไข (ชั่วโมง / Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  disabled={!isITOrAdmin}
                  value={resolutionHours}
                  onChange={(e) => setResolutionHours(Number(e.target.value))}
                  className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono disabled:opacity-60"
                />
              </div>

              {/* Resolution Note */}
              <div>
                <label className="text-zinc-400 block mb-1">บันทึกผลการแก้ไข (Resolution Notes)</label>
                <textarea
                  rows={2}
                  disabled={!isITOrAdmin}
                  placeholder="เช่น อัปเดตแพตช์ระบบ เปลี่ยนหัวอ่านบาร์โค้ด หรือรีเซ็ตการเชื่อมต่อ..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-zinc-200 disabled:opacity-60"
                />
              </div>

              {/* Repair Vendor & Cost */}
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <div className="text-[11px] font-bold text-amber-400">
                  ข้อมูลการส่งซ่อมภายนอก / ศูนย์บริการ (ถ้ามี):
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1 text-[10px]">ศูนย์บริการ / ร้าน</label>
                    <input
                      type="text"
                      disabled={!isITOrAdmin}
                      placeholder="เช่น Urovo Center"
                      value={repairVendor}
                      onChange={(e) => setRepairVendor(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded p-1.5 text-zinc-200 text-xs disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 text-[10px]">ค่าใช้จ่ายซ่อม (THB)</label>
                    <input
                      type="number"
                      min="0"
                      disabled={!isITOrAdmin}
                      value={repairCost}
                      onChange={(e) => setRepairCost(Number(e.target.value))}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded p-1.5 text-emerald-400 font-mono font-bold text-xs disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {isITOrAdmin && (
                <div className="pt-3 border-t border-zinc-800 flex justify-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    บันทึกการปรับปรุงงาน
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
