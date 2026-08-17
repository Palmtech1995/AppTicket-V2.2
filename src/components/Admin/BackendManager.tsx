/**
 * ============================================================================
 * [MODULE: ENTERPRISE ADMINISTRATION & SETTINGS HUB]
 * File: /src/components/Admin/BackendManager.tsx
 * Description: Master Administration Hub housing Staff Management, Role Matrix,
 *              Branches, Departments, MySQL Database Hub, System Manual, and Form Config.
 * 
 * [แถบย่อยหลัก (Sub-Tabs)]:
 * 1. staff: จัดการรายชื่อพนักงาน, รหัสผ่าน, แผนก, สาขา และสิทธิ์
 * 2. roles: กำหนด Role Permissions Matrix (RolePermissionManager)
 * 3. branches: จัดการข้อมูลสาขาและที่อยู่สำหรับออกเอกสาร
 * 4. departments: จัดการรหัสแผนกภายในบริษัท
 * 5. mysql: ศูนย์ควบคุมฐานข้อมูล MySQL, phpMyAdmin, และ REST API Sync (MySQLManager)
 * 6. manual: ศูนย์คู่มือระบบ, ตัวสร้างรายงาน PDF และคู่มือ WordPress Plugin (SystemManual)
 * 7. sheets: Google Sheets Sync URL
 * 8. formAdjustment: ปรับแต่งแบบฟอร์มใบโอน A4 และ 9 ลายเซ็น (FormAdjustmentEditor)
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Database,
  Building,
  Users,
  Shield,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle,
  Sliders,
  ShieldCheck,
  Lock,
  Phone,
  MapPin,
  X,
  Check,
  BookOpen,
} from 'lucide-react';
import { Branch, Department, FormAdjustmentConfig, SystemRolePermissions, UserProfile, UserRole, Asset, TransferForm, ITTicket, WeeklyProblemSummary } from '../../types';
import { COMPANY_INFO } from '../../data/initialData';
import { FormAdjustmentEditor } from './FormAdjustmentEditor';
import { RolePermissionManager } from './RolePermissionManager';
import { MySQLManager } from './MySQLManager';
import { SystemManual } from './SystemManual';

interface BackendManagerProps {
  branches: Branch[];
  departments: Department[];
  staffList: UserProfile[];
  formConfig: FormAdjustmentConfig;
  rolePermissions: SystemRolePermissions;
  assets?: Asset[];
  transfers?: TransferForm[];
  tickets?: ITTicket[];
  weeklyProblems?: WeeklyProblemSummary[];
  onSaveStaff: (staff: UserProfile[]) => void;
  onSaveBranches: (branches: Branch[]) => void;
  onSaveDepartments: (depts: Department[]) => void;
  onSaveFormConfig: (config: FormAdjustmentConfig) => void;
  onSaveRolePermissions: (perms: SystemRolePermissions) => void;
  onResetToDefault: () => void;
  onOpenGoogleSheets?: () => void;
  onRefreshData?: () => Promise<any> | void;
}

export const BackendManager: React.FC<BackendManagerProps> = ({
  branches,
  departments,
  staffList,
  formConfig,
  rolePermissions,
  assets = [],
  transfers = [],
  tickets = [],
  weeklyProblems = [],
  onSaveStaff,
  onSaveBranches,
  onSaveDepartments,
  onSaveFormConfig,
  onSaveRolePermissions,
  onResetToDefault,
  onOpenGoogleSheets,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'roles' | 'branches' | 'departments' | 'mysql' | 'manual' | 'sheets' | 'formAdjustment'>('staff');

  // New staff form state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffThai, setNewStaffThai] = useState('');
  const [newStaffId, setNewStaffId] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('USER');
  const [newStaffDept, setNewStaffDept] = useState(departments[0]?.code || 'XT018-IT');
  const [newStaffBranch, setNewStaffBranch] = useState(branches[0]?.code || 'TH100');

  // New branch form state
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchTaxId, setNewBranchTaxId] = useState('0105562000000');

  // New department form state
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptNameEn, setNewDeptNameEn] = useState('');

  // Add Staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffId) return;

    const dept = departments.find((d) => d.code === newStaffDept);
    const branch = branches.find((b) => b.code === newStaffBranch);

    const newProfile: UserProfile = {
      id: `u-${Date.now()}`,
      staffId: newStaffId.trim(),
      username: newStaffId.trim().toLowerCase(),
      password: 'Lemony2026',
      isFirstLogin: true,
      name: newStaffName.trim(),
      thaiName: newStaffThai.trim() || newStaffName.trim(),
      email: `${newStaffName.toLowerCase().replace(/\s+/g, '')}@xingtai.co.th`,
      role: newStaffRole,
      departmentCode: newStaffDept,
      departmentName: dept?.name || newStaffDept,
      branchCode: newStaffBranch,
      branchName: branch?.name || newStaffBranch,
    };

    onSaveStaff([...staffList, newProfile]);
    setShowAddStaff(false);
    setNewStaffName('');
    setNewStaffThai('');
    setNewStaffId('');
  };

  // Delete Staff
  const handleDeleteStaff = (id: string) => {
    if (confirm('ยืนยันการลบพนักงานออกจากระบบ?')) {
      onSaveStaff(staffList.filter((s) => s.id !== id));
    }
  };

  // Add Branch
  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchCode || !newBranchName) return;

    const code = newBranchCode.trim().toUpperCase();
    if (branches.some((b) => b.code.toUpperCase() === code)) {
      alert('รหัสสาขานี้มีอยู่ในระบบแล้ว');
      return;
    }

    const newB: Branch = {
      code,
      name: newBranchName.trim(),
      address: newBranchAddress.trim() || 'ประเทศไทย',
      phone: newBranchPhone.trim() || '-',
      taxId: newBranchTaxId.trim() || '0105562000000',
    };

    onSaveBranches([...branches, newB]);
    setShowAddBranch(false);
    setNewBranchCode('');
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    setNewBranchTaxId('0105562000000');
  };

  // Delete Branch
  const handleDeleteBranch = (code: string) => {
    if (branches.length <= 1) {
      alert('ระบบต้องมีอย่างน้อย 1 สาขา');
      return;
    }
    if (confirm(`ยืนยันการลบสาขา ${code}?`)) {
      onSaveBranches(branches.filter((b) => b.code !== code));
    }
  };

  // Add Department
  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode || !newDeptName) return;

    const code = newDeptCode.trim().toUpperCase();
    if (departments.some((d) => d.code.toUpperCase() === code)) {
      alert('รหัสแผนกนี้มีอยู่ในระบบแล้ว');
      return;
    }

    const newD: Department = {
      code,
      name: newDeptName.trim(),
      nameEn: newDeptNameEn.trim() || newDeptName.trim(),
    };

    onSaveDepartments([...departments, newD]);
    setShowAddDept(false);
    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptNameEn('');
  };

  // Delete Department
  const handleDeleteDept = (code: string) => {
    if (departments.length <= 1) {
      alert('ระบบต้องมีอย่างน้อย 1 แผนก');
      return;
    }
    if (confirm(`ยืนยันการลบแผนก ${code}?`)) {
      onSaveDepartments(departments.filter((d) => d.code !== code));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            SYSTEM ADMINISTRATION & MASTER DATA
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Backend Master Data & RBAC
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            จัดการข้อมูลหลัก ฐานข้อมูลพนักงาน สาขา แผนก สิทธิ์การเข้าถึง (Role Permissions) และแบบฟอร์ม
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นจากโรงงานหรือไม่?')) {
              onResetToDefault();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 rounded-xl text-xs font-semibold transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเซ็ตข้อมูลเริ่มต้น (Factory Reset)</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-zinc-800 bg-[#12141a] rounded-t-2xl px-2 pt-2 gap-1">
        <button
          onClick={() => setActiveSubTab('staff')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'staff'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 shadow-[inset_0_-2px_0_rgba(34,211,238,1)]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>พนักงาน & ผู้ใช้งาน ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roles')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'roles'
              ? 'border-purple-400 text-purple-400 bg-purple-950/20 shadow-[inset_0_-2px_0_rgba(192,132,252,1)]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="font-bold">สิทธิ์แต่ละ Role (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branches')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'branches'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 shadow-[inset_0_-2px_0_rgba(34,211,238,1)]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>สาขา ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('departments')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'departments'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20 shadow-[inset_0_-2px_0_rgba(52,211,153,1)]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>แผนก ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mysql')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'mysql'
              ? 'border-blue-400 text-blue-400 bg-blue-950/30 shadow-[inset_0_-2px_0_rgba(96,165,250,1)]'
              : 'border-transparent text-zinc-400 hover:text-blue-300'
          }`}
        >
          <Database className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-white">phpMyAdmin & MySQL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('manual')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'manual'
              ? 'border-red-400 text-red-400 bg-red-950/30 shadow-[inset_0_-2px_0_rgba(248,113,113,1)]'
              : 'border-transparent text-zinc-400 hover:text-red-300'
          }`}
        >
          <BookOpen className="w-4 h-4 text-red-400" />
          <span className="font-bold text-white">คู่มือ & WordPress PDF</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sheets')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'sheets'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Sheets</span>
        </button>

        <button
          onClick={() => setActiveSubTab('formAdjustment')}
          className={`py-3 px-3.5 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeSubTab === 'formAdjustment'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 shadow-[inset_0_-2px_0_rgba(34,211,238,1)]'
              : 'border-transparent text-zinc-400 hover:text-cyan-300'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white">จัดหน้าแบบฟอร์ม (A4)</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-b-2xl p-6 shadow-sm">
        {/* SUBTAB 1: STAFF & USERS */}
        {activeSubTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">ผังผู้ใช้งานและรหัสผ่านเข้าสู่ระบบ (User Directory)</h2>
                <p className="text-xs text-zinc-400">
                  กำหนดบทบาท Admin, IT Specialist, Manager, ACC Accounting หรือ User ทั่วไป (รหัสเริ่มต้น: Lemony2026)
                </p>
              </div>

              <button
                onClick={() => setShowAddStaff(!showAddStaff)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มพนักงานใหม่</span>
              </button>
            </div>

            {/* Add Staff form */}
            {showAddStaff && (
              <form onSubmit={handleAddStaff} className="bg-[#161824] p-5 rounded-2xl border border-cyan-700/60 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>ลงทะเบียนพนักงานและสร้างบัญชีผู้ใช้งานใหม่</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">รหัสพนักงาน (Staff ID) *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น IT-270101"
                      value={newStaffId}
                      onChange={(e) => setNewStaffId(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">ชื่อ-นามสกุล (อังกฤษ) *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น Jason Chen"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">ชื่อ-นามสกุล (ไทย)</label>
                    <input
                      type="text"
                      placeholder="เช่น นายเจิน ชิน"
                      value={newStaffThai}
                      onChange={(e) => setNewStaffThai(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">สิทธิ์ในระบบ (Role) *</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    >
                      <option value="USER">USER (ผู้ใช้งานทั่วไป)</option>
                      <option value="IT">IT (ฝ่ายไอที / ช่าง)</option>
                      <option value="MANAGER">MANAGER (ผู้จัดการฝ่าย)</option>
                      <option value="ACC">ACC (ฝ่ายบัญชี)</option>
                      <option value="ADMIN">ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">แผนก</label>
                    <select
                      value={newStaffDept}
                      onChange={(e) => setNewStaffDept(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    >
                      {departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">สาขาประจำ</label>
                    <select
                      value={newStaffBranch}
                      onChange={(e) => setNewStaffBranch(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    >
                      {branches.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 bg-[#0c0e14] p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-cyan-400 font-semibold">หมายเหตุ:</span> บัญชีพนักงานใหม่จะมีรหัสผ่านเริ่มต้นคือ{' '}
                  <span className="font-mono font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded">Lemony2026</span>{' '}
                  และระบบจะบังคับให้พนักงานเปลี่ยนรหัสผ่านทันทีเมื่อเข้าสู่ระบบครั้งแรก
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    บันทึกข้อมูลพนักงาน
                  </button>
                </div>
              </form>
            )}

            {/* Staff list table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead>
                  <tr className="bg-[#0f1116] border-b border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase">
                    <th className="py-3 px-3">STAFF ID</th>
                    <th className="py-3 px-3">NAME (THAI & ENG)</th>
                    <th className="py-3 px-3">DEPARTMENT</th>
                    <th className="py-3 px-3">BRANCH</th>
                    <th className="py-3 px-3">ROLE PERMISSION</th>
                    <th className="py-3 px-3 text-center">PASSWORD STATUS</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-[#161822]">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">{s.staffId}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{s.thaiName || s.name}</div>
                        <div className="text-[11px] text-zinc-400">{s.name} ({s.email})</div>
                      </td>
                      <td className="py-3 px-3">{s.departmentName || s.departmentCode}</td>
                      <td className="py-3 px-3 text-zinc-400">{s.branchName || s.branchCode}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                          s.role === 'ADMIN' ? 'bg-red-950 text-red-400 border border-red-800' :
                          s.role === 'IT' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                          s.role === 'ACC' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          s.role === 'MANAGER' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-zinc-800 text-zinc-300'
                        }`}>
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          s.isFirstLogin === false
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {s.isFirstLogin === false ? 'Custom PW Set' : 'Default Lemony2026'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {s.id !== 'u-admin' && (
                          <button
                            onClick={() => handleDeleteStaff(s.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded"
                            title="ลบพนักงาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: ROLE-BASED ACCESS CONTROL (RBAC) */}
        {activeSubTab === 'roles' && (
          <RolePermissionManager
            permissions={rolePermissions}
            onSavePermissions={onSaveRolePermissions}
          />
        )}

        {/* SUBTAB 3: BRANCHES */}
        {activeSubTab === 'branches' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">สาขาและคลังกระจายสินค้า (Company Branches & Hubs)</h2>
                <p className="text-xs text-zinc-400">
                  จัดการรายชื่อสาขา ข้อมูลที่อยู่ และเบอร์ติดต่อ สำหรับการจัดสรรและโอนย้ายทรัพย์สิน
                </p>
              </div>

              <button
                onClick={() => setShowAddBranch(!showAddBranch)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มสาขาใหม่ (Add Branch)</span>
              </button>
            </div>

            {/* Add Branch Form */}
            {showAddBranch && (
              <form onSubmit={handleAddBranch} className="bg-[#161824] p-5 rounded-2xl border border-cyan-700/60 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-cyan-400" />
                    <span>เพิ่มสาขา / ศูนย์กระจายสินค้าใหม่</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBranch(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">รหัสสาขา (Branch Code) *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น TH102, WH-CHON"
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">ชื่อสาขา (Branch Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สำนักงานสาขาชลบุรี (อมตะ)"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      placeholder="เช่น 038-123456"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 text-xs">ที่อยู่สาขา / สถานที่ตั้ง</label>
                  <input
                    type="text"
                    placeholder="เช่น นิคมอุตสาหกรรมอมตะซิตี้ จ.ชลบุรี"
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddBranch(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    บันทึกสาขาใหม่
                  </button>
                </div>
              </form>
            )}

            {/* Branches Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b) => (
                <div key={b.code} className="bg-[#161824] p-4 rounded-2xl border border-zinc-800 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
                      {b.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">{b.phone || '-'}</span>
                      {branches.length > 1 && (
                        <button
                          onClick={() => handleDeleteBranch(b.code)}
                          className="text-zinc-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="ลบสาขา"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{b.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-500 mt-0.5" />
                      <span>{b.address}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: DEPARTMENTS */}
        {activeSubTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">แผนกภายในองค์กร (Company Departments)</h2>
                <p className="text-xs text-zinc-400">
                  จัดการรหัสแผนก ชื่อภาษาไทย และภาษาอังกฤษ สำหรับการระบุฝ่ายผู้โอน/ผู้รับมอบ
                </p>
              </div>

              <button
                onClick={() => setShowAddDept(!showAddDept)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มแผนกใหม่ (Add Department)</span>
              </button>
            </div>

            {/* Add Dept Form */}
            {showAddDept && (
              <form onSubmit={handleAddDept} className="bg-[#161824] p-5 rounded-2xl border border-emerald-700/60 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>เพิ่มแผนกงานใหม่ภายในองค์กร</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddDept(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">รหัสแผนก (Dept Code) *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น XT025-HR, XT030-QC"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">ชื่อแผนกภาษาไทย (Dept Name TH) *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น แผนกทรัพยากรบุคคล"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">ชื่อแผนกภาษาอังกฤษ (Dept Name EN)</label>
                    <input
                      type="text"
                      placeholder="เช่น Human Resources Department"
                      value={newDeptNameEn}
                      onChange={(e) => setNewDeptNameEn(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2.5 text-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddDept(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    บันทึกแผนกใหม่
                  </button>
                </div>
              </form>
            )}

            {/* Departments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((d) => (
                <div key={d.code} className="bg-[#161824] p-4 rounded-2xl border border-zinc-800 space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                      {d.code}
                    </span>
                    {departments.length > 1 && (
                      <button
                        onClick={() => handleDeleteDept(d.code)}
                        className="text-zinc-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="ลบแผนก"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mt-1">{d.name}</div>
                    <div className="text-xs text-zinc-400">{d.nameEn}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: MYSQL & PHPMYADMIN */}
        {activeSubTab === 'mysql' && (
          <MySQLManager
            branches={branches}
            departments={departments}
            staffList={staffList}
            assets={assets}
            transfers={transfers}
            tickets={tickets}
            weeklyProblems={weeklyProblems}
            formConfig={formConfig}
            rolePermissions={rolePermissions}
            onRefreshData={onRefreshData}
          />
        )}

        {/* SUBTAB: SYSTEM MANUAL & WORDPRESS GUIDE (PDF) */}
        {activeSubTab === 'manual' && (
          <SystemManual />
        )}

        {/* SUBTAB 5: GOOGLE SHEETS */}
        {activeSubTab === 'sheets' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Google Sheets Master Integration (Live & OAuth)</h2>
                  <p className="text-xs text-zinc-400">
                    ระบบผูกข้อมูลหลักเข้ากับ Google Sheets ของ บริษัท ซิงไท่ เทรดดิ้ง จำกัด รองรับ OAuth 2.0 สองทาง
                  </p>
                </div>
              </div>

              {onOpenGoogleSheets && (
                <button
                  onClick={onOpenGoogleSheets}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>🚀 เปิดเครื่องมือซิงค์ Google Sheets (OAuth Sync)</span>
                </button>
              )}
            </div>

            <div className="bg-[#161824] p-5 rounded-2xl border border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Default Company Connected Sheet:
                </div>
                <a
                  href="https://docs.google.com/spreadsheets/d/1IICAGgHi3Lfivu3NnCrIcIlRF1o82KfforwB0t4zsz0/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>เปิด Google Sheets ต้นฉบับ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="bg-[#101217] p-3 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300 break-all">
                https://docs.google.com/spreadsheets/d/1IICAGgHi3Lfivu3NnCrIcIlRF1o82KfforwB0t4zsz0/edit?usp=sharing
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300 pt-2">
                <div className="bg-[#101217] p-3 rounded-lg border border-zinc-800">
                  <strong className="text-white block mb-1">Sheet1: ข้อมูลทรัพย์สินทั้งหมด (Asset_Inventory)</strong>
                  <p className="text-zinc-400">
                    บรรจุรหัสทรัพย์สิน, Item Code, Serial Number, สเปกเครื่อง, ราคาต้นทุน, วันที่จัดซื้อ และผู้ถือครอง
                  </p>
                </div>
                <div className="bg-[#101217] p-3 rounded-lg border border-zinc-800">
                  <strong className="text-white block mb-1">Sheet2: ข้อมูลใบแจ้งซ่อม & งาน IT (IT_Tickets)</strong>
                  <p className="text-zinc-400">
                    บรรจุหมายเลขแจ้งซ่อม, ปัญหา, ช่างผู้รับผิดชอบ, สถานะ, ค่าซ่อม, และประวัติการแก้ไข
                  </p>
                </div>
                <div className="bg-[#101217] p-3 rounded-lg border border-zinc-800">
                  <strong className="text-white block mb-1">Sheet3: บันทึกการโอนย้าย (Transfer_Handover)</strong>
                  <p className="text-zinc-400">
                    บรรจุเลขที่ใบโอน A4, แผนกต้นทาง-ปลายทาง, ผู้ส่งมอบ-ผู้รับมอบ, และสถานะอนุมัติ 3 ฝ่าย
                  </p>
                </div>
                <div className="bg-[#101217] p-3 rounded-lg border border-zinc-800">
                  <strong className="text-white block mb-1">Sheet4: สรุปภาพรวมและ KPI (Summary_Report)</strong>
                  <p className="text-zinc-400">
                    สรุปมูลค่าสินทรัพย์รวม, จำนวนอุปกรณ์แยกตามสาขา, และสถิติงานซ่อมประจำรอบ
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: FORM ADJUSTMENT */}
        {activeSubTab === 'formAdjustment' && (
          <FormAdjustmentEditor
            config={formConfig}
            onSaveConfig={onSaveFormConfig}
          />
        )}
      </div>
    </div>
  );
};
