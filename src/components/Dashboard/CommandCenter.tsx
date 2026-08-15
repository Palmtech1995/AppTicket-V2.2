/**
 * ============================================================================
 * [MODULE: EXECUTIVE COMMAND CENTER & IT METRICS DASHBOARD]
 * File: /src/components/Dashboard/CommandCenter.tsx
 * Description: Real-time enterprise telemetry dashboard displaying asset health,
 *              IT Ticket SLAs, technician workloads, and transfer bottlenecks.
 * 
 * [ตัวชี้วัดสำคัญ (KPIs)]:
 * 1. SLA & Ticket Resolution: คำนวณเวลาเฉลี่ยในการปิดงานซ่อม (Avg Resolution Hours)
 * 2. Asset Valuation & Status: สรุปมูลค่าทรัพย์สินรวม, ทรัพย์สินพร้อมใช้งาน (Active), กำลังซ่อม (In Repair)
 * 3. Pending Approval Radar: รายการใบโอนย้ายที่รอการอนุมัติจาก IT, Manager, ACC
 * 4. Critical Ticket Alerts: บอร์ดแจ้งเตือนเคสวิกฤตที่ต้องได้รับการแก้ไขทันที
 * ============================================================================
 */

import React from 'react';
import {
  AlertTriangle,
  Layers,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  HardDrive,
  Wrench,
  FileText,
  Boxes,
  Users,
  Inbox,
} from 'lucide-react';
import { Asset, ITTicket, TechnicianMetric, TransferForm } from '../../types';

