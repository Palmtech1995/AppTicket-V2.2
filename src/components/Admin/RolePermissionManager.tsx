/**
 * ============================================================================
 * [MODULE: RBAC ROLE & PERMISSION MATRIX MANAGER]
 * File: /src/components/Admin/RolePermissionManager.tsx
 * Description: Interactive Access Control matrix for configuring fine-grained
 *              permissions across ADMIN, IT, ACC, MANAGER, and USER roles.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Granular Access Toggles: กำหนดสิทธิ์รายเมนู (ดู, สร้าง, แก้ไข, ลบ, อนุมัติ, ส่งออก)
 * 2. 5 Role Profiles: ปรับแต่งสิทธิ์เฉพาะของแต่ละแผนกและลำดับชั้น
 * 3. Default Role Reset: คืนค่าสิทธิ์มาตรฐานตามนโยบายความปลอดภัยขององค์กร
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Shield,
  Check,
  RotateCcw,
  Save,
  Lock,
  Eye,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  Info,
} from 'lucide-react';
import { RolePermissionConfig, SystemRolePermissions, UserRole } from '../../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../../data/initialData';

interface RolePermissionManagerProps {
  permissions: SystemRolePermissions;
  onSavePermissions: (perms: SystemRolePermissions) => void;
}

export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  permissions,
  onSavePermissions,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('IT');
  const [currentPermissions, setCurrentPermissions] = useState<SystemRolePermissions>(permissions);
  const [isSaved, setIsSaved] = useState(false);

  const activeConfig = currentPermissions[selectedRole];

  const handleToggle = (key: keyof RolePermissionConfig) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [key]: !prev[selectedRole][key],
      },
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSavePermissions(currentPermissions);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetRole = () => {
    if (confirm(`คืนค่าสิทธิ์เริ่มต้นสำหรับ Role ${selectedRole}?`)) {
      setCurrentPermissions((prev) => ({
        ...prev,
        [selectedRole]: { ...DEFAULT_ROLE_PERMISSIONS[selectedRole] },
      }));
      setIsSaved(false);
    }
  };

  const roleLabels: Record<UserRole, { title: string; desc: string; color: string }> = {
    ADMIN: {
      title: 'ADMIN (ผู้ดูแลระบบสูงสุด)',
      desc: 'เข้าถึงได้ทุกฟังก์ชัน ทั้งการจัดการข้อมูลหลัก การกำหนดสิทธิ์ และการปรับฟอร์ม',
      color: 'border-red-600 text-red-400 bg-red-950/40',
    },
    IT: {
      title: 'IT SPECIALIST (ฝ่ายไอที / ช่างเทคนิค)',
      desc: 'ตรวจรับทรัพย์สิน, จัดการ Service Desk, ลงบันทึกค่าซ่อม, อนุมัติ Step 1',
      color: 'border-cyan-600 text-cyan-400 bg-cyan-950/40',
    },
    MANAGER: {
      title: 'MANAGER (ผู้จัดการฝ่าย)',
      desc: 'อนุมัติการโอนย้าย Step 2 ของฝ่ายต้นทาง/ปลายทาง, ดูรายงานภาพรวม',
      color: 'border-amber-600 text-amber-400 bg-amber-950/40',
    },
    ACC: {
      title: 'ACC ACCOUNTING (ฝ่ายบัญชี / การเงิน)',
      desc: 'ตัดจำหน่าย, บันทึกทะเบียนทรัพย์สิน, อนุมัติการโอนย้าย Step 3 Final',
      color: 'border-emerald-600 text-emerald-400 bg-emerald-950/40',
    },
    USER: {
      title: 'USER (พนักงานทั่วไป)',
      desc: 'ยื่นคำขอแจ้งซ่อม IT, ดูรายการทรัพย์สินของตนเอง, สร้างใบโอนย้าย',
      color: 'border-zinc-600 text-zinc-300 bg-zinc-800/40',
    },
  };

  const permissionGroups = [
    {
      groupTitle: '1. ระบบจัดการทรัพย์สิน (Asset Management)',
      items: [
        { key: 'canViewAssets' as const, label: 'ดูรายการทรัพย์สิน (View Assets)' },
        { key: 'canCreateAsset' as const, label: 'เพิ่มทรัพย์สินใหม่ (Create Asset)' },
        { key: 'canEditAsset' as const, label: 'แก้ไขข้อมูลทรัพย์สิน (Edit Asset Details)' },
        { key: 'canDeleteAsset' as const, label: 'ลบ / ตัดจำหน่ายทรัพย์สิน (Delete / Retire Asset)' },
      ],
    },
    {
      groupTitle: '2. ระบบใบโอนย้าย & การอนุมัติ (Transfer Forms & 3-Step Approval)',
      items: [
        { key: 'canViewTransfers' as const, label: 'ดูรายการใบโอนย้าย (View Transfer Forms)' },
        { key: 'canCreateTransfer' as const, label: 'สร้างใบส่งมอบ/โอนย้าย (Create Transfer Form)' },
        { key: 'canApproveStep1' as const, label: 'อนุมัติ Step 1: ฝ่ายไอที / ตรวจสอบ (IT Verification)' },
        { key: 'canApproveStep2' as const, label: 'อนุมัติ Step 2: ผู้จัดการฝ่าย (Manager Endorsement)' },
        { key: 'canApproveStep3' as const, label: 'อนุมัติ Step 3: ฝ่ายบัญชี/การเงิน (ACC Final Approval)' },
      ],
    },
    {
      groupTitle: '3. ระบบแจ้งซ่อม IT & Service Desk',
      items: [
        { key: 'canViewTickets' as const, label: 'ดูรายการใบแจ้งซ่อม IT (View Tickets)' },
        { key: 'canCreateTicket' as const, label: 'เปิดใบแจ้งซ่อมใหม่ (Submit IT Ticket)' },
        { key: 'canAssignTicket' as const, label: 'มอบหมายช่างผู้รับผิดชอบ (Assign Technician)' },
        { key: 'canResolveTicket' as const, label: 'อัปเดตสถานะและปิดงานซ่อม (Resolve & Close Ticket)' },
        { key: 'canEditRepairCost' as const, label: 'บันทึกค่าใช้จ่ายและศูนย์บริการ (Edit Repair Cost & Vendor)' },
      ],
    },
    {
      groupTitle: '4. ระบบรายงานและการส่งออก (Reports & Analytics)',
      items: [
        { key: 'canViewReports' as const, label: 'เข้าถึงหน้ารายงานผู้บริหาร (Executive Reports)' },
        { key: 'canExportReports' as const, label: 'ส่งออกข้อมูลเป็น Excel / PDF (Export Data)' },
        { key: 'canViewKPIScorecard' as const, label: 'ดูสรุปประเมินผล KPI ช่างเทคนิครายคน (KPI Scorecard)' },
      ],
    },
    {
      groupTitle: '5. ระบบจัดการระบบหลังบ้าน (Admin & Governance)',
      items: [
        { key: 'canAccessBackend' as const, label: 'เข้าถึงเมนู Backend Master Data' },
        { key: 'canManageRoles' as const, label: 'ปรับแต่งและแก้ไขสิทธิ์ Role Matrix' },
        { key: 'canManageFormConfig' as const, label: 'แก้ไขการตั้งค่าแบบฟอร์ม (Form Adjustment)' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Save Bar */}
      <div className="bg-[#161824] border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>กำหนดสิทธิ์การเข้าถึงฟังก์ชันของแต่ละ Role (Role-Based Access Control)</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            ควบคุมการเปิด/ปิดสิทธิ์การใช้งานของแต่ละบทบาทในองค์กรตามข้อกำหนดความปลอดภัย
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetRole}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น Role นี้</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'บันทึกเรียบร้อย!' : 'บันทึกการตั้งค่าสิทธิ์'}</span>
          </button>
        </div>
      </div>

      {/* Role Selection Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {(['ADMIN', 'IT', 'MANAGER', 'ACC', 'USER'] as UserRole[]).map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`p-3.5 rounded-xl text-left border transition-all ${
              selectedRole === role
                ? roleLabels[role].color + ' shadow-md ring-2 ring-cyan-500/40 font-bold'
                : 'bg-[#11131a] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <div className="text-xs font-mono">{role}</div>
            <div className="text-[11px] truncate mt-0.5 opacity-90">
              {role === 'ADMIN' ? 'Admin สูงสุด' : role === 'IT' ? 'IT Specialist' : role === 'MANAGER' ? 'ผู้จัดการฝ่าย' : role === 'ACC' ? 'ฝ่ายบัญชี' : 'User ทั่วไป'}
            </div>
          </button>
        ))}
      </div>

      {/* Role Description Callout */}
      <div className="bg-[#10121a] p-4 rounded-xl border border-zinc-800 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">{roleLabels[selectedRole].title}:</span>{' '}
          <span className="text-zinc-400">{roleLabels[selectedRole].desc}</span>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {permissionGroups.map((group, gIdx) => (
          <div
            key={gIdx}
            className={`bg-[#12141e] border border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-sm ${
              gIdx === permissionGroups.length - 1 ? 'md:col-span-2' : ''
            }`}
          >
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide border-b border-zinc-800/80 pb-2">
              {group.groupTitle}
            </h3>

            <div className="space-y-2.5">
              {group.items.map((item) => {
                const isEnabled = !!activeConfig[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs text-left ${
                      isEnabled
                        ? 'bg-cyan-950/30 border-cyan-700/60 text-white'
                        : 'bg-[#0e1017] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isEnabled ? 'bg-cyan-500 text-zinc-950 font-bold' : 'border border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={isEnabled ? 'font-medium' : ''}>{item.label}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isEnabled ? 'bg-cyan-900/60 text-cyan-300' : 'bg-zinc-800 text-zinc-600'
                      }`}
                    >
                      {isEnabled ? 'ALLOWED' : 'DENIED'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
