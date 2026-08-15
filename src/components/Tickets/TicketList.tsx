/**
 * ============================================================================
 * [MODULE: IT HELPDESK & TICKET MANAGEMENT]
 * File: /src/components/Tickets/TicketList.tsx
 * Description: IT incident management queue with 3-month SLA filters,
 *              priority matrices, technician assignments, and Excel export.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. SLA Timeframe Toggles: ตัวกรองประวัติย้อนหลัง 3 เดือน / ทั้งหมด
 * 2. Role-Aware Views: สำหรับพนักงานทั่วไป (USER) จะเห็นเฉพาะ Ticket ของตนเอง
 * 3. Technician Workload Badges: แสดงชื่อช่างผู้รับผิดชอบงานและความคืบหน้า
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  User,
  Wrench,
  DollarSign,
  Building,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';
import { Asset, ITTicket, TechnicianMetric, UserProfile, UserRole } from '../../types';
import { exportTicketsToExcel } from '../../utils/exportUtils';

interface TicketListProps {
  tickets: ITTicket[];
  technicians: TechnicianMetric[];
  currentUser: UserProfile;
  onOpenTicketDetail: (ticket: ITTicket) => void;
  onOpenNewTicketModal: () => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  technicians,
  currentUser,
  onOpenTicketDetail,
  onOpenNewTicketModal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<'3MONTHS' | 'ALL'>('3MONTHS');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const isRegularUser = currentUser.role === 'USER';

  // Three months calculation
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filteredTickets = tickets.filter((t) => {
    // If regular user: strictly only show their own tickets!
    if (isRegularUser && t.requesterStaffId !== currentUser.staffId && t.requesterStaffName !== currentUser.name && t.requesterStaffName !== currentUser.thaiName) {
      return false;
    }

    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.details.toLowerCase().includes(q) ||
      t.requesterStaffName.toLowerCase().includes(q) ||
      (t.assignedTechnicianName && t.assignedTechnicianName.toLowerCase().includes(q)) ||
      (t.assetId && t.assetId.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    // Time filter
    let matchTime = true;
    if (timeframe === '3MONTHS') {
      const ticketDate = new Date(t.createdAt);
      matchTime = ticketDate >= threeMonthsAgo;
    }

    return matchQuery && matchStatus && matchPriority && matchTime;
  });

  const getPriorityBadge = (p: ITTicket['priority']) => {
    switch (p) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> P0 CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (s: ITTicket['status']) => {
    switch (s) {
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> RESOLVED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> IN PROGRESS
          </span>
        );
      case 'NEW':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
            NEW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            XING TAI IT HELPDESK & TICKET SYSTEM
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {isRegularUser ? 'แจ้งซ่อม & ติดตามงาน IT (My Requests)' : 'IT Support Tickets & Helpdesk'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isRegularUser
              ? 'แจ้งปัญหาคอมพิวเตอร์ อุปกรณ์สำนักงาน ระบบเน็ตเวิร์ก และติดตามสถานะ'
              : 'ศูนย์ควบคุมคิวงานแจ้งซ่อม IT บันทึกชั่วโมงทำงาน ค่าใช้จ่าย และประวัติ 3 เดือน'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isRegularUser && (
            <button
              onClick={() => exportTicketsToExcel(filteredTickets)}
              className="flex items-center gap-2 bg-[#171a23] hover:bg-[#202533] text-emerald-400 border border-emerald-900/60 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          )}

          <button
            onClick={onOpenNewTicketModal}
            className="flex items-center gap-2 bg-gradient-to-r from-zinc-100 to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-900 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-zinc-900" strokeWidth={3} />
            <span>+ แจ้งซ่อมใหม่ (New Ticket)</span>
          </button>
        </div>
      </div>

      {/* Filter and Time Window Bar */}
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหา Ticket ID, หัวข้อปัญหา, ช่างผู้ดูแล หรือ รหัสทรัพย์สิน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#171922] border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#171922] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">Status (ทุกสถานะ)</option>
              <option value="NEW">NEW (รอดำเนินการ)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (กำลังแก้ไข)</option>
              <option value="RESOLVED">RESOLVED (แก้ไขเสร็จแล้ว)</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-[#171922] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">Priority (ทุกความสำคัญ)</option>
              <option value="CRITICAL">P0 CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* 3-Month Toggle Button */}
          <div className="sm:col-span-3 flex items-center justify-end gap-1 bg-[#171922] p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setTimeframe('3MONTHS')}
              className={`flex-1 py-1 px-2 rounded font-medium transition-all text-center ${
                timeframe === '3MONTHS'
                  ? 'bg-zinc-700 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ย้อนหลัง 3 เดือน
            </button>
            <button
              onClick={() => setTimeframe('ALL')}
              className={`flex-1 py-1 px-2 rounded font-medium transition-all text-center ${
                timeframe === 'ALL'
                  ? 'bg-zinc-700 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-[#12141a] rounded-xl border border-zinc-800">
            <Ticket className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
            <div className="text-sm text-zinc-400">ไม่พบรายการ Ticket ตามเงื่อนไข</div>
            <div className="text-xs text-zinc-500 mt-1">กดปุ่ม "+ แจ้งซ่อมใหม่" เพื่อสร้างคำร้อง</div>
          </div>
        ) : (
          filteredTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onOpenTicketDetail(t)}
              className="bg-[#12141a] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-extrabold text-cyan-400 text-xs">
                    {t.id}
                  </span>
                  {getPriorityBadge(t.priority)}
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                    {t.category}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {t.createdAt}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-1">
                  {t.subject}
                </h3>

                <p className="text-xs text-zinc-400 line-clamp-1">
                  {t.details}
                </p>

                {t.assetId && (
                  <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-cyan-400" />
                    <span>ทรัพย์สินที่เกี่ยวข้อง: </span>
                    <strong className="text-zinc-300">{t.assetId}</strong> ({t.assetName || ''})
                  </div>
                )}
              </div>

              {/* Right Info: Status & Technician */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/80">
                {getStatusBadge(t.status)}

                <div className="text-[11px] text-zinc-400 text-right">
                  {t.assignedTechnicianName ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-cyan-400">
                        {t.assignedTechnicianName.charAt(0)}
                      </div>
                      <span className="text-zinc-300 font-medium">{t.assignedTechnicianName}</span>
                    </div>
                  ) : (
                    <span className="text-amber-400 italic">Unassigned (ยังไม่ได้จ่ายงาน)</span>
                  )}
                </div>

                {t.repairCost && t.repairCost > 0 ? (
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    ค่าซ่อม: ฿{t.repairCost.toLocaleString()} THB
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
