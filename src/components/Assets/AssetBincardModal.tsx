/**
 * ============================================================================
 * [MODULE: DIGITAL BIN CARD & ASSET LIFECYCLE AUDIT]
 * File: /src/components/Assets/AssetBincardModal.tsx
 * Description: Detailed digital Bin Card modal showing chain of custody timeline,
 *              maintenance & repair records, vendor costs, and Helpdesk ticket audit.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Chain of Custody Timeline: ประวัติการส่งมอบ-โอนย้าย พร้อมเลขที่ใบโอน A4
 * 2. Maintenance & Vendor Repair Logs: ประวัติส่งซ่อมนอก, อาการเสีย, ค่าใช้จ่าย และวันที่รับเครื่องคืน
 * 3. Associated IT Tickets: ตรวจสอบประวัติการแจ้งซ่อมที่เกี่ยวข้องกับเครื่องนี้
 * 4. QR Code & Excel Export: ส่งออกรายงาน Bin Card ออกเป็นไฟล์ Excel (.xlsx)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  History,
  Wrench,
  Clock,
  ArrowRightLeft,
  Calendar,
  Building,
  User,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Shield,
  Tag,
} from 'lucide-react';
import { Asset, AssetRepairLog, ITTicket } from '../../types';
import { generateQRCodeDataUrl } from '../../utils/exportUtils';
import * as XLSX from 'xlsx';

interface AssetBincardModalProps {
  asset: Asset | null;
  onClose: () => void;
  onAddRepairLog: (assetId: string, log: Omit<AssetRepairLog, 'id'>) => void;
  tickets: ITTicket[];
}

export const AssetBincardModal: React.FC<AssetBincardModalProps> = ({
  asset,
  onClose,
  onAddRepairLog,
  tickets,
}) => {
  const [activeTab, setActiveTab] = useState<'custody' | 'repairs' | 'tickets'>('custody');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showAddRepairForm, setShowAddRepairForm] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'3MONTHS' | 'ALL'>('3MONTHS');

  // Form state for adding repair
  const [vendorName, setVendorName] = useState('');
  const [sentDate, setSentDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueDescription, setIssueDescription] = useState('');
  const [repairCost, setRepairCost] = useState<number>(0);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [technicianInCharge, setTechnicianInCharge] = useState('J. Chen');
  const [replacedParts, setReplacedParts] = useState('');
  const [repairStatus, setRepairStatus] = useState<'SENT_TO_REPAIR' | 'IN_PROGRESS' | 'RETURNED'>('RETURNED');

  useEffect(() => {
    if (asset) {
      // Generate QR Code containing Asset ID & details URL
      const qrPayload = JSON.stringify({
        assetId: asset.assetId,
        itemCode: asset.itemCode,
        serial: asset.serialNo,
        name: asset.assetName,
        company: 'Xing Tai Trading Co., Ltd.',
      });
      generateQRCodeDataUrl(qrPayload).then(setQrDataUrl);
    }
  }, [asset]);

  if (!asset) return null;

  // Filter 3 months tickets
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const relatedTickets = tickets.filter((t) => {
    if (t.assetId !== asset.assetId && !t.assetName?.includes(asset.itemCode)) return false;
    if (timeFilter === '3MONTHS') {
      const ticketDate = new Date(t.createdAt);
      return ticketDate >= threeMonthsAgo;
    }
    return true;
  });

  const handleSaveRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !issueDescription) return;

    onAddRepairLog(asset.id, {
      sentDate,
      vendorName,
      issueDescription,
      repairCost: Number(repairCost) || 0,
      expectedReturnDate: expectedReturnDate || undefined,
      actualReturnDate: actualReturnDate || undefined,
      status: repairStatus,
      technicianInCharge,
      replacedParts: replacedParts || undefined,
    });

    setShowAddRepairForm(false);
    // Reset form
    setVendorName('');
    setIssueDescription('');
    setRepairCost(0);
  };

  const handleExportBincardExcel = () => {
    const assetMeta = [
      ['บริษัท ซิงไท่ เทรดดิ้ง จำกัด / XING TAI TRADING (THAILAND) CO., LTD.'],
      ['บัตรควบคุมและประวัติทรัพย์สิน (ASSET BINCARD & LIFECYCLE LEDGER)'],
      ['รหัสทรัพย์สิน (Asset ID):', asset.assetId, 'Item Code:', asset.itemCode],
      ['ชื่อทรัพย์สิน:', asset.assetName],
      ['Serial Number:', asset.serialNo, 'หมวดหมู่:', asset.category],
      ['สถานที่ตั้ง:', asset.location, 'ผู้ครอบครองปัจจุบัน:', asset.ownerStaffName || 'ส่วนกลาง'],
      ['วันที่จัดซื้อ:', asset.acquisitionDate, 'ราคาต้นทุน (THB):', asset.cost],
      [],
      ['--- ประวัติการโอนย้ายและการครอบครอง (CUSTODY & TRANSFERS) ---'],
      ['วันที่', 'เลขที่ใบโอน', 'จากผู้ครอบครองเดิม', 'โอนให้ผู้รับมอบ', 'สถานที่', 'เหตุผล', 'ผู้อนุมัติ'],
    ];

    const custodyRows = (asset.custodyHistory || []).map((c) => [
      c.date,
      c.transferFormNo || '-',
      c.fromStaffName || 'คลังกลาง',
      c.toStaffName,
      c.location,
      c.reason,
      c.approvedBy || '-',
    ]);

    const repairHeader = [
      [],
      ['--- ประวัติการส่งซ่อมและบำรุงรักษา (MAINTENANCE & REPAIR LOGS) ---'],
      ['วันที่ส่งซ่อม', 'ศูนย์บริการ/ร้าน', 'อาการเสีย/งานซ่อม', 'อะไหล่ที่เปลี่ยน', 'ค่าซ่อม (THB)', 'วันรับคืน', 'ช่างผู้รับผิดชอบ', 'สถานะ'],
    ];

    const repairRows = (asset.repairLogs || []).map((r) => [
      r.sentDate,
      r.vendorName,
      r.issueDescription,
      r.replacedParts || '-',
      r.repairCost,
      r.actualReturnDate || r.expectedReturnDate || '-',
      r.technicianInCharge,
      r.status,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...assetMeta, ...custodyRows, ...repairHeader, ...repairRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Bincard_${asset.assetId}`);
    XLSX.writeFile(wb, `Bincard_${asset.assetId}_${asset.itemCode}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#101217] border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 bg-[#141720] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  ASSET BINCARD
                </span>
                <span className="text-xs font-mono text-zinc-400">ID: {asset.assetId}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">{asset.itemCode} - {asset.assetName.substring(0, 50)}...</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBincardExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-900/60 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Bincard</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Asset Summary Card + QR Code */}
        <div className="p-6 bg-[#161822] border-b border-zinc-800/80 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* QR Code section */}
          <div className="md:col-span-3 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner border border-zinc-300">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Asset QR Code" className="w-32 h-32 object-contain" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-zinc-400">
                <QrCode className="w-8 h-8 animate-spin" />
              </div>
            )}
            <div className="text-[10px] font-mono text-zinc-900 font-bold text-center mt-1">
              {asset.assetId}
            </div>
            <div className="text-[9px] font-mono text-zinc-600 text-center">
              XING TAI TRADING
            </div>
          </div>

          {/* Asset Specs & Metadata */}
          <div className="md:col-span-9 space-y-3">
            <div>
              <div className="text-xs text-zinc-400">ชื่อทรัพย์สินและคุณสมบัติ (Full Specification):</div>
              <div className="text-sm font-semibold text-white leading-relaxed mt-0.5">
                {asset.assetName}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-700/50">
              <div>
                <span className="text-zinc-400 block text-[11px]">รหัสสินค้า / Serial No:</span>
                <span className="font-mono text-zinc-200 font-medium">{asset.serialNo || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">ผู้ครอบครองปัจจุบัน:</span>
                <span className="text-cyan-300 font-medium">{asset.ownerStaffName || 'ส่วนกลาง / ไม่ได้ระบุ'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">สถานที่ตั้ง / สาขา:</span>
                <span className="text-zinc-200">{asset.location}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">วันที่จัดซื้อ / ราคาทุน:</span>
                <span className="text-zinc-200">{asset.acquisitionDate} (฿{asset.cost?.toLocaleString()} THB)</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">สถานะประกัน:</span>
                <span className="text-emerald-400">หมดประกัน {asset.warrantyExpireDate || '2027'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">สถานะการทำงาน:</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{asset.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-zinc-800 bg-[#12141c] px-6">
          <button
            onClick={() => setActiveTab('custody')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'custody'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>ประวัติการโอนย้าย & ผู้ครอบครอง ({asset.custodyHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('repairs')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'repairs'
                ? 'border-amber-400 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>ประวัติส่งซ่อม & ค่าใช้จ่าย ({asset.repairLogs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'tickets'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>IT Tickets ย้อนหลัง 3 เดือน ({relatedTickets.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: CUSTODY & TRANSFER HISTORY */}
          {activeTab === 'custody' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>ลำดับเหตุการณ์การครอบครองและการส่งต่อทรัพย์สิน</span>
                <span className="text-[11px] font-mono">Total Movements: {asset.custodyHistory?.length || 0}</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {(asset.custodyHistory || []).map((item, idx) => (
                  <div key={item.id || idx} className="relative bg-[#161922] p-4 rounded-xl border border-zinc-800">
                    <span className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-[#101217]" />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{item.date}</span>
                        {item.transferFormNo && (
                          <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                            {item.transferFormNo}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        ผู้อนุมัติ: <strong className="text-zinc-200">{item.approvedBy || '-'}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-400 text-[11px] block">ส่งมอบจาก:</span>
                        <div className="text-zinc-300 font-medium">
                          {item.fromStaffName || 'คลังกลาง / พัสดุจัดซื้อใหม่'}
                        </div>
                      </div>

                      <div>
                        <span className="text-cyan-400 text-[11px] block">ผู้รับมอบ / ครอบครองใหม่:</span>
                        <div className="text-white font-bold">
                          {item.toStaffName} ({item.toStaffId})
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/60 text-xs text-zinc-300">
                      <strong className="text-zinc-400">เหตุผล & สถานที่:</strong> {item.reason} • 📍 {item.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: REPAIRS & MAINTENANCE LOGS */}
          {activeTab === 'repairs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  บันทึกการส่งซ่อม ค่าใช้จ่าย ศูนย์บริการ และการรับคืนทรัพย์สิน
                </span>
                <button
                  onClick={() => setShowAddRepairForm(!showAddRepairForm)}
                  className="flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900 text-amber-400 border border-amber-800/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ บันทึกรายการส่งซ่อมใหม่</span>
                </button>
              </div>

              {/* Add Repair Form */}
              {showAddRepairForm && (
                <form onSubmit={handleSaveRepair} className="bg-[#181a24] p-4 rounded-xl border border-amber-900/60 space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> บันทึกประวัติการส่งซ่อม / ค่าใช้จ่าย
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-zinc-400 block mb-1">วันที่ส่งซ่อม *</label>
                      <input
                        type="date"
                        required
                        value={sentDate}
                        onChange={(e) => setSentDate(e.target.value)}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1">ศูนย์บริการ / ร้านซ่อม *</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น Chanintr, Urovo Center, Synnex"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1">ค่าใช้จ่ายในการซ่อม (บาท) *</label>
                      <input
                        type="number"
                        min="0"
                        value={repairCost}
                        onChange={(e) => setRepairCost(Number(e.target.value))}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="text-zinc-400 block mb-1">อาการเสีย & รายละเอียดการซ่อม *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="ระบุอาการชำรุด หรือชิ้นส่วนที่เสีย..."
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-zinc-400 block mb-1">อะไหล่ที่เปลี่ยน (ถ้ามี)</label>
                      <input
                        type="text"
                        placeholder="เช่น กระบอกไฮดรอลิก, Scan Engine"
                        value={replacedParts}
                        onChange={(e) => setReplacedParts(e.target.value)}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1">วันที่รับคืนจากศูนย์</label>
                      <input
                        type="date"
                        value={actualReturnDate}
                        onChange={(e) => setActualReturnDate(e.target.value)}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1">สถานะ</label>
                      <select
                        value={repairStatus}
                        onChange={(e) => setRepairStatus(e.target.value as any)}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                      >
                        <option value="RETURNED">RETURNED (รับคืนเรียบร้อย)</option>
                        <option value="IN_PROGRESS">IN_PROGRESS (อยู่ระหว่างซ่อม)</option>
                        <option value="SENT_TO_REPAIR">SENT_TO_REPAIR (ส่งไปศูนย์)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRepairForm(false)}
                      className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded text-xs"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded text-xs"
                    >
                      บันทึกรายการซ่อม
                    </button>
                  </div>
                </form>
              )}

              {/* Repair list */}
              {asset.repairLogs?.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-[#14161f] rounded-xl border border-zinc-800">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <div>ทรัพย์สินนี้ยังไม่มีประวัติการส่งซ่อม / สภาพสมบูรณ์ดี</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {asset.repairLogs.map((log) => (
                    <div key={log.id} className="bg-[#161922] p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {log.sentDate} {log.actualReturnDate ? `→ รับคืน ${log.actualReturnDate}` : '(ยังไม่ได้รับคืน)'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                            {log.status}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          ค่าซ่อม: ฿{log.repairCost?.toLocaleString()} THB
                        </div>
                      </div>

                      <div className="text-xs text-zinc-200">
                        <strong className="text-zinc-400">ศูนย์บริการ/ร้าน:</strong> {log.vendorName}
                      </div>

                      <div className="text-xs text-zinc-300">
                        <strong className="text-zinc-400">อาการ & การแก้ไข:</strong> {log.issueDescription}
                      </div>

                      {log.replacedParts && (
                        <div className="text-[11px] text-zinc-400">
                          <strong className="text-zinc-300">อะไหล่ที่เปลี่ยน:</strong> {log.replacedParts}
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-500 text-right">
                        ช่างผู้ประสานงาน: {log.technicianInCharge}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TICKETS HISTORY (3 MONTHS) */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  รายการแจ้งซ่อม IT Ticket ที่ผูกกับทรัพย์สินนี้
                </span>
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px]">
                  <button
                    onClick={() => setTimeFilter('3MONTHS')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      timeFilter === '3MONTHS' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    ย้อนหลัง 3 เดือน
                  </button>
                  <button
                    onClick={() => setTimeFilter('ALL')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      timeFilter === 'ALL' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                </div>
              </div>

              {relatedTickets.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-[#14161f] rounded-xl border border-zinc-800">
                  ไม่พบรายการแจ้งซ่อม Ticket ในช่วงเวลาที่เลือก
                </div>
              ) : (
                <div className="space-y-3">
                  {relatedTickets.map((t) => (
                    <div key={t.id} className="bg-[#161922] p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400">{t.id}</span>
                          <span className="text-xs font-semibold text-white">{t.subject}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {t.status}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">{t.details}</p>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800">
                        <span>ผู้แจ้ง: {t.requesterStaffName} ({t.createdAt})</span>
                        <span>ช่าง: {t.assignedTechnicianName || 'ยังไม่กำหนด'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
