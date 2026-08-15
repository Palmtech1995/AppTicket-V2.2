/**
 * ============================================================================
 * [MODULE: SIDEBAR NAVIGATION]
 * File: /src/components/Sidebar.tsx
 * Description: Dynamic Role-based Sidebar with Badge Counters & Xing Tai Branding
 * 
 * [ส่วนที่แก้ไขและพัฒนา]:
 * 1. XingTaiLogo Integration: แสดงโลโก้บริษัทพร้อมเวอร์ชันระบบ
 * 2. RBAC Dynamic Tabs: ซ่อน/แสดงเมนูตามสิทธิ์ (Dashboard, Assets, Transfers, Tickets, Reports, Admin)
 * 3. Badge Indicators: แสดงจำนวนใบโอนรอดำเนินการ (Pending Transfers) และ Tickets ที่เปิดอยู่
 * 4. User Role Badge: แสดงบทบาทและคำอธิบายสิทธิ์ปัจจุบันที่แถบด้านล่าง
 * ============================================================================
 */

import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Ticket,
  FileCheck2,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Shield,
  Layers,
  Database,
  X,
} from 'lucide-react';
import { RolePermissionConfig, SystemRolePermissions, UserRole } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/initialData';
import { XingTaiLogo } from './Common/XingTaiLogo';

export type NavTab = 'dashboard' | 'assets' | 'transfers' | 'tickets' | 'reports' | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  rolePermissions?: SystemRolePermissions;
  onOpenNewTicket: () => void;
  pendingTransfersCount: number;
  openTicketsCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  rolePermissions,
  onOpenNewTicket,
  pendingTransfersCount,
  openTicketsCount,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const currentPerms: RolePermissionConfig =
    rolePermissions?.[userRole] || DEFAULT_ROLE_PERMISSIONS[userRole] || DEFAULT_ROLE_PERMISSIONS.USER;

  const isRegularUser = userRole === 'USER';
  const isAdmin = userRole === 'ADMIN';

  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      thaiLabel: 'แดชบอร์ดหลัก',
      icon: LayoutDashboard,
      allowed: currentPerms.canViewAssets || currentPerms.canViewTickets,
    },
    {
      id: 'assets' as NavTab,
      label: 'Assets',
      thaiLabel: 'ทะเบียนทรัพย์สิน & Bincard',
      icon: Boxes,
      allowed: currentPerms.canViewAssets,
    },
    {
      id: 'transfers' as NavTab,
      label: 'Transfers',
      thaiLabel: 'ใบโอนย้าย / ใบส่งมอบ',
      icon: FileCheck2,
      badge: pendingTransfersCount > 0 ? pendingTransfersCount : undefined,
      allowed: currentPerms.canViewTransfers || currentPerms.canCreateTransfer,
    },
    {
      id: 'tickets' as NavTab,
      label: 'IT Tickets',
      thaiLabel: isRegularUser ? 'แจ้งซ่อม IT (Helpdesk)' : 'ระบบแจ้งซ่อม & งาน IT',
      icon: Ticket,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
      allowed: currentPerms.canViewTickets || currentPerms.canCreateTicket,
    },
    {
      id: 'reports' as NavTab,
      label: 'Analytics & Reports',
      thaiLabel: 'รายงานผู้บริหาร ย้อนหลัง 3 เดือน',
      icon: BarChart3,
      allowed: currentPerms.canViewAssetReports || currentPerms.canViewITReports,
    },
    {
      id: 'admin' as NavTab,
      label: 'Backend Master Data',
      thaiLabel: 'จัดการข้อมูลหลังบ้าน & สาขา',
      icon: Database,
      allowed: currentPerms.canManageBackend || isAdmin,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0c10] border-r border-zinc-800/80 flex flex-col justify-between h-screen text-zinc-300 select-none shrink-0 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-4 border-b border-zinc-800/60 bg-zinc-950/40 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XingTaiLogo size="sm" textColor="white" />
              </div>
              {onCloseMobile && (
                <button
                  onClick={onCloseMobile}
                  className="lg:hidden p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Close Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-2 text-[10px] text-zinc-400 font-sans flex items-center justify-between">
              <span>บจก. ซิงไท่ เทรดดิ้ง (ประเทศไทย)</span>
              <span className="font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">v2.4</span>
            </div>
          </div>

          {/* Action Button: "+ New Ticket" */}
          {currentPerms.canCreateTicket && (
            <div className="p-4">
              <button
                id="sidebar-new-ticket-btn"
                onClick={() => {
                  onOpenNewTicket();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full bg-gradient-to-b from-zinc-100 to-zinc-300 hover:from-white hover:to-zinc-200 text-zinc-900 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 text-zinc-800" strokeWidth={2.5} />
                <span>+ แจ้งซ่อม / New Ticket</span>
              </button>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="px-3 space-y-1 mt-1">
            {menuItems
              .filter((item) => item.allowed)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-400'
                        }`}
                      />
                      <div className="text-left">
                        <div className="leading-tight">{item.label}</div>
                        <div className="text-[10px] text-zinc-500">{item.thaiLabel}</div>
                      </div>
                    </div>

                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Role Notice & Bottom Info */}
        <div className="p-4 border-t border-zinc-800/60 space-y-3">
          {/* User Role Reminder */}
          <div className="bg-[#12151c] p-3 rounded-lg border border-zinc-800 text-[11px]">
            <div className="text-zinc-400 flex items-center justify-between">
              <span className="font-semibold text-zinc-300">สิทธิ์ใช้งาน:</span>
              <span className="text-cyan-400 font-mono font-bold">{userRole}</span>
            </div>
            <p className="text-zinc-500 text-[10px] mt-1">
              {isRegularUser && 'เฉพาะแบบฟอร์มแจ้งซ่อมและประวัติงานตนเอง'}
              {isAdmin && 'สิทธิ์สูงสุด เข้าถึงและปรับแต่งข้อมูลหลังบ้านได้'}
              {userRole === 'MANAGER' && 'สิทธิ์ผู้อนุมัติฝ่าย (Manager Approve)'}
              {userRole === 'IT' && 'สิทธิ์ฝ่ายไอที มอบหมายงาน บันทึกค่าซ่อม และส่งมอบ'}
              {userRole === 'ACC' && 'สิทธิ์ฝ่ายบัญชี ตรวจสอบ Bincard และอนุมัติ ACC'}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[11px]">ISO / RBAC Security</span>
            </div>
            <span className="text-[10px] font-mono">Xing Tai 2026</span>
          </div>
        </div>
      </aside>
    </>
  );
};
