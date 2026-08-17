/**
 * ============================================================================
 * [MODULE: OFFICIAL A4 REPORT GENERATOR & PRINT ENGINE]
 * File: /src/components/Reports/ReportA4PrintModal.tsx
 * Description: Dedicated standard A4 print and export modal for Xing Tai Reports.
 *              Prints ONLY the A4 document without requiring Ctrl+P or printing
 *              the surrounding web application UI.
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  Wrench,
  Boxes,
  ZoomIn,
  ZoomOut,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Asset, Branch, Department, ITTicket, TechnicianMetric, WeeklyProblemSummary } from '../../types';
import { XingTaiLogo } from '../Common/XingTaiLogo';
import { printElementDirectly, exportA4ElementToPdf } from '../../utils/printUtils';
import { exportKPIReportToExcel, exportTicketsToExcel, exportAssetsToExcel } from '../../utils/exportUtils';

export type ReportType = 'IT_KPI' | 'WEEKLY_PROBLEMS' | 'TICKETS_HISTORY' | 'ASSET_INVENTORY';

interface ReportA4PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: ReportType;
  tickets?: ITTicket[];
  technicians?: TechnicianMetric[];
  weeklyProblems?: WeeklyProblemSummary[];
  assets?: Asset[];
  branches?: Branch[];
  departments?: Department[];
  filterStartDate?: string;
  filterEndDate?: string;
  filterBranch?: string;
  filterDepartment?: string;
  currentUserName?: string;
}

export const ReportA4PrintModal: React.FC<ReportA4PrintModalProps> = ({
  isOpen,
  onClose,
  initialReportType = 'IT_KPI',
  tickets = [],
  technicians = [],
  weeklyProblems = [],
  assets = [],
  branches = [],
  departments = [],
  filterStartDate = '',
  filterEndDate = '',
  filterBranch = 'ALL',
  filterDepartment = 'ALL',
  currentUserName = 'เจ้าหน้าที่ระบบไอที',
}) => {
  const [reportType, setReportType] = useState<ReportType>(initialReportType);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const printDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const periodDisplay =
    filterStartDate && filterEndDate
      ? `${filterStartDate} ถึง ${filterEndDate}`
      : 'ทั้งหมด (All Records)';

  const branchName =
    filterBranch === 'ALL'
      ? 'ทุกสาขา (All Branches)'
      : branches.find((b) => b.code === filterBranch || b.id === filterBranch)?.name || filterBranch;

  const deptName =
    filterDepartment === 'ALL'
      ? 'ทุกแผนก (All Departments)'
      : departments.find((d) => d.code === filterDepartment || d.id === filterDepartment)?.name ||
        filterDepartment;

  // 1. Direct Print Action (prints strictly the A4 sheet via isolated iframe)
  const handleDirectPrint = () => {
    printElementDirectly('a4-printable-report-sheet', {
      orientation: reportType === 'IT_KPI' || reportType === 'ASSET_INVENTORY' ? 'landscape' : 'portrait',
      docTitle: `XingTai_Report_${reportType}_${new Date().toISOString().substring(0, 10)}`,
    });
  };

  // 2. Direct PDF Export Action
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportA4ElementToPdf(
        'a4-printable-report-sheet',
        `XingTai_Report_${reportType}_${new Date().toISOString().substring(0, 10)}.pdf`,
        reportType === 'IT_KPI' || reportType === 'ASSET_INVENTORY' ? 'landscape' : 'portrait'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. Direct Excel Export Action
  const handleExportExcel = () => {
    if (reportType === 'IT_KPI' || reportType === 'WEEKLY_PROBLEMS') {
      const kpiData = technicians.map((t) => {
        const tTickets = tickets.filter(
          (tk) =>
            tk.assignedToTechnician === t.id ||
            tk.assignedToTechnician === t.staffId ||
            tk.assignedTechnicianName === t.name
        );
        const resolved = tTickets.filter((tk) => tk.status === 'RESOLVED' || tk.status === 'CLOSED').length;
        const resRate = tTickets.length > 0 ? Math.round((resolved / tTickets.length) * 100) : 100;
        return {
          id: t.staffId || t.id,
          name: t.name,
          title: t.title || t.roleTitle || 'IT Support',
          specialty: 'Hardware & Network',
          assignedCount: tTickets.length,
          resolvedCount: resolved,
          resRate,
          slaRate: t.slaOnTimeRate || 98,
          avgResolutionTimeHours: t.avgResolutionHours || 2.5,
          rating: 4.8,
          techCost: tTickets.reduce((acc, curr) => acc + (curr.repairCost || 0), 0),
          kpiTotalScore: Math.min(100, Math.round(resRate * 0.4 + (t.slaOnTimeRate || 98) * 0.4 + 18)),
          kpiGrade: t.grade || 'A',
        };
      });
      exportKPIReportToExcel(kpiData, weeklyProblems);
    } else if (reportType === 'TICKETS_HISTORY') {
      exportTicketsToExcel(tickets);
    } else if (reportType === 'ASSET_INVENTORY') {
      exportAssetsToExcel(assets);
    }
  };

  return (
    <div
      id="a4-report-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto"
    >
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="w-full max-w-6xl bg-[#12141c] border border-zinc-700/80 rounded-2xl p-3 sm:p-4 mb-3 text-white shadow-2xl flex flex-wrap items-center justify-between gap-3 no-print sticky top-2 z-50">
        {/* Left: Report Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#090a10] p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setReportType('IT_KPI')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              reportType === 'IT_KPI'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>1. สรุปประเมิน KPI ช่างไอที</span>
          </button>

          <button
            onClick={() => setReportType('WEEKLY_PROBLEMS')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              reportType === 'WEEKLY_PROBLEMS'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>2. สรุปปัญหาประจำสัปดาห์</span>
          </button>

          <button
            onClick={() => setReportType('TICKETS_HISTORY')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              reportType === 'TICKETS_HISTORY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>3. บัญชีรายการแจ้งซ่อม IT</span>
          </button>

          <button
            onClick={() => setReportType('ASSET_INVENTORY')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              reportType === 'ASSET_INVENTORY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>4. รายงานทะเบียนทรัพย์สิน</span>
          </button>
        </div>

        {/* Right: Print & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1 bg-[#1a1d28] px-2 py-1 rounded-lg border border-zinc-700 text-xs text-zinc-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              className="p-1 hover:text-white cursor-pointer"
              title="ย่อขนาด"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono px-1 font-bold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 hover:text-white cursor-pointer"
              title="ขยายขนาด"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Print Button */}
          <button
            onClick={handleDirectPrint}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg shadow-cyan-900/40 active:scale-95 transition-all cursor-pointer"
            title="สั่งพิมพ์เฉพาะหน้ารายงาน A4 ทันที (ไม่ต้องใช้ Ctrl+P)"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน A4 (Print)</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 bg-[#1e2333] hover:bg-[#2a3045] text-zinc-200 border border-zinc-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            title="บันทึกเอกสาร A4 เป็น PDF"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'บันทึก PDF'}</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer ml-1"
            title="ปิดหน้าต่างรายงาน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* A4 Paper Document Container (Fit to standard A4) */}
      <div className="w-full flex justify-center pb-12 overflow-x-auto">
        <div
          id="a4-printable-report-sheet"
          className="printable-a4-report bg-white text-zinc-900 shadow-2xl border border-zinc-300 p-8 sm:p-10 font-sans flex flex-col justify-between select-text transition-transform duration-150"
          style={{
            width: reportType === 'IT_KPI' || reportType === 'ASSET_INVENTORY' ? '1120px' : '820px',
            minHeight: reportType === 'IT_KPI' || reportType === 'ASSET_INVENTORY' ? '780px' : '1120px',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
          }}
        >
          {/* 1. OFFICIAL COMPANY LETTERHEAD */}
          <div>
            <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-3">
              {/* Left: Logo & Company Name */}
              <div className="flex items-start gap-3.5">
                <div className="shrink-0 pt-0.5">
                  <XingTaiLogo size="sm" showText={false} variant="icon" />
                </div>
                <div className="leading-tight">
                  <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                    บริษัท ซิง ไท่ สตีล จำกัด
                  </h1>
                  <div className="text-[11px] font-bold text-zinc-800 tracking-wide">
                    XING TAI STEEL (THAILAND) CO., LTD.
                  </div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    邢台钢铁（泰国）有限公司 • ทะเบียนนิติบุคคล: 0105563123456
                  </div>
                  <div className="text-[9px] text-zinc-600 mt-0.5">
                    สำนักงานใหญ่: 888 หมู่ 5 ถ.ศรีนครินทร์ ต.สำโรงเหนือ อ.เมือง จ.สมุทรปราการ 10270 โทร. 02-123-4567
                  </div>
                </div>
              </div>

              {/* Right: Document Title & Metadata */}
              <div className="text-right leading-tight min-w-[280px]">
                <div className="text-sm font-extrabold uppercase tracking-wider text-zinc-900 border-b border-zinc-400 pb-1 mb-1">
                  {reportType === 'IT_KPI' && 'รายงานสรุปผลงาน & KPI ช่างไอที'}
                  {reportType === 'WEEKLY_PROBLEMS' && 'รายงานสรุปปัญหาประจำสัปดาห์'}
                  {reportType === 'TICKETS_HISTORY' && 'รายงานประวัติงานแจ้งซ่อม IT'}
                  {reportType === 'ASSET_INVENTORY' && 'รายงานสรุปทะเบียนทรัพย์สิน'}
                </div>
                <div className="text-[10px] font-bold text-zinc-700 tracking-widest uppercase">
                  {reportType === 'IT_KPI' && 'IT TECHNICIAN KPI & SLA PERFORMANCE REPORT'}
                  {reportType === 'WEEKLY_PROBLEMS' && 'WEEKLY INCIDENT & ROOT CAUSE SUMMARY'}
                  {reportType === 'TICKETS_HISTORY' && 'IT HELPDESK INCIDENT & REPAIR COST LEDGER'}
                  {reportType === 'ASSET_INVENTORY' && 'FIXED ASSET INVENTORY STATUS & VALUATION'}
                </div>
                <div className="mt-1 text-[11px] font-mono">
                  <span className="text-zinc-600">วันที่พิมพ์รายงาน: </span>
                  <strong className="text-zinc-900">{printDateStr}</strong>
                </div>
                <div className="text-[11px] font-mono">
                  <span className="text-zinc-600">ผู้พิมพ์รายงาน: </span>
                  <strong className="text-zinc-900">{currentUserName}</strong>
                </div>
              </div>
            </div>

            {/* 2. PARAMETERS & SCOPE BANNER */}
            <div className="grid grid-cols-12 gap-2 my-3 py-2 px-3 bg-zinc-100 border border-zinc-300 rounded text-[11px]">
              <div className="col-span-5 flex items-center gap-1.5">
                <span className="font-bold text-zinc-700">ช่วงเวลาข้อมูล:</span>
                <span className="text-zinc-900 font-semibold">{periodDisplay}</span>
              </div>
              <div className="col-span-4 flex items-center gap-1.5">
                <span className="font-bold text-zinc-700">สาขา:</span>
                <span className="text-zinc-900 font-semibold">{branchName}</span>
              </div>
              <div className="col-span-3 flex items-center justify-end gap-1.5">
                <span className="font-bold text-zinc-700">แผนก:</span>
                <span className="text-zinc-900 font-semibold">{deptName}</span>
              </div>
            </div>

            {/* 3. REPORT CONTENT BASED ON SELECTED REPORT TYPE */}

            {/* A. IT KPI REPORT */}
            {reportType === 'IT_KPI' && (
              <div className="space-y-4">
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">จนท. ไอที ทั้งหมด</div>
                    <div className="text-base font-bold text-zinc-900">{technicians.length} ท่าน</div>
                  </div>
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">งานแจ้งซ่อมทั้งหมด</div>
                    <div className="text-base font-bold text-zinc-900">{tickets.length} รายการ</div>
                  </div>
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">อัตราแก้ไขตามเวลา SLA เฉลี่ย</div>
                    <div className="text-base font-bold text-emerald-800">98.4%</div>
                  </div>
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">งบประมาณค่าซ่อมรวม</div>
                    <div className="text-base font-bold text-blue-900">
                      ฿{tickets.reduce((acc, curr) => acc + (curr.repairCost || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* KPI Table */}
                <div className="border border-zinc-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-800 text-white font-bold text-center divide-x divide-zinc-700">
                        <th className="py-2 px-1.5 w-10">ลำดับ</th>
                        <th className="py-2 px-2 w-24">รหัสพนักงาน</th>
                        <th className="py-2 px-3 text-left">ชื่อ-นามสกุล / ตำแหน่ง</th>
                        <th className="py-2 px-2 w-16">งานที่รับ</th>
                        <th className="py-2 px-2 w-16">ปิดงานสำเร็จ</th>
                        <th className="py-2 px-2 w-20">อัตราปิดงาน</th>
                        <th className="py-2 px-2 w-20">ตรงเวลา SLA</th>
                        <th className="py-2 px-2 w-20">เฉลี่ย ชม./งาน</th>
                        <th className="py-2 px-2 w-24">ค่าซ่อมที่ดูแล</th>
                        <th className="py-2 px-2 w-16">คะแนน KPI</th>
                        <th className="py-2 px-2 w-16">เกรด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-900">
                      {technicians.map((t, idx) => {
                        const tTickets = tickets.filter(
                          (tk) =>
                            tk.assignedToTechnician === t.id ||
                            tk.assignedToTechnician === t.staffId ||
                            tk.assignedTechnicianName === t.name
                        );
                        const resolved = tTickets.filter(
                          (tk) => tk.status === 'RESOLVED' || tk.status === 'CLOSED'
                        ).length;
                        const resRate = tTickets.length > 0 ? Math.round((resolved / tTickets.length) * 100) : 100;
                        const totalCost = tTickets.reduce((acc, curr) => acc + (curr.repairCost || 0), 0);
                        const kpiScore = Math.min(100, Math.round(resRate * 0.4 + (t.slaOnTimeRate || 98) * 0.4 + 18));

                        return (
                          <tr
                            key={t.id}
                            className={`divide-x divide-zinc-200 text-center ${
                              idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'
                            }`}
                          >
                            <td className="py-2 px-1 font-mono">{idx + 1}</td>
                            <td className="py-2 px-2 font-mono font-bold text-zinc-700">{t.staffId || t.id}</td>
                            <td className="py-2 px-3 text-left">
                              <div className="font-bold text-zinc-900">{t.name}</div>
                              <div className="text-[9px] text-zinc-500">{t.title || t.roleTitle || 'IT Support'}</div>
                            </td>
                            <td className="py-2 px-2 font-mono font-bold">{tTickets.length}</td>
                            <td className="py-2 px-2 font-mono text-emerald-800 font-bold">{resolved}</td>
                            <td className="py-2 px-2 font-mono font-semibold">{resRate}%</td>
                            <td className="py-2 px-2 font-mono font-semibold text-blue-800">{t.slaOnTimeRate || 98}%</td>
                            <td className="py-2 px-2 font-mono">{t.avgResolutionHours || 2.5} ชม.</td>
                            <td className="py-2 px-2 font-mono">฿{totalCost.toLocaleString()}</td>
                            <td className="py-2 px-2 font-mono font-bold text-purple-900">{kpiScore}</td>
                            <td className="py-2 px-2 font-bold">
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono ${
                                  t.grade === 'A'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                                }`}
                              >
                                {t.grade || 'A'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* B. WEEKLY PROBLEMS REPORT */}
            {reportType === 'WEEKLY_PROBLEMS' && (
              <div className="space-y-3">
                {weeklyProblems.map((w) => (
                  <div key={w.id} className="border border-zinc-400 rounded overflow-hidden mb-3">
                    <div className="bg-zinc-100 px-3 py-1.5 border-b border-zinc-300 flex items-center justify-between text-xs font-bold">
                      <span className="text-zinc-900 font-mono">
                        สัปดาห์ที่ {w.weekNumber} (ช่วงวันที่: {w.dateRange})
                      </span>
                      <span className="text-zinc-600 text-[11px]">
                        จำนวนปัญหาตรวจพบ: {w.totalProblems} รายการ | ปิดงานสำเร็จ: {w.resolvedCount} รายการ
                      </span>
                    </div>
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-zinc-700 text-white font-bold text-center divide-x divide-zinc-600">
                          <th className="py-1.5 px-2 text-left w-32">หมวดหมู่อุปกรณ์</th>
                          <th className="py-1.5 px-2 text-left">ปัญหาที่ตรวจพบ (Issue)</th>
                          <th className="py-1.5 px-1.5 w-12">จำนวน</th>
                          <th className="py-1.5 px-2 text-left">สาเหตุหลัก (Root Cause)</th>
                          <th className="py-1.5 px-2 text-left">แนวทางแก้ไข & ป้องกัน (Action Plan)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 text-zinc-900">
                        {w.topIssues.map((issue, idx) => (
                          <tr
                            key={idx}
                            className={`divide-x divide-zinc-200 ${idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}`}
                          >
                            <td className="py-1.5 px-2 font-bold text-zinc-800">{issue.category}</td>
                            <td className="py-1.5 px-2 font-semibold text-zinc-900">{issue.issueName}</td>
                            <td className="py-1.5 px-1.5 text-center font-mono font-bold text-blue-900">
                              {issue.count}
                            </td>
                            <td className="py-1.5 px-2 text-zinc-700 leading-tight">{issue.rootCause}</td>
                            <td className="py-1.5 px-2 text-emerald-900 leading-tight font-medium">
                              {issue.preventiveAction}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* C. TICKETS HISTORY REPORT */}
            {reportType === 'TICKETS_HISTORY' && (
              <div className="space-y-3">
                <div className="border border-zinc-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[9.5px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-800 text-white font-bold text-center divide-x divide-zinc-700">
                        <th className="py-2 px-1 w-8">#</th>
                        <th className="py-2 px-1.5 w-20">รหัสแจ้งซ่อม</th>
                        <th className="py-2 px-2 text-left min-w-[140px]">หัวข้อปัญหา / รายละเอียด</th>
                        <th className="py-2 px-1.5 w-20">หมวดหมู่</th>
                        <th className="py-2 px-2 text-left w-28">ผู้แจ้ง / แผนก</th>
                        <th className="py-2 px-2 text-left w-24">ช่างผู้ดูแล</th>
                        <th className="py-2 px-1.5 w-16">สถานะ</th>
                        <th className="py-2 px-1.5 w-14">ชม. ซ่อม</th>
                        <th className="py-2 px-1.5 w-16">ค่าซ่อม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-900">
                      {tickets.slice(0, 18).map((tk, idx) => (
                        <tr
                          key={tk.id}
                          className={`divide-x divide-zinc-200 ${idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}`}
                        >
                          <td className="py-1.5 px-1 text-center font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-1.5 text-center font-mono font-bold text-blue-900">{tk.id}</td>
                          <td className="py-1.5 px-2">
                            <div className="font-bold text-zinc-900">{tk.subject}</div>
                            <div className="text-[8.5px] text-zinc-500 truncate max-w-[200px]">{tk.details}</div>
                          </td>
                          <td className="py-1.5 px-1.5 text-center text-zinc-700">{tk.category}</td>
                          <td className="py-1.5 px-2">
                            <div className="font-semibold text-zinc-800">{tk.requesterStaffName}</div>
                            <div className="text-[8.5px] text-zinc-500">{tk.requesterDept}</div>
                          </td>
                          <td className="py-1.5 px-2 font-medium text-zinc-800">
                            {tk.assignedTechnicianName || 'ยังไม่กำหนด'}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-bold font-mono text-[8.5px]">
                            <span
                              className={`px-1 py-0.5 rounded ${
                                tk.status === 'RESOLVED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : tk.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {tk.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-mono">{tk.resolutionHours || '-'}</td>
                          <td className="py-1.5 px-1.5 text-right font-mono font-semibold">
                            {tk.repairCost ? `฿${tk.repairCost.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-100 border-t-2 border-zinc-400 font-bold text-zinc-900 text-center divide-x divide-zinc-300">
                        <td colSpan={7} className="py-2 px-3 text-right">
                          รวมค่าใช้จ่ายซ่อมบำรุงทั้งสิ้น:
                        </td>
                        <td colSpan={2} className="py-2 px-3 text-right font-mono text-blue-900 text-xs">
                          ฿{tickets.reduce((acc, curr) => acc + (curr.repairCost || 0), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* D. ASSET INVENTORY REPORT */}
            {reportType === 'ASSET_INVENTORY' && (
              <div className="space-y-3">
                {/* Summary Cards */}
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">ทรัพย์สินทั้งหมด</div>
                    <div className="text-base font-bold text-zinc-900">{assets.length} รายการ</div>
                  </div>
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">ใช้งานอยู่ (In-Use)</div>
                    <div className="text-base font-bold text-emerald-800">
                      {assets.filter((a) => a.status === 'IN_USE').length} รายการ
                    </div>
                  </div>
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">สำรองพร้อมใช้ (Spare)</div>
                    <div className="text-base font-bold text-blue-800">
                      {assets.filter((a) => a.status === 'SPARE').length} รายการ
                    </div>
                  </div>
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">ส่งซ่อม / รอตัดจำหน่าย</div>
                    <div className="text-base font-bold text-amber-800">
                      {assets.filter((a) => a.status === 'REPAIR' || a.status === 'RETIRED').length} รายการ
                    </div>
                  </div>
                  <div className="p-2 border border-zinc-300 bg-zinc-50 rounded">
                    <div className="text-[10px] text-zinc-600">มูลค่าต้นทุนรวม</div>
                    <div className="text-base font-bold text-purple-900">
                      ฿{assets.reduce((acc, curr) => acc + (curr.cost || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-zinc-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[9.5px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-800 text-white font-bold text-center divide-x divide-zinc-700">
                        <th className="py-2 px-1 w-8">#</th>
                        <th className="py-2 px-2 w-24">รหัสทรัพย์สิน</th>
                        <th className="py-2 px-2 text-left min-w-[140px]">ชื่อทรัพย์สิน / รายละเอียด</th>
                        <th className="py-2 px-2 w-20">หมวดหมู่</th>
                        <th className="py-2 px-2 text-left w-24">สถานที่ / สาขา</th>
                        <th className="py-2 px-2 text-left w-28">ผู้ถือครอง (Owner)</th>
                        <th className="py-2 px-2 w-20">สถานะ</th>
                        <th className="py-2 px-2 w-24">วันที่ได้มา</th>
                        <th className="py-2 px-2 w-24 text-right">ราคาต้นทุน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-900">
                      {assets.slice(0, 16).map((a, idx) => (
                        <tr
                          key={a.id}
                          className={`divide-x divide-zinc-200 ${idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}`}
                        >
                          <td className="py-1.5 px-1 text-center font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-2 font-mono font-bold text-blue-900 text-center">{a.assetId}</td>
                          <td className="py-1.5 px-2">
                            <div className="font-bold text-zinc-900">{a.assetName}</div>
                            <div className="text-[8.5px] text-zinc-500">
                              {a.brand || '-'} {a.model || ''} S/N: {a.serialNo || '-'}
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center text-zinc-700">{a.category}</td>
                          <td className="py-1.5 px-2 text-zinc-800">{a.branchCode} - {a.location}</td>
                          <td className="py-1.5 px-2 font-medium text-zinc-800">{a.ownerStaffName || 'ส่วนกลาง'}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-[8.5px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                a.status === 'IN_USE'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : a.status === 'SPARE'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono">{a.acquisitionDate}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">
                            ฿{(a.cost || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-100 border-t-2 border-zinc-400 font-bold text-zinc-900 text-center divide-x divide-zinc-300">
                        <td colSpan={8} className="py-2 px-3 text-right">
                          มูลค่ารวมทรัพย์สินทั้งหมด:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-purple-900 text-xs">
                          ฿{assets.reduce((acc, curr) => acc + (curr.cost || 0), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 4. FORMAL 3-STEP SIGN-OFF APPROVAL BOXES */}
          <div className="pt-6 border-t border-zinc-300 mt-6">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              {/* Box 1: Prepared By */}
              <div className="border border-zinc-400 p-3 rounded bg-zinc-50 flex flex-col justify-between min-h-[110px]">
                <div className="font-bold text-zinc-800">ผู้จัดทำรายงาน (Prepared By)</div>
                <div className="pt-5 pb-1 border-b border-dashed border-zinc-400 text-zinc-800 font-serif">
                  ( {currentUserName} )
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  ตำแหน่ง: เจ้าหน้าที่ระบบไอที / วันที่: {printDateStr.substring(0, 10)}
                </div>
              </div>

              {/* Box 2: Verified By */}
              <div className="border border-zinc-400 p-3 rounded bg-zinc-50 flex flex-col justify-between min-h-[110px]">
                <div className="font-bold text-zinc-800">ผู้ตรวจสอบ (Verified By)</div>
                <div className="pt-5 pb-1 border-b border-dashed border-zinc-400 text-zinc-600 font-serif">
                  ( ..................................................... )
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  ตำแหน่ง: หัวหน้างาน / ผู้จัดการแผนก / วันที่: ....../....../......
                </div>
              </div>

              {/* Box 3: Approved By */}
              <div className="border border-zinc-400 p-3 rounded bg-zinc-50 flex flex-col justify-between min-h-[110px]">
                <div className="font-bold text-zinc-800">ผู้อนุมัติ (Approved By)</div>
                <div className="pt-5 pb-1 border-b border-dashed border-zinc-400 text-zinc-600 font-serif">
                  ( ..................................................... )
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  ตำแหน่ง: กรรมการผู้จัดการ / ผู้มีอำนาจลงนาม / วันที่: ....../....../......
                </div>
              </div>
            </div>

            {/* Document Verification Footer */}
            <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-3 pt-2 border-t border-zinc-200">
              <div>เอกสารระบบสารสนเทศ บริษัท ซิง ไท่ สตีล จำกัด • ระบบบริหารจัดการทรัพย์สินและงานซ่อม IT</div>
              <div className="font-mono">Page 1 of 1 • System Generated Report (ISO 27001 / Internal Control)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
