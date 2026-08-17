/**
 * ============================================================================
 * [MODULE: USER PROFILE EDIT MODAL]
 * File: /src/components/Admin/UserEditModal.tsx
 * Description: Modal dialog for editing user details, role permissions,
 *              department/branch assignments, and password reset.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Building,
  Layers,
  Mail,
  KeyRound,
  Check,
  RefreshCw,
  AlertTriangle,
  Save,
  BadgeAlert,
  IdCard,
} from 'lucide-react';
import { Branch, Department, UserProfile, UserRole } from '../../types';

interface UserEditModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  branches: Branch[];
  departments: Department[];
  onClose: () => void;
  onSave: (updatedUser: UserProfile) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  user,
  branches,
  departments,
  onClose,
  onSave,
}) => {
  if (!isOpen || !user) return null;

  const [staffId, setStaffId] = useState(user.staffId || '');
  const [username, setUsername] = useState(user.username || user.staffId || '');
  const [name, setName] = useState(user.name || '');
  const [thaiName, setThaiName] = useState(user.thaiName || '');
  const [nickname, setNickname] = useState(user.nickname || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState<UserRole>(user.role || 'USER');
  const [departmentCode, setDepartmentCode] = useState(user.departmentCode || departments[0]?.code || 'XT018-IT');
  const [branchCode, setBranchCode] = useState(user.branchCode || branches[0]?.code || 'TH100');
  const [password, setPassword] = useState(user.password || 'Lemony2026');
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(user.isFirstLogin ?? true);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setStaffId(user.staffId || '');
      setUsername(user.username || user.staffId || '');
      setName(user.name || '');
      setThaiName(user.thaiName || '');
      setNickname(user.nickname || '');
      setEmail(user.email || '');
      setRole(user.role || 'USER');
      setDepartmentCode(user.departmentCode || departments[0]?.code || 'XT018-IT');
      setBranchCode(user.branchCode || branches[0]?.code || 'TH100');
      setPassword(user.password || 'Lemony2026');
      setIsFirstLogin(user.isFirstLogin ?? true);
      setSuccessMsg('');
    }
  }, [user, departments, branches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffId.trim() || !name.trim()) {
      alert('กรุณากรอกรหัสพนักงานและชื่อ-นามสกุล');
      return;
    }

    const dept = departments.find((d) => d.code === departmentCode);
    const branch = branches.find((b) => b.code === branchCode);

    const updated: UserProfile = {
      ...user,
      staffId: staffId.trim(),
      username: username.trim() || staffId.trim().toLowerCase(),
      name: name.trim(),
      thaiName: thaiName.trim() || name.trim(),
      nickname: nickname.trim() || undefined,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@xingtai.co.th`,
      role,
      departmentCode,
      departmentName: dept?.name || departmentCode,
      branchCode,
      branchName: branch?.name || branchCode,
      password: password.trim() || 'Lemony2026',
      isFirstLogin,
    };

    onSave(updated);
    setSuccessMsg('บันทึกการแก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleResetDefaultPassword = () => {
    setPassword('Lemony2026');
    setIsFirstLogin(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#12141c] border border-cyan-700/60 rounded-2xl w-full max-w-2xl text-zinc-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#181b26] p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>แก้ไขข้อมูลผู้ใช้งาน (Edit User Account)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {user.staffId}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                ปรับปรุงข้อมูลส่วนตัว แผนก สิทธิ์การเข้าถึง และรหัสผ่าน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-700 text-emerald-300 px-5 py-2.5 text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Section 1: Identity Info */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
              <IdCard className="w-3.5 h-3.5" />
              <span>1. ข้อมูลประจำตัวและชื่อพนักงาน (Identity)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  รหัสพนักงาน (Staff ID) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg p-2.5 text-cyan-300 font-mono font-bold"
                  placeholder="เช่น IT-270101"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  Username (สำหรับล็อกอิน)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg p-2.5 text-zinc-200 font-mono"
                  placeholder="เช่น it270101"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  ชื่อเล่น (Nickname)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg p-2.5 text-zinc-200"
                  placeholder="เช่น เจิน"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  ชื่อ-นามสกุล (ภาษาไทย) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={thaiName}
                  onChange={(e) => setThaiName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg p-2.5 text-zinc-200 font-medium"
                  placeholder="เช่น นายเจิน ชิน"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  ชื่อ-นามสกุล (ภาษาอังกฤษ) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg p-2.5 text-zinc-200"
                  placeholder="เช่น Jason Chen"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-300 block mb-1 font-semibold">
                อีเมลบริษัท (Email Address)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2.5 text-zinc-200 font-mono"
                  placeholder="name@xingtai.co.th"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Department, Branch & Role Permission */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>2. สิทธิ์ในระบบ สังกัดแผนก และสาขา (Role & Department)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  สิทธิ์การใช้งาน (User Role) <span className="text-red-400">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#0b0d13] border border-purple-700/60 focus:border-purple-400 rounded-lg p-2.5 text-purple-300 font-bold"
                >
                  <option value="USER">USER (ผู้ใช้งานทั่วไป)</option>
                  <option value="IT">IT (ฝ่ายไอที / ช่างผู้รับผิดชอบ)</option>
                  <option value="MANAGER">MANAGER (ผู้จัดการฝ่าย / ผู้อนุมัติ)</option>
                  <option value="ACC">ACC (ฝ่ายบัญชีและการเงิน)</option>
                  <option value="ADMIN">ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  แผนกประจำ (Department)
                </label>
                <select
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg p-2.5 text-zinc-200"
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  สาขาประจำ (Branch)
                </label>
                <select
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-cyan-400 rounded-lg p-2.5 text-zinc-200"
                >
                  {branches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Password & Security */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>3. รหัสผ่านและการตั้งค่าความปลอดภัย (Security & Password)</span>
              </div>
              <button
                type="button"
                onClick={handleResetDefaultPassword}
                className="text-[10px] text-amber-300 hover:text-amber-200 underline font-normal flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>รีเซ็ตเป็นรหัสเริ่มต้น (Lemony2026)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0b0d13] border border-zinc-700 focus:border-amber-400 rounded-lg p-2.5 text-amber-300 font-mono"
                    placeholder="กำหนดรหัสผ่านใหม่"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-200 font-mono"
                  >
                    {showPassword ? 'ซ่อน' : 'แสดง'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  สถานะการเปลี่ยนรหัสผ่าน (First Login Status)
                </label>
                <div className="flex items-center gap-2 pt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isFirstLogin}
                      onChange={(e) => setIsFirstLogin(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0b0d13] border-zinc-700 text-amber-500 focus:ring-amber-400"
                    />
                    <span>บังคับเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งถัดไป</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0d13] border border-zinc-800 p-2.5 rounded-lg text-[11px] text-zinc-400 flex items-start gap-2">
              <BadgeAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                เมื่อบันทึกข้อมูลแล้ว บัญชีผู้ใช้งานนี้จะถูกอัปเดตในระบบและซิงค์ไปยังฐานข้อมูล MySQL ทันที
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-950/50 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไข (Save Changes)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
