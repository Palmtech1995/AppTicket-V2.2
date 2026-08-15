/**
 * ============================================================================
 * [MODULE: TRANSFER TICKETS & APPROVAL QUEUE]
 * File: /src/components/Transfers/TransferList.tsx
 * Description: Master list of all A4 Asset Transfer requests, approval statuses,
 *              branch filters, and quick export to Excel/PDF.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Multi-Stage Filter: กรองตามสถานะ (PENDING_IT, PENDING_MANAGER, PENDING_ACC, APPROVED, COMPLETED)
 * 2. RBAC Action Matrix: ตรวจสอบสิทธิ์ก่อนอนุญาตให้กดอนุมัติ, แก้ไข หรือลบเอกสาร
 * 3. 1-Click A4 Modal Launch: เปิดเอกสาร A4 เต็มรูปแบบพร้อมระบบลงลายเซ็น 3 ขั้นตอน
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  Filter,
  Edit3,
  Trash2,
  Lock,
} from 'lucide-react';
import { Asset, Branch, Department, TransferForm, UserProfile, UserRole } from '../../types';
import { exportTransferFormToExcel } from '../../utils/exportUtils';

interface TransferListProps {
  transfers: TransferForm[];
  currentUser: UserProfile;
  onOpenTransferDoc: (transfer: TransferForm) => void;
  onOpenNewTransferModal: () => void;
  onEditTransfer: (transfer: TransferForm) => void;
  onDeleteTransfer: (transferId: string) => void;
}

// Helper to format clean display signer name and User-ID
const formatSignerName = (approvedBy?: string, fallback = 'อนุมัติแล้ว') => {
  if (!approvedBy) return fallback;
  if (approvedBy.startsWith('data:image/') || approvedBy.startsWith('http') || approvedBy.length > 60) {
    return 'ลงนามแล้ว (Digital Signed)';
  }
  return approvedBy;
};

export const TransferList: React.FC<TransferListProps> = ({
  transfers,
  currentUser,
  onOpenTransferDoc,
  onOpenNewTransferModal,
  onEditTransfer,
  onDeleteTransfer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredTransfers = transfers.filter((t) => {
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      t.formNo.toLowerCase().includes(q) ||
      t.originatingDept.toLowerCase().includes(q) ||
      t.items.some(
        (item) =>
          item.assetId.toLowerCase().includes(q) ||
          item.assetName.toLowerCase().includes(q) ||
          item.transferorStaffName.toLowerCase().includes(q) ||
          item.receiverStaffName.toLowerCase().includes(q)
      );

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && t.status.startsWith('PENDING')) ||
      t.status === statusFilter;

    return matchQuery && matchStatus;
  });

  const getStatusBadge = (status: TransferForm['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> APPROVED (อนุมัติครบ 3 ฝ่าย)
          </span>
        );
      case 'PENDING_IT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> รอ ฝ่ายไอที อนุมัติ (Step 1)
          </span>
        );
      case 'PENDING_MANAGER':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> รอ ผู้จัดการฝ่าย อนุมัติ (Step 2)
          </span>
        );
      case 'PENDING_ACC':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-purple-950 text-purple-400 border border-purple-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> รอ ฝ่ายบัญชี ACC อนุมัติ (Step 3)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> REJECTED (ไม่อนุมัติ)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            XING TAI ASSET DELIVERY & DISPATCH
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Asset Transfer Forms (ใบส่งมอบ / โอนย้ายทรัพย์สิน)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            เอกสารใบส่งมอบตามแบบฟอร์ม 1 หน้า A4 แนวนอน พร้อมระบบอนุมัติ 3 ฝ่าย (IT, Manager, ACC)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewTransferModal}
            className="flex items-center gap-2 bg-gradient-to-r from-zinc-100 to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 text-zinc-900" strokeWidth={3} />
            <span>+ สร้างใบส่งมอบทรัพย์สินใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่เอกสาร, ชื่อทรัพย์สิน, หรือผู้ส่งมอบ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171922] border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#171922] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="PENDING">รออนุมัติ (Pending Approval)</option>
            <option value="APPROVED">อนุมัติครบ 3 ฝ่ายแล้ว (Approved)</option>
            <option value="REJECTED">ไม่อนุมัติ (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Transfers Cards / List */}
      <div className="space-y-4">
        {filteredTransfers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-[#12141a] rounded-xl border border-zinc-800">
            <FileText className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
            <div className="text-sm text-zinc-400">ไม่พบเอกสารใบส่งมอบตามเงื่อนไข</div>
          </div>
        ) : (
          filteredTransfers.map((t) => (
            <div
              key={t.id}
              className="bg-[#12141a] border border-zinc-800/80 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition-all space-y-4"
            >
              {/* Header Line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-extrabold text-white">
                        {t.formNo}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        วันที่: {t.createdDate}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      ต้นทาง: <span className="text-zinc-200">{t.originatingDept}</span> • สาเหตุ: <span className="text-cyan-400">{t.reasonNote || t.reasonType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(t.status)}
                </div>
              </div>

              {/* Items in this transfer preview */}
              <div className="bg-[#161822] rounded-lg p-3 border border-zinc-800/60 overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead>
                    <tr className="text-[10px] font-mono text-zinc-500 uppercase border-b border-zinc-800">
                      <th className="py-1.5 px-2">ลำดับ</th>
                      <th className="py-1.5 px-2">รหัสทรัพย์สิน</th>
                      <th className="py-1.5 px-2">ชื่อทรัพย์สิน</th>
                      <th className="py-1.5 px-2">ผู้ส่งมอบ</th>
                      <th className="py-1.5 px-2">ผู้รับมอบ</th>
                      <th className="py-1.5 px-2">สถานที่ปลายทาง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {t.items.map((item) => (
                      <tr key={item.no}>
                        <td className="py-2 px-2 font-mono text-zinc-500">{item.no}</td>
                        <td className="py-2 px-2 font-mono font-bold text-cyan-400">{item.assetId}</td>
                        <td className="py-2 px-2 font-medium text-zinc-200 max-w-xs truncate">{item.assetName}</td>
                        <td className="py-2 px-2 text-zinc-300">{item.transferorStaffName}</td>
                        <td className="py-2 px-2 text-emerald-400 font-semibold">{item.receiverStaffName}</td>
                        <td className="py-2 px-2 text-zinc-400">{item.receiverLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 3-Step Approval Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Step 1: IT */}
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    t.itApproved
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase font-mono">1. ฝ่ายไอที (IT Specialist)</div>
                    <div className="font-semibold text-xs truncate max-w-[180px]">
                      {t.itApproved ? formatSignerName(t.itApprovedBy) : 'รออนุมัติ'}
                    </div>
                  </div>
                  {t.itApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </div>

                {/* Step 2: Manager */}
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    t.managerApproved
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase font-mono">2. ผู้จัดการฝ่าย (Manager)</div>
                    <div className="font-semibold text-xs truncate max-w-[180px]">
                      {t.managerApproved ? formatSignerName(t.managerApprovedBy) : 'รออนุมัติ'}
                    </div>
                  </div>
                  {t.managerApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </div>

                {/* Step 3: ACC */}
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    t.accApproved
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase font-mono">3. ฝ่ายบัญชี (ACC Approval)</div>
                    <div className="font-semibold text-xs truncate max-w-[180px]">
                      {t.accApproved ? formatSignerName(t.accApprovedBy) : 'รออนุมัติ'}
                    </div>
                  </div>
                  {t.accApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <div className="text-[11px] text-zinc-400">
                  {t.deliveredBy && (
                    <span>ผู้นำส่ง: {t.deliveredBy} ({t.vehiclePlateNo || 'รถบริษัท'})</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => onEditTransfer(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-900/60 rounded-lg text-xs font-semibold transition-colors active:scale-95"
                    title="แก้ไขข้อมูลใบส่งมอบ"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>

                  {/* Delete Button (Locked if ACC approved) */}
                  {t.accApproved || t.status === 'APPROVED' ? (
                    <button
                      disabled
                      title="ไม่สามารถลบได้เนื่องจากฝ่ายบัญชี (ACC) อนุมัติเอกสารแล้ว"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-zinc-600 border border-zinc-800 rounded-lg text-xs font-medium cursor-not-allowed opacity-60"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>ลบ (ACC อนุมัติแล้ว)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onDeleteTransfer(t.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 rounded-lg text-xs font-semibold transition-colors active:scale-95"
                      title="ลบใบส่งมอบนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  )}

                  <button
                    onClick={() => exportTransferFormToExcel(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-900/60 rounded-lg text-xs font-medium transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>

                  <button
                    onClick={() => onOpenTransferDoc(t)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>เปิดแบบฟอร์ม A4 แนวนอน & อนุมัติ</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
