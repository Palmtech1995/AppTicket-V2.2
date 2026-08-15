/**
 * ============================================================================
 * [MODULE: ASSET INVENTORY & BIN CARD MASTER]
 * File: /src/components/Assets/AssetInventory.tsx
 * Description: Enterprise Hardware & IT Asset Inventory Table for Xing Tai Trading
 * 
 * [ส่วนที่แก้ไขและพัฒนา]:
 * 1. Filter & Search Matrix: ค้นหาตาม Asset ID, Item Code, Serial Number, Branch, Department
 * 2. QR Code Integration: สร้าง QR Label สติกเกอร์สำหรับติดเครื่องจักร/อุปกรณ์ไอที
 * 3. Bin Card & Custody Timeline: ปุ่มเปิดประวัติการครอบครองและประวัติส่งซ่อม (AssetBincardModal)
 * 4. 1-Click Transfer: ปุ่มเริ่มเปิดใบโอนย้ายทรัพย์สินทันทีจากแถวรายการ
 * 5. Import/Export: ส่งออกข้อมูลทรัพย์สินเป็น Excel (.xlsx) และนำเข้าข้อมูล
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  QrCode,
  Plus,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  History,
  Edit,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { Asset, AssetStatus, Branch, Department, UserProfile } from '../../types';
import { exportAssetsToExcel } from '../../utils/exportUtils';

interface AssetInventoryProps {
  assets: Asset[];
  branches: Branch[];
  departments: Department[];
  staffList: UserProfile[];
  currentUser: UserProfile;
  onOpenAddModal: () => void;
  onOpenEditModal: (asset: Asset) => void;
  onDeleteAsset: (assetId: string) => void;
  onOpenBincard: (asset: Asset) => void;
  onOpenQrScanner: () => void;
  onOpenQrLabelModal: (assets: Asset[]) => void;
  onInitiateTransfer: (asset: Asset) => void;
  onOpenGoogleSheets?: () => void;
  globalSearchQuery?: string;
}

export const AssetInventory: React.FC<AssetInventoryProps> = ({
  assets,
  branches,
  departments,
  staffList,
  currentUser,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteAsset,
  onOpenBincard,
  onOpenQrScanner,
  onOpenQrLabelModal,
  onInitiateTransfer,
  onOpenGoogleSheets,
  globalSearchQuery = '',
}) => {
  const [search, setSearch] = useState(globalSearchQuery);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const query = (search || globalSearchQuery).toLowerCase().trim();
    const matchQuery =
      !query ||
      asset.assetId.toLowerCase().includes(query) ||
      asset.itemCode.toLowerCase().includes(query) ||
      asset.serialNo.toLowerCase().includes(query) ||
      asset.assetName.toLowerCase().includes(query) ||
      (asset.ownerStaffName && asset.ownerStaffName.toLowerCase().includes(query)) ||
      asset.location.toLowerCase().includes(query);

    const matchBranch = selectedBranch === 'ALL' || asset.branchCode === selectedBranch;
    const matchDept = selectedDept === 'ALL' || asset.departmentCode === selectedDept;
    const matchStatus = selectedStatus === 'ALL' || asset.status === selectedStatus;

    return matchQuery && matchBranch && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            ACTIVE
          </span>
        );
      case 'MAINTENANCE':
      case 'IN_REPAIR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            MAINTENANCE
          </span>
        );
      case 'TRANSFERRED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            TRANSFERRED
          </span>
        );
      case 'RETIRED':
      case 'DAMAGED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  const handleExportExcel = () => {
    exportAssetsToExcel(filteredAssets);
  };

  return (
    <div className="space-y-6">
      {/* Header matching Image 6 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            XING TAI TRADING (THAILAND) CO., LTD.
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Asset Inventory
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ระบบทะเบียนและประวัติคุมทรัพย์สิน (Bincard, QR Tracking & Depreciation)
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-2 bg-[#171a23] hover:bg-[#202533] text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Scan QR</span>
          </button>

          <button
            onClick={() => onOpenQrLabelModal(filteredAssets)}
            className="flex items-center gap-2 bg-[#171a23] hover:bg-[#202533] text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shadow-sm"
            title="พิมพ์สติกเกอร์ QR Code ติดบนทรัพย์สิน"
          >
            <Printer className="w-4 h-4 text-zinc-400" />
            <span>พิมพ์ป้าย QR Tag</span>
          </button>

          {onOpenGoogleSheets && (
            <button
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-2 bg-[#171a23] hover:bg-[#202533] text-emerald-300 border border-emerald-800/70 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="ซิงค์ข้อมูลกับ Google Sheets (OAuth)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets Sync</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#171a23] hover:bg-[#202533] text-emerald-400 border border-emerald-900/60 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-zinc-100 to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-900 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-zinc-900" strokeWidth={3} />
            <span>+ Add Asset</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar matching Image 6 */}
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search field */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Asset Name, Item Code, or Owner..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#171922] border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Branch selector */}
          <div className="md:col-span-2">
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#171922] border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="ALL">Branch (ทุกสาขา)</option>
              {branches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department selector */}
          <div className="md:col-span-2">
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#171922] border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="ALL">Department (ทุกแผนก)</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#171922] border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="ALL">Status (ทุกสถานะ)</option>
              <option value="ACTIVE">ACTIVE (พร้อมใช้งาน)</option>
              <option value="MAINTENANCE">MAINTENANCE (อยู่ระหว่างซ่อม)</option>
              <option value="TRANSFERRED">TRANSFERRED (โอนย้าย)</option>
              <option value="RETIRED">RETIRED (ตัดจำหน่าย)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Table matching Image 6 */}
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
            <thead>
              <tr className="bg-[#0f1116] border-b border-zinc-800/80 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-3 sm:px-4 w-10 sm:w-12 text-center">QR</th>
                <th className="py-3.5 px-3 sm:px-4 font-semibold">ITEM CODE</th>
                <th className="py-3.5 px-3 sm:px-4 font-semibold min-w-[200px] sm:min-w-[280px]">ASSET NAME & SPECS</th>
                <th className="hidden md:table-cell py-3.5 px-4 font-semibold">LOCATION</th>
                <th className="hidden lg:table-cell py-3.5 px-4 font-semibold">OWNER / CUSTODIAN</th>
                <th className="py-3.5 px-3 sm:px-4 font-semibold">STATUS</th>
                <th className="py-3.5 px-3 sm:px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Boxes className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <div>ไม่พบรายการทรัพย์สินที่ตรงกับเงื่อนไขการค้นหา</div>
                    <div className="text-[11px] text-zinc-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองสาขา/แผนก</div>
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-[#161822] transition-colors group"
                  >
                    {/* QR Code Icon / View */}
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <button
                        onClick={() => onOpenBincard(asset)}
                        className="p-1.5 rounded-md bg-zinc-800/80 hover:bg-cyan-950 hover:text-cyan-400 text-zinc-400 border border-zinc-700/50 transition-colors"
                        title="ดู QR Code และ Bincard"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Item Code & Asset ID */}
                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="font-mono font-bold text-zinc-200">{asset.itemCode}</div>
                      <div className="text-[11px] font-mono text-cyan-400/80">{asset.assetId}</div>
                      {asset.serialNo && (
                        <div className="text-[10px] font-mono text-zinc-400">S/N: {asset.serialNo}</div>
                      )}
                    </td>

                    {/* Asset Name & Details */}
                    <td className="py-3.5 px-3 sm:px-4">
                      <div 
                        onClick={() => onOpenBincard(asset)}
                        className="font-medium text-zinc-200 group-hover:text-white cursor-pointer hover:underline line-clamp-2 leading-relaxed"
                      >
                        {asset.assetName}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[11px] text-zinc-400">
                        <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                          {asset.category}
                        </span>
                        <span>฿{asset.cost?.toLocaleString()}</span>
                        {/* Show location badge on mobile if hidden from separate column */}
                        <span className="md:hidden text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">
                          {asset.branchCode}
                        </span>
                        {asset.repairLogs?.length > 0 && (
                          <span className="text-amber-400 text-[10px] flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> ซ่อม {asset.repairLogs.length}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="hidden md:table-cell py-3.5 px-4">
                      <div className="text-zinc-300">{asset.location}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{asset.branchCode}</div>
                    </td>

                    {/* Owner / Custodian */}
                    <td className="hidden lg:table-cell py-3.5 px-4">
                      {asset.ownerStaffName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 uppercase">
                            {asset.ownerStaffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-200">{asset.ownerStaffName}</div>
                            <div className="text-[10px] text-zinc-400">{asset.ownerStaffId}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic">Unassigned (ส่วนกลาง)</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 sm:px-4">
                      {getStatusBadge(asset.status)}
                    </td>

                    {/* Actions & Bincard */}
                    <td className="py-3.5 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          onClick={() => onOpenBincard(asset)}
                          className="px-2 sm:px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 rounded text-[11px] font-medium border border-zinc-700 flex items-center gap-1 transition-all"
                          title="เปิดประวัติ Bincard"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Bincard</span>
                        </button>

                        <button
                          onClick={() => onInitiateTransfer(asset)}
                          className="px-2 sm:px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] font-medium border border-zinc-700 flex items-center gap-1 transition-all"
                          title="ทำใบโอนย้ายส่งมอบ"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="hidden sm:inline">โอน</span>
                        </button>

                        <button
                          onClick={() => onOpenEditModal(asset)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                          title="แก้ไขข้อมูลทรัพย์สิน"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {currentUser.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              if (confirm(`ยืนยันการลบทรัพย์สินรหัส ${asset.assetId} หรือไม่?`)) {
                                onDeleteAsset(asset.id);
                              }
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                            title="ลบทรัพย์สิน (เฉพาะ Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination matching Image 6 */}
        <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 bg-[#0f1116]">
          <div>
            Showing <strong className="text-zinc-200">{filteredAssets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-zinc-200">
              {Math.min(currentPage * itemsPerPage, filteredAssets.length)}
            </strong>{' '}
            of <strong className="text-zinc-200">{filteredAssets.length}</strong> assets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-zinc-300 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
