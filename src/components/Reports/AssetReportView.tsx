/**
 * ============================================================================
 * [MODULE: ASSET INVENTORY & VALUATION REPORT]
 * File: /src/components/Reports/AssetReportView.tsx
 * Description: Detailed Asset analytics module with date ranges, branch filters,
 *              depreciation metrics, category breakdowns, and export utilities.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Date Range Presets: กรองตามช่วงเวลาจัดซื้อ หรือวันหมดประกัน (3 เดือน, 6 เดือน, รายปี)
 * 2. Multi-Dimensional Drilldown: กรองเจาะลึกตามสาขา, แผนก, หมวดหมู่ และสถานะ
 * 3. Financial Valuation: สรุปมูลค่าทรัพย์สินตามจริง (Cost Total)
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Archive,
  Layers,
  Building,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { Asset, Branch, Department } from '../../types';
import { exportAssetsToExcel } from '../../utils/exportUtils';
import { ReportA4PrintModal } from './ReportA4PrintModal';

interface AssetReportViewProps {
  assets: Asset[];
  branches: Branch[];
  departments: Department[];
}

export const AssetReportView: React.FC<AssetReportViewProps> = ({
  assets,
  branches,
  departments,
}) => {
  // Date filter states
  const [datePreset, setDatePreset] = useState<'ALL' | 'THIS_MONTH' | '3_MONTHS' | '6_MONTHS' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateField, setDateField] = useState<'acquisitionDate' | 'warrantyExpireDate'>('acquisitionDate');

  // Dimension filters
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dedicated A4 Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Handle Preset change
  const handlePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (preset === '3_MONTHS') {
      const past = new Date();
      past.setMonth(past.getMonth() - 3);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === '6_MONTHS') {
      const past = new Date();
      past.setMonth(past.getMonth() - 6);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'THIS_YEAR') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  };

  // Filtered Assets based on dates and criteria
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Date filter
      if (startDate || endDate) {
        const targetDateStr = dateField === 'acquisitionDate' ? asset.acquisitionDate : asset.warrantyExpireDate;
        if (targetDateStr) {
          const itemDate = new Date(targetDateStr);
          if (startDate && itemDate < new Date(startDate)) return false;
          if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
        } else if (startDate || endDate) {
          return false;
        }
      }

      // Branch filter
      if (selectedBranch !== 'ALL' && asset.branchCode !== selectedBranch) return false;

      // Dept filter
      if (selectedDept !== 'ALL' && asset.departmentCode !== selectedDept) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && asset.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && asset.status !== selectedStatus) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          asset.assetId.toLowerCase().includes(q) ||
          asset.itemCode.toLowerCase().includes(q) ||
          asset.serialNo.toLowerCase().includes(q) ||
          asset.assetName.toLowerCase().includes(q) ||
          (asset.ownerStaffName && asset.ownerStaffName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [assets, dateField, startDate, endDate, selectedBranch, selectedDept, selectedCategory, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const totalValue = filteredAssets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const activeCount = filteredAssets.filter((a) => a.status === 'ACTIVE').length;
  const inRepairCount = filteredAssets.filter((a) => a.status === 'MAINTENANCE' || a.status === 'IN_REPAIR').length;
  const totalRepairLogs = filteredAssets.reduce((sum, a) => sum + (a.repairLogs?.length || 0), 0);
  const totalRepairCost = filteredAssets.reduce(
    (sum, a) => sum + (a.repairLogs?.reduce((rSum, r) => rSum + (r.repairCost || 0), 0) || 0),
    0
  );

  // Category distribution
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredAssets.forEach((a) => {
      if (!counts[a.category]) {
        counts[a.category] = { count: 0, value: 0 };
      }
      counts[a.category].count += 1;
      counts[a.category].value += a.cost || 0;
    });
    return counts;
  }, [filteredAssets]);

  // Branch distribution
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAssets.forEach((a) => {
      counts[a.branchCode] = (counts[a.branchCode] || 0) + 1;
    });
    return counts;
  }, [filteredAssets]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(assets.map((a) => a.category))).filter(Boolean);
  }, [assets]);

  const handleExportExcel = () => {
    const filename = `XingTai_Asset_Report_${datePreset}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportAssetsToExcel(filteredAssets, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar with Date Selection */}
      <div className="bg-[#12141c] border border-zinc-800/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">รายงานสรุปข้อมูลทรัพย์สิน (Asset Inventory Report)</h2>
              <p className="text-xs text-zinc-400">
                เลือกช่วงวันที่และตัวกรองที่ต้องการเพื่อดูยอดสรุปและส่งออกข้อมูล
              </p>
            </div>
          </div>

          {/* Export & Print Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Asset Excel ({filteredAssets.length})</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950/50 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-200" />
              <span>พิมพ์รายงาน A4 (Print Report)</span>
            </button>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-zinc-300">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>ช่วงเวลาที่ต้องการดูข้อมูล:</span>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0c12] p-1 rounded-xl border border-zinc-800">
              {[
                { id: 'ALL', label: 'ทั้งหมด (All Time)' },
                { id: 'THIS_MONTH', label: 'เดือนนี้' },
                { id: '3_MONTHS', label: '3 เดือนย้อนหลัง' },
                { id: '6_MONTHS', label: '6 เดือนย้อนหลัง' },
                { id: 'THIS_YEAR', label: 'ปี 2026' },
                { id: 'CUSTOM', label: 'กำหนดเอง...' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    datePreset === p.id
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#0a0c12] p-3.5 rounded-xl border border-zinc-800/80">
            <div>
              <label className="text-zinc-400 block mb-1">กรองตามประเภทวันที่</label>
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value as any)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="acquisitionDate">วันที่จัดซื้อ (Acquisition Date)</option>
                <option value="warrantyExpireDate">วันหมดประกัน (Warranty Expire)</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">วันที่เริ่มต้น (Start Date)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">วันที่สิ้นสุด (End Date)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handlePresetChange('ALL')}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
              >
                ล้างตัวกรองวันที่ (Clear Date)
              </button>
            </div>
          </div>

          {/* Secondary Attribute Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs pt-1">
            <div>
              <label className="text-zinc-400 block mb-1">สาขา (Branch)</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="ALL">ทุกสาขา (All Branches)</option>
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">แผนก (Department)</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="ALL">ทุกแผนก (All Departments)</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">หมวดหมู่ทรัพย์สิน</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="ALL">ทุกหมวดหมู่ (All Categories)</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">สถานะทรัพย์สิน</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="ALL">ทุกสถานะ (All Status)</option>
                <option value="ACTIVE">ACTIVE (ใช้งานปกติ)</option>
                <option value="MAINTENANCE">MAINTENANCE (ส่งซ่อม)</option>
                <option value="TRANSFERRED">TRANSFERRED (โอนย้าย)</option>
                <option value="DAMAGED">DAMAGED (ชำรุด)</option>
                <option value="RETIRED">RETIRED (ตัดจำหน่าย)</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">ค้นหารวดเร็ว</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ค้นหา Asset ID, S/N..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141620] border border-zinc-700 rounded-lg pl-8 pr-2 py-2 text-zinc-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-mono text-zinc-400 uppercase">Filtered Asset Count</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {filteredAssets.length} <span className="text-sm font-normal text-zinc-400">รายการ</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> พร้อมใช้งาน {activeCount} รายการ ({Math.round((activeCount / (filteredAssets.length || 1)) * 100)}%)
          </div>
        </div>

        <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-mono text-zinc-400 uppercase">Total Asset Cost</div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">
            ฿{totalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            มูลค่าตามราคาทุนที่ผ่านตัวกรอง
          </div>
        </div>

        <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-mono text-zinc-400 uppercase">Assets In Repair / Maintenance</div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
            {inRepairCount} <span className="text-sm font-normal text-zinc-400">เครื่อง</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            ประวัติการส่งซ่อมสะสม {totalRepairLogs} ครั้ง
          </div>
        </div>

        <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-mono text-zinc-400 uppercase">Total Repair Expenses</div>
          <div className="text-3xl font-extrabold text-purple-400 font-mono mt-1">
            ฿{totalRepairCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            ค่าใช้จ่ายซ่อมแซมและอะไหล่สะสม
          </div>
        </div>
      </div>

      {/* Distribution Charts & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-7 bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">การกระจายตัวตามหมวดหมู่ (Category Distribution)</h3>
              <p className="text-xs text-zinc-400">สัดส่วนจำนวนและมูลค่าทรัพย์สินตามประเภท</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">{Object.keys(categoryCounts).length} หมวดหมู่</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, info]: [string, { count: number; value: number }]) => {
              const pct = Math.round((info.count / (filteredAssets.length || 1)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium truncate max-w-[280px]">{cat}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-cyan-400 font-semibold">฿{info.value.toLocaleString()}</span>
                      <span className="font-mono text-zinc-400 w-16 text-right">
                        {info.count} ชิ้น ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch Breakdown */}
        <div className="lg:col-span-5 bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">กระจายตามสาขา (Branch Allocation)</h3>
            <p className="text-xs text-zinc-400">จำนวนทรัพย์สินที่ติดตั้งใช้งานในแต่ละสาขา</p>
          </div>

          <div className="space-y-2.5">
            {branches.map((b) => {
              const count = branchCounts[b.code] || 0;
              const pct = Math.round((count / (filteredAssets.length || 1)) * 100);
              return (
                <div key={b.code} className="p-3 rounded-xl bg-[#161824] border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{b.name}</div>
                    <div className="text-[11px] font-mono text-zinc-400">{b.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-cyan-400 text-sm">{count} รายการ</div>
                    <div className="text-[10px] text-zinc-500">{pct}% ของข้อมูลที่เลือก</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtered Data Table */}
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <span className="font-bold text-white">ตารางรายการทรัพย์สินที่เลือก</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
              {filteredAssets.length} รายการ
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export เป็นไฟล์ Excel (.xlsx)</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0c0e14] text-zinc-400 uppercase font-mono text-[11px] sticky top-0 z-10 border-b border-zinc-800">
              <tr>
                <th className="p-3">ลำดับ</th>
                <th className="p-3">Asset ID / Item Code</th>
                <th className="p-3">Serial No</th>
                <th className="p-3">ชื่อทรัพย์สิน / รายละเอียด</th>
                <th className="p-3">สาขา / แผนก</th>
                <th className="p-3">ผู้ถือครอง</th>
                <th className="p-3 text-right">ราคาต้นทุน</th>
                <th className="p-3 text-center">วันที่จัดซื้อ</th>
                <th className="p-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredAssets.map((asset, idx) => (
                <tr key={asset.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3 font-mono text-zinc-500">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-cyan-400">
                    <div>{asset.assetId}</div>
                    <div className="text-[10px] text-zinc-500 font-normal">{asset.itemCode}</div>
                  </td>
                  <td className="p-3 font-mono text-zinc-400">{asset.serialNo}</td>
                  <td className="p-3 max-w-[260px] truncate" title={asset.assetName}>
                    <div className="font-medium text-white truncate">{asset.assetName}</div>
                    <div className="text-[10px] text-zinc-500">{asset.category}</div>
                  </td>
                  <td className="p-3 text-[11px]">
                    <div className="text-zinc-200">{asset.branchCode}</div>
                    <div className="text-zinc-500">{asset.departmentCode}</div>
                  </td>
                  <td className="p-3 text-[11px] text-zinc-300">
                    {asset.ownerStaffName || <span className="text-zinc-500">-</span>}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                    ฿{asset.cost?.toLocaleString()}
                  </td>
                  <td className="p-3 text-center font-mono text-zinc-400">{asset.acquisitionDate}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        asset.status === 'ACTIVE'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : asset.status === 'MAINTENANCE' || asset.status === 'IN_REPAIR'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500">
                    ไม่พบข้อมูลทรัพย์สินตามเงื่อนไขช่วงเวลาหรือตัวกรองที่ระบุ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated A4 Report Modal & Print Engine */}
      <ReportA4PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialReportType="ASSET_INVENTORY"
        assets={filteredAssets}
        branches={branches}
        departments={departments}
        filterStartDate={startDate}
        filterEndDate={endDate}
        filterBranch={selectedBranch}
        filterDepartment={selectedDept}
      />
    </div>
  );
};