interface CommandCenterProps {
  tickets: ITTicket[];
  assets: Asset[];
  transfers: TransferForm[];
  technicians: TechnicianMetric[];
  onSelectTicket: (ticket: ITTicket) => void;
  onNavigateToTransfers: () => void;
  onNavigateToAssets: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  tickets,
  assets,
  transfers,
  technicians,
  onSelectTicket,
  onNavigateToTransfers,
  onNavigateToAssets,
}) => {
  const criticalTickets = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
  
  const avgResolutionHours = resolvedTickets.length > 0
    ? (Number(resolvedTickets.reduce((acc, curr) => acc + (curr.resolutionHours || 0), 0) / resolvedTickets.length)).toFixed(1)
    : '0.0';

  const totalAssetCost = assets.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const maintenanceAssets = assets.filter((a) => a.status === 'MAINTENANCE' || a.status === 'IN_REPAIR');
  const pendingTransfers = transfers.filter((t) => t.status.startsWith('PENDING'));

  // Build live recent activities from real tickets & transfers
  const recentActivities = React.useMemo(() => {
    const events: { id: string; time: string; title: string; subtitle: string; color: string; dateObj: Date }[] = [];

    tickets.slice(0, 4).forEach((t) => {
      events.push({
        id: `ticket-${t.id}`,
        time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'เมื่อสักครู่',
        title: `${t.priority === 'CRITICAL' ? 'Critical: ' : ''}${t.subject}`,
        subtitle: `Ticket #${t.id} • ${t.assignedTechnicianName ? `Assigned to ${t.assignedTechnicianName}` : 'Unassigned'}`,
        color: t.priority === 'CRITICAL' ? 'bg-red-400' : t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-emerald-400' : 'bg-cyan-400',
        dateObj: new Date(t.createdAt || Date.now()),
      });
    });

    transfers.slice(0, 3).forEach((tr) => {
      events.push({
        id: `transfer-${tr.id}`,
        time: tr.transferDate ? new Date(tr.transferDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'เมื่อสักครู่',
        title: `Transfer Form ${tr.formNumber || tr.id} (${tr.status})`,
        subtitle: `Asset: ${tr.assetName} • Moving to ${tr.destBranchName || tr.destBranchCode}`,
        color: tr.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400',
        dateObj: new Date(tr.createdAt || tr.transferDate || Date.now()),
      });
    });

    events.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    return events.slice(0, 5);
  }, [tickets, transfers]);

  return (
    <div className="space-y-6">
      {/* Header section matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            TICKET ADMINISTRATION & ASSET OPS
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Command Center
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono font-normal">
              Xing Tai Trading
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#12151c] border border-zinc-800 px-3 py-1.5 rounded-full text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE DATABASE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Top Metric Cards matching Image 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Critical P0/P1 */}
        <div className="bg-[#12141a] border border-zinc-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-red-900/60 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono tracking-wider uppercase text-red-400 font-semibold flex items-center gap-1.5">
              CRITICAL P0 / P1
            </span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white font-mono">{criticalTickets.length}</span>
            <span className="text-xs text-zinc-400 font-mono">
              {criticalTickets.length > 0 ? 'Urgent Response Required' : 'All systems nominal'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            ต้องเร่งแก้ไขทันที กระทบระบบงานสาขาหลัก
          </p>
        </div>

        {/* Card 2: Total Open */}
        <div className="bg-[#12141a] border border-zinc-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-300 font-semibold">
              TOTAL OPEN TICKETS
            </span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white font-mono">{openTickets.length}</span>
            <span className="text-xs text-zinc-400 font-mono">Active Queue</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            คิวงานแจ้งซ่อม IT และคำร้องที่อยู่ระหว่างดำเนินการ
          </p>
        </div>

        {/* Card 3: Avg Resolution */}
        <div className="bg-[#12141a] border border-zinc-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-cyan-900/60 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono tracking-wider uppercase text-cyan-400 font-semibold">
              AVG RESOLUTION TIME
            </span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white font-mono">{avgResolutionHours}</span>
            <span className="text-xs text-zinc-400 font-mono">Hours</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            ความเร็วเฉลี่ยในการปิดงานซ่อมของทีมไอที
          </p>
        </div>
      </div>

      {/* Second Row: Asset Quick Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={onNavigateToAssets}
          className="bg-[#101217] border border-zinc-800 p-4 rounded-xl cursor-pointer hover:border-zinc-700 transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] text-zinc-400">ทรัพย์สินทั้งหมดในระบบ</div>
            <div className="text-xl font-bold text-white mt-0.5">{assets.length} ชิ้น</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">มูลค่า ฿{totalAssetCost.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300">
            <Boxes className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div 
          onClick={onNavigateToAssets}
          className="bg-[#101217] border border-zinc-800 p-4 rounded-xl cursor-pointer hover:border-zinc-700 transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] text-zinc-400">ทรัพย์สินส่งซ่อม / ปรับปรุง</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{maintenanceAssets.length} ชิ้น</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">ศูนย์บริการ & Chanintr / Urovo</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={onNavigateToTransfers}
          className="bg-[#101217] border border-zinc-800 p-4 rounded-xl cursor-pointer hover:border-zinc-700 transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] text-zinc-400">ใบโอนย้ายรออนุมัติ (Transfers)</div>
            <div className="text-xl font-bold text-cyan-400 mt-0.5">{pendingTransfers.length} ฉบับ</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">รอ Manager / IT / ACC อนุมัติ</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#101217] border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400">ช่างเทคนิคประจำการ (IT Team)</div>
            <div className="text-xl font-bold text-white mt-0.5">{technicians.length} ท่าน</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">พร้อมรับคิวแจ้งซ่อม</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Technician Workload & Recent Activity (matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Technician Workload */}
        <div className="lg:col-span-7 bg-[#12141a] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Technician Workload</h2>
              <p className="text-xs text-zinc-400">Real-time resource allocation and efficiency metrics.</p>
            </div>
            <span className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1 font-mono">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-4">
            {technicians.length === 0 ? (
              <div className="p-8 text-center bg-[#161820] rounded-lg border border-zinc-800/60 text-zinc-400">
                <Users className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <div className="text-xs text-zinc-300 font-medium">ยังไม่มีข้อมูลช่างเทคนิคที่มอบหมายงาน</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">ระบบจะดึงข้อมูลอัตโนมัติจากผู้ใช้งานฝ่ายไอทีในระบบ</div>
              </div>
            ) : (
              technicians.map((tech) => (
                <div key={tech.id} className="p-3 bg-[#161820] rounded-lg border border-zinc-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-mono font-bold text-xs">
                        {tech.shortCode}
                      </div>
                      <span className="font-semibold text-zinc-200">{tech.name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-zinc-400">
                        Eff: <strong className="text-zinc-200">{tech.efficiency}%</strong>
                      </span>
                      <span className="text-zinc-400">
                        Active: <strong className="text-rose-400">{tech.activeTickets}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Progress bar matching Image 2 */}
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500/80 to-rose-400 transition-all duration-500"
                      style={{ width: `${Math.min((tech.activeTickets / (tickets.length || 1)) * 100, 100)}%` }}
                    />
                    <div
                      className="h-full bg-zinc-600 transition-all duration-500"
                      style={{ width: `${tech.efficiency * 0.4}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Activity Timeline matching Image 2 */}
        <div className="lg:col-span-5 bg-[#12141a] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Recent Activity</h2>
            <p className="text-xs text-zinc-400 mb-4">บันทึกการทำงานสดในระบบไอทีและทรัพย์สิน</p>

            {recentActivities.length === 0 ? (
              <div className="p-8 text-center bg-[#161820] rounded-lg border border-zinc-800/60 text-zinc-400">
                <Inbox className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <div className="text-xs text-zinc-300 font-medium">ยังไม่มีกิจกรรมล่าสุดในระบบ</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">ระบบพร้อมบันทึกการแจ้งซ่อมและการโอนย้ายแบบ Real-time</div>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {recentActivities.map((event) => (
                  <div key={event.id} className="relative pl-6">
                    <span className={`absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full ${event.color} -translate-x-1/2 ring-4 ring-[#12141a]`} />
                    <div className="text-[11px] font-mono text-zinc-400">{event.time}</div>
                    <div className="text-xs text-zinc-200 mt-0.5 font-medium">
                      {event.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                      {event.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800/80 mt-4">
            <button
              onClick={onNavigateToTransfers}
              className="w-full bg-[#161820] hover:bg-[#1f222d] text-zinc-300 hover:text-white border border-zinc-700/60 rounded-lg py-2 text-xs font-medium transition-colors"
            >
              ตรวจสอบประวัติการโอนย้ายทรัพย์สินทั้งหมด →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
