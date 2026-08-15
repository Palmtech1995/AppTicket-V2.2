/**
 * ============================================================================
 * [MODULE: IT SERVICE DESK & TECHNICIAN KPI REPORT]
 * File: /src/components/Reports/ITReportView.tsx
 * Description: IT Performance and KPI Center with SLA scores, technician rankings,
 *              cost analytics, and weekly recurring problem summaries.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Technician KPI Assessments: คำนวณคะแนน SLA, First Contact Resolution, Customer CSAT
 * 2. Weekly Incident Analytics: วิเคราะห์ปัญหาที่เกิดซ้ำรายสัปดาห์ (Network, ERP, Hardware)
 * 3. Maintenance Cost Radar: สรุปค่าซ่อมและอะไหล่ประจำเดือน
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Calendar,
  UserCheck,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  TrendingUp,
  Award,
  BarChart3,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Zap,
  DollarSign,
  Download,
} from 'lucide-react';
import { ITTicket, TechnicianMetric, WeeklyProblemSummary } from '../../types';
import { exportTicketsToExcel, exportKPIReportToExcel } from '../../utils/exportUtils';

interface ITReportViewProps {
  tickets: ITTicket[];
  technicians: TechnicianMetric[];
  weeklyProblems: WeeklyProblemSummary[];
}

export const ITReportView: React.FC<ITReportViewProps> = ({
  tickets,
  technicians,
  weeklyProblems,
}) => {
  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'KPI_ASSESSMENT' | 'WEEKLY_PROBLEMS'>('KPI_ASSESSMENT');

  // Date filters
  const [datePreset, setDatePreset] = useState<'ALL' | 'THIS_MONTH' | '3_MONTHS' | '6_MONTHS' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dimension filters
  const [selectedTech, setSelectedTech] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected week for Weekly Problem modal / deep-dive
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(33);

  // Quick Preset handler
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

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Date filter (createdAt)
      if (startDate || endDate) {
        const tDate = new Date(t.createdAt);
        if (startDate && tDate < new Date(startDate)) return false;
        if (endDate && tDate > new Date(endDate + 'T23:59:59')) return false;
      }

      // Tech filter
      if (selectedTech !== 'ALL' && t.assignedToTechnician !== selectedTech) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;

      // Priority filter
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.requesterStaffName.toLowerCase().includes(q) ||
          (t.assignedTechnicianName && t.assignedTechnicianName.toLowerCase().includes(q)) ||
          (t.assetName && t.assetName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [tickets, startDate, endDate, selectedTech, selectedStatus, selectedPriority, selectedCategory, searchQuery]);

  // Aggregate Metrics
  const totalTickets = filteredTickets.length;
  const closedTickets = filteredTickets.filter((t) => t.status === 'CLOSED' || t.status === 'RESOLVED').length;
  const inProgressTickets = filteredTickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolutionRate = totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 100;
  const totalRepairCost = filteredTickets.reduce((sum, t) => sum + (t.repairCost || 0), 0);

  // Compute live KPI metrics per technician
  const techKPIs = useMemo(() => {
    return technicians.map((tech) => {
      // Tickets assigned to this tech in current filtered set or overall
      const techTickets = tickets.filter((t) => {
        if (t.assignedToTechnician !== tech.id) return false;
        if (startDate || endDate) {
          const tDate = new Date(t.createdAt);
          if (startDate && tDate < new Date(startDate)) return false;
          if (endDate && tDate > new Date(endDate + 'T23:59:59')) return false;
        }
        return true;
      });

      const assignedCount = techTickets.length;
      const resolvedCount = techTickets.filter((t) => t.status === 'CLOSED' || t.status === 'RESOLVED').length;
      const activeCount = techTickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'NEW').length;
      const techCost = techTickets.reduce((sum, t) => sum + (t.repairCost || 0), 0);
      const resRate = assignedCount > 0 ? Math.round((resolvedCount / assignedCount) * 100) : 100;

      // KPI Score Calculation (Weighted: 40% Resolution Rate + 30% SLA + 30% Rating)
      const slaRate = tech.slaOnTimeRate || 95;
      const techRating = typeof tech.rating === 'number' ? tech.rating : 4.8;
      const ratingScore = (techRating / 5) * 100;
      const kpiTotalScore = Math.round(resRate * 0.4 + slaRate * 0.3 + ratingScore * 0.3);

      let grade = 'A';
      if (kpiTotalScore >= 95) grade = 'A+ (ยอดเยี่ยม)';
      else if (kpiTotalScore >= 85) grade = 'A (ดีมาก)';
      else if (kpiTotalScore >= 75) grade = 'B (มาตรฐาน)';
      else grade = 'C (ต้องปรับปรุง)';

      const title = tech.roleTitle || tech.title || 'IT Support Specialist';
      const specialty = tech.specialty || 'General IT Support & Infrastructure';
      const avgResolutionTimeHours = tech.avgResolutionHours || tech.avgResolutionTimeHours || 3.2;

      return {
        ...tech,
        title,
        specialty,
        rating: techRating,
        avgResolutionTimeHours,
        assignedCount,
        resolvedCount,
        activeCount,
        techCost,
        resRate,
        slaRate,
        kpiTotalScore,
        kpiGrade: grade,
      };
    });
  }, [technicians, tickets, startDate, endDate]);

  // Active weekly problem view
  const currentWeekData = useMemo(() => {
    return weeklyProblems.find((w) => w.weekNumber === selectedWeekNum) || weeklyProblems[0];
  }, [weeklyProblems, selectedWeekNum]);

  // Export handlers
  const handleExportTicketsExcel = () => {
    const filename = `XingTai_IT_Tickets_${datePreset}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportTicketsToExcel(filteredTickets, filename);
  };

  const handleExportKPIExcel = () => {
    const filename = `XingTai_IT_KPI_Assessment_${datePreset}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportKPIReportToExcel(techKPIs, weeklyProblems, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="bg-[#12141c] border border-zinc-800/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">รายงานแจ้งซ่อม IT & ประเมินผลงาน KPI</h2>
              <p className="text-xs text-zinc-400">
                IT Service Desk Analytics, Technician KPI Scorecard & Weekly Incident Summaries
              </p>
            </div>
          </div>

          {/* Export & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportKPIExcel}
              className="flex items-center gap-2 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/60 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span>Export รายงาน KPI & สรุปสัปดาห์ (Excel)</span>
            </button>

            <button
              onClick={handleExportTicketsExcel}
              className="flex items-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Tickets ({filteredTickets.length})</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#1b1e27] hover:bg-[#252a38] text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>พิมพ์รายงาน (Print)</span>
            </button>
          </div>
        </div>

        {/* 3 Main Functional Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveSubTab('KPI_ASSESSMENT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'KPI_ASSESSMENT'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>1. สรุปรายคนเพื่อประเมิน KPI (Technician KPI)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('WEEKLY_PROBLEMS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'WEEKLY_PROBLEMS'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>2. สรุปปัญหาต่างๆ ที่เจอในแต่ละสัปดาห์ (Weekly Problems)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'OVERVIEW'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>3. ภาพรวม & รายการแจ้งซ่อมทั้งหมด (Tickets Log)</span>
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-zinc-300">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>เลือกช่วงเวลาประเมินผล:</span>
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
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#0a0c12] p-3 rounded-xl border border-zinc-800/80">
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
                ล้างช่วงวันที่ (Clear Date Filter)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: KPI Assessment per Person */}
      {activeSubTab === 'KPI_ASSESSMENT' && (
        <div className="space-y-6">
          {/* Header Description */}
          <div className="bg-gradient-to-r from-purple-950/60 via-[#151226] to-[#12141c] border border-purple-900/50 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 text-[11px] font-bold border border-purple-700 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IT Service Desk & Support Evaluation Framework</span>
              </div>
              <h3 className="text-lg font-bold text-white">ตารางสรุปผลงานรายบุคคลเพื่อประเมิน KPI ช่างเทคนิค IT</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                คำนวณจากเกณฑ์: อัตราการปิดงานสำเร็จ (40%) + ความตรงต่อเวลา SLA (30%) + คะแนนความพึงพอใจ CSAT (30%)
              </p>
            </div>

            <button
              onClick={handleExportKPIExcel}
              className="shrink-0 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดรายงาน KPI รายคน (.xlsx)</span>
            </button>
          </div>

          {/* Technician KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {techKPIs.map((tech) => (
              <div
                key={tech.id}
                className="bg-[#12141e] border border-zinc-800/90 rounded-2xl p-5 shadow-sm space-y-4 hover:border-purple-600/50 transition-all"
              >
                {/* Tech Profile Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-700/60 flex items-center justify-center text-purple-300 font-bold text-base font-mono">
                      {tech.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{tech.name}</div>
                      <div className="text-xs text-zinc-400">{tech.title}</div>
                      <div className="text-[11px] font-mono text-purple-400">{tech.specialty}</div>
                    </div>
                  </div>

                  {/* Grade Badge */}
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black font-mono shadow ${
                        tech.kpiTotalScore >= 90
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : tech.kpiTotalScore >= 80
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}
                    >
                      {tech.kpiGrade}
                    </span>
                    <div className="text-[10px] text-zinc-500 font-mono mt-1">Score: {tech.kpiTotalScore}/100</div>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">KPI Overall Performance Score</span>
                    <span className="font-mono font-bold text-white">{tech.kpiTotalScore}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        tech.kpiTotalScore >= 90
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : tech.kpiTotalScore >= 80
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                          : 'bg-gradient-to-r from-amber-500 to-orange-400'
                      }`}
                      style={{ width: `${tech.kpiTotalScore}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-800 text-xs">
                  <div className="bg-[#171926] p-2.5 rounded-xl border border-zinc-800/80">
                    <div className="text-zinc-400 text-[11px]">งานที่ได้รับมอบหมาย</div>
                    <div className="font-mono font-bold text-white text-base mt-0.5">
                      {tech.assignedCount} <span className="text-[10px] text-zinc-400 font-normal">งาน</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      ปิดแล้ว {tech.resolvedCount} ({tech.resRate}%)
                    </div>
                  </div>

                  <div className="bg-[#171926] p-2.5 rounded-xl border border-zinc-800/80">
                    <div className="text-zinc-400 text-[11px]">SLA On-Time Rate</div>
                    <div className="font-mono font-bold text-cyan-400 text-base mt-0.5">
                      {tech.slaRate}%
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      ความตรงต่อเวลา
                    </div>
                  </div>

                  <div className="bg-[#171926] p-2.5 rounded-xl border border-zinc-800/80">
                    <div className="text-zinc-400 text-[11px]">Avg Resolution Time</div>
                    <div className="font-mono font-bold text-amber-400 text-base mt-0.5">
                      {tech.avgResolutionTimeHours} <span className="text-[10px] text-zinc-400 font-normal">ชม.</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      ความเร็วเฉลี่ยต่องาน
                    </div>
                  </div>

                  <div className="bg-[#171926] p-2.5 rounded-xl border border-zinc-800/80">
                    <div className="text-zinc-400 text-[11px]">ความพึงพอใจ (CSAT)</div>
                    <div className="font-mono font-bold text-purple-400 text-base mt-0.5 flex items-center gap-1">
                      <span>★</span> {(tech.rating ?? 4.8).toFixed(1)} <span className="text-[10px] text-zinc-400 font-normal">/ 5.0</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      คะแนนจากผู้แจ้งซ่อม
                    </div>
                  </div>
                </div>

                {/* Repair Cost Managed */}
                <div className="bg-[#0a0c12] p-2.5 rounded-xl border border-zinc-800 text-xs flex items-center justify-between">
                  <span className="text-zinc-400">งบประมาณค่าซ่อมที่บริหาร:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ฿{tech.techCost.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Full KPI Summary Table */}
          <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>ตารางคะแนนประเมิน KPI รวม (Comprehensive Performance Matrix)</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Q3 Performance Cycle</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0c0e14] text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">เจ้าหน้าที่ IT</th>
                    <th className="p-3.5">ตำแหน่ง / ความเชี่ยวชาญ</th>
                    <th className="p-3.5 text-center">งานทั้งหมด</th>
                    <th className="p-3.5 text-center">ปิดงานสำเร็จ</th>
                    <th className="p-3.5 text-center">ความเร็วเฉลี่ย</th>
                    <th className="p-3.5 text-center">SLA Compliance</th>
                    <th className="p-3.5 text-center">CSAT Rating</th>
                    <th className="p-3.5 text-right">งบประมาณที่ดูแล</th>
                    <th className="p-3.5 text-center">คะแนนรวม KPI</th>
                    <th className="p-3.5 text-center">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {techKPIs.map((tech) => (
                    <tr key={tech.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300 font-mono text-xs">
                          {tech.name[0]}
                        </div>
                        <div>
                          <div>{tech.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono font-normal">{tech.id}</div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-zinc-200">{tech.title}</div>
                        <div className="text-[10px] text-purple-400 font-mono">{tech.specialty}</div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-white">{tech.assignedCount}</td>
                      <td className="p-3.5 text-center font-mono font-semibold text-emerald-400">
                        {tech.resolvedCount} ({tech.resRate}%)
                      </td>
                      <td className="p-3.5 text-center font-mono text-amber-400">{tech.avgResolutionTimeHours} ชม.</td>
                      <td className="p-3.5 text-center font-mono font-bold text-cyan-400">{tech.slaRate}%</td>
                      <td className="p-3.5 text-center font-mono font-semibold text-yellow-400">★ {(tech.rating ?? 4.8).toFixed(1)}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                        ฿{tech.techCost.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-white text-sm">
                        {tech.kpiTotalScore} / 100
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            tech.kpiTotalScore >= 90
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : tech.kpiTotalScore >= 80
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}
                        >
                          {tech.kpiGrade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Weekly Problems Breakdown */}
      {activeSubTab === 'WEEKLY_PROBLEMS' && (
        <div className="space-y-6">
          {!currentWeekData ? (
            <div className="bg-[#12141e] border border-zinc-800/90 rounded-2xl p-12 text-center text-zinc-400 space-y-3">
              <ShieldAlert className="w-10 h-10 mx-auto text-zinc-600" />
              <div className="text-sm text-zinc-200 font-bold">ยังไม่มีข้อมูลสรุปอุบัติการณ์ประจำสัปดาห์ในฐานข้อมูล</div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                เมื่อมีการบันทึกการแจ้งซ่อมและปิดงานในแต่ละสัปดาห์ ข้อมูลสถิติ Root Cause & Preventive Action จะถูกสรุปและแสดงผลที่นี่โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            <>
              {/* Week Selector Bar */}
              <div className="bg-[#12141e] border border-zinc-800/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-cyan-400" />
                      <span>สรุปปัญหาและอุบัติการณ์ที่ตรวจพบในแต่ละสัปดาห์ (Weekly Incident & Root Cause Analysis)</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      วิเคราะห์สาเหตุเชิงลึก (Root Cause) และมาตรการป้องกันแก้ไข (Preventive Action) แยกตามสัปดาห์
                    </p>
                  </div>

                  {/* Week Tabs */}
                  <div className="flex items-center gap-2 bg-[#0a0c12] p-1 rounded-xl border border-zinc-800">
                    {weeklyProblems.map((w) => (
                      <button
                        key={w.weekNumber}
                        onClick={() => setSelectedWeekNum(w.weekNumber)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedWeekNum === w.weekNumber
                            ? 'bg-cyan-600 text-white shadow'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                        }`}
                      >
                        สัปดาห์ที่ {w.weekNumber - 30} (W{w.weekNumber})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Selected Week Banner */}
                <div className="bg-gradient-to-r from-cyan-950/40 via-[#101926] to-[#12141e] p-4 rounded-xl border border-cyan-800/40 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-400 text-[11px]">สัปดาห์และช่วงวันที่</div>
                    <div className="font-bold text-white text-sm mt-0.5">{currentWeekData.weekLabel}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{currentWeekData.dateRange}</div>
                  </div>

                  <div>
                    <div className="text-zinc-400 text-[11px]">จำนวนปัญหาทั้งหมด</div>
                    <div className="font-mono font-extrabold text-white text-lg mt-0.5">
                      {currentWeekData.totalIncidents} <span className="text-xs text-zinc-400 font-normal">เคส</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-zinc-400 text-[11px]">Hardware / อุปกรณ์</div>
                    <div className="font-mono font-bold text-amber-400 text-base mt-0.5">
                      {currentWeekData.hardwareCount} เคส
                    </div>
                  </div>

                  <div>
                    <div className="text-zinc-400 text-[11px]">Software / ระบบงาน</div>
                    <div className="font-mono font-bold text-purple-400 text-base mt-0.5">
                      {currentWeekData.softwareCount} เคส
                    </div>
                  </div>

                  <div>
                    <div className="text-zinc-400 text-[11px]">อัตราการแก้ไขเสร็จสิ้น</div>
                    <div className="font-mono font-bold text-emerald-400 text-base mt-0.5">
                      {currentWeekData.resolvedRate}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Issues in This Week Cards */}
              <div className="space-y-4">
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <span>รายการปัญหาหลักที่พบบ่อยในสัปดาห์นี้ ({currentWeekData.topIssues.length} รายการหลัก)</span>
                  <span className="text-xs font-mono text-zinc-400">{currentWeekData.dateRange}</span>
                </div>

                <div className="space-y-3.5">
                  {currentWeekData.topIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-[#12141e] border border-zinc-800/90 rounded-2xl p-5 shadow-sm space-y-3 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-mono text-cyan-400 font-semibold">{issue.category}</div>
                            <h4 className="text-sm font-bold text-white">{issue.issueName}</h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              issue.severity === 'CRITICAL'
                                ? 'bg-red-950 text-red-300 border-red-800'
                                : issue.severity === 'HIGH'
                                ? 'bg-orange-950 text-orange-300 border-orange-800'
                                : issue.severity === 'MEDIUM'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {issue.severity} SEVERITY
                          </span>

                          <div className="font-mono text-xs text-zinc-300 bg-[#0a0c12] px-2.5 py-1 rounded-lg border border-zinc-800">
                            พบ <span className="font-bold text-white">{issue.count}</span> ครั้ง ({issue.percentage}%)
                          </div>
                        </div>
                      </div>

                      {/* Root Cause & Preventive Action */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="bg-[#181a26] p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>สาเหตุของปัญหา (Root Cause)</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed text-[11px]">{issue.rootCause}</p>
                        </div>

                        <div className="bg-[#142022] p-3.5 rounded-xl border border-teal-900/60 space-y-1">
                          <div className="font-semibold text-teal-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>แนวทางแก้ไขและป้องกัน (Preventive Action)</span>
                          </div>
                          <p className="text-teal-100/90 leading-relaxed text-[11px]">{issue.preventiveAction}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Detailed Ticket Overview & Logs */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Secondary Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-[#12141c] p-4 rounded-2xl border border-zinc-800">
            <div>
              <label className="text-zinc-400 block mb-1">กรองตามช่างเทคนิค</label>
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="ALL">ช่างทุกคน (All Technicians)</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">สถานะใบแจ้งซ่อม</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="ALL">ทุกสถานะ (All Status)</option>
                <option value="NEW">NEW (แจ้งใหม่)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (กำลังดำเนินการ)</option>
                <option value="RESOLVED">RESOLVED (แก้ไขเสร็จสิ้น)</option>
                <option value="CLOSED">CLOSED (ปิดงานสมบูรณ์)</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">ระดับความเร่งด่วน</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-[#141620] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              >
                <option value="ALL">ทุกระดับ (All Priority)</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">ค้นหารวดเร็ว</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ค้นหา Ticket ID, ผู้แจ้ง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141620] border border-zinc-700 rounded-lg pl-8 pr-2 py-2 text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* Tickets Summary Table */}
          <div className="bg-[#12141a] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <span className="font-bold text-white">รายการใบแจ้งซ่อม IT Ticket ทั้งหมด</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-400 font-mono">
                  {filteredTickets.length} Tickets
                </span>
              </div>

              <button
                onClick={handleExportTicketsExcel}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Tickets Excel (.xlsx)</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0c0e14] text-zinc-400 uppercase font-mono text-[11px] sticky top-0 z-10 border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">หัวข้อปัญหา / รายละเอียด</th>
                    <th className="p-3">ผู้แจ้ง / สาขา</th>
                    <th className="p-3">ทรัพย์สินที่เกี่ยวข้อง</th>
                    <th className="p-3">ช่างผู้รับผิดชอบ</th>
                    <th className="p-3 text-right">ค่าใช้จ่ายซ่อม</th>
                    <th className="p-3 text-center">Priority</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-center">วันที่แจ้ง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-400">{t.id}</td>
                      <td className="p-3 max-w-[280px]">
                        <div className="font-medium text-white truncate" title={t.subject}>
                          {t.subject}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate" title={t.details}>
                          {t.details}
                        </div>
                      </td>
                      <td className="p-3 text-[11px]">
                        <div className="text-zinc-200">{t.requesterStaffName}</div>
                        <div className="text-zinc-500 font-mono">{t.requesterBranch} - {t.requesterDept}</div>
                      </td>
                      <td className="p-3 text-[11px]">
                        {t.assetName ? (
                          <div>
                            <div className="text-zinc-200 truncate max-w-[140px]">{t.assetName}</div>
                            <div className="text-[10px] text-cyan-400 font-mono">{t.assetId}</div>
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-purple-300 font-medium">
                        {t.assignedTechnicianName || <span className="text-zinc-500">ยังไม่มอบหมาย</span>}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                        {t.repairCost ? `฿${t.repairCost.toLocaleString()}` : <span className="text-zinc-500">-</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.priority === 'CRITICAL'
                              ? 'bg-red-950 text-red-400 border-red-800'
                              : t.priority === 'HIGH'
                              ? 'bg-orange-950 text-orange-400 border-orange-800'
                              : t.priority === 'MEDIUM'
                              ? 'bg-amber-950 text-amber-400 border-amber-800'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.status === 'CLOSED' || t.status === 'RESOLVED'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-zinc-400">
                        {t.createdAt.split(' ')[0]}
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-zinc-500">
                        ไม่พบข้อมูล Ticket ตามเงื่อนไขช่วงเวลาหรือตัวกรองที่ระบุ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
