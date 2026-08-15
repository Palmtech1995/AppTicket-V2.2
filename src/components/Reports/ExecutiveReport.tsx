/**
 * ============================================================================
 * [MODULE: EXECUTIVE REPORT CENTER (ASSET & IT SPLIT)]
 * File: /src/components/Reports/ExecutiveReport.tsx
 * Description: Executive Analytics Dashboard separated into 2 distinct modules:
 *              1. Asset & Inventory Analytics (AssetReportView)
 *              2. IT Helpdesk & SLA KPI Center (ITReportView)
 * 
 * [ฟังก์ชันหลัก]:
 * - สลับดูรายงาน 2 หมวดหมู่อย่างเป็นสัดส่วน
 * - เชื่อมต่อ Recharts สำหรับกราฟแสดงแนวโน้มและสถิติ
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Boxes,
  Wrench,
  Award,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { Asset, Branch, Department, ITTicket, TechnicianMetric, TransferForm, WeeklyProblemSummary } from '../../types';
import { AssetReportView } from './AssetReportView';
import { ITReportView } from './ITReportView';

interface ExecutiveReportProps {
  tickets: ITTicket[];
  assets: Asset[];
  transfers: TransferForm[];
  technicians: TechnicianMetric[];
  branches: Branch[];
  departments: Department[];
  weeklyProblems: WeeklyProblemSummary[];
  defaultReportTab?: 'ASSET' | 'IT';
}

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({
  tickets,
  assets,
  transfers,
  technicians,
  branches,
  departments,
  weeklyProblems,
  defaultReportTab = 'ASSET',
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'ASSET' | 'IT'>(defaultReportTab);

  return (
    <div className="space-y-6">
      {/* Top Main Navigation for Separated Reports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10121a] p-3 rounded-2xl border border-zinc-800/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#090b10] p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveReportTab('ASSET')}
            className={`flex items-center justify-between sm:justify-start gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeReportTab === 'ASSET'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 shrink-0" />
              <span>1. รายงานสรุปทรัพย์สิน (Asset Reports)</span>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">
              {assets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveReportTab('IT')}
            className={`flex items-center justify-between sm:justify-start gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeReportTab === 'IT'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 shrink-0" />
              <span>2. รายงานแจ้งซ่อม IT & ประเมิน KPI</span>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800">
              {tickets.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-zinc-400 hidden lg:flex items-center gap-2 px-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ระบบรายงานแยกหมวดหมู่ตามมาตรฐานการควบคุมภายใน ISO 27001</span>
        </div>
      </div>

      {/* Render Selected Report View */}
      {activeReportTab === 'ASSET' ? (
        <AssetReportView
          assets={assets}
          branches={branches}
          departments={departments}
        />
      ) : (
        <ITReportView
          tickets={tickets}
          technicians={technicians}
          weeklyProblems={weeklyProblems}
        />
      )}
    </div>
  );
};
