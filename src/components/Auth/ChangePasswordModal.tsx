/**
 * ============================================================================
 * [MODULE: USER PROFILE PASSWORD CHANGE MODAL]
 * File: /src/components/Auth/ChangePasswordModal.tsx
 * Description: Voluntary password update modal allowing logged-in staff
 *              to verify their old password and set a new secure password.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Old Password Validation: ตรวจสอบความถูกต้องของรหัสผ่านปัจจุบัน
 * 2. Password Strength & Confirmation: บังคับขั้นต่ำ 6 ตัวอักษรและตรวจสอบ match
 * 3. Show/Hide Password Toggle: สลับการแสดงผลรหัสผ่าน
 * ============================================================================
 */

import React, { useState } from 'react';
import { KeyRound, X, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSavePassword: (newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSavePassword,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentActualPassword = currentUser.password || 'Lemony2026';
    if (oldPassword !== currentActualPassword) {
      setError('รหัสผ่านเดิมไม่ถูกต้อง');
      return;
    }

    if (newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    onSavePassword(newPassword);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12141c] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">เปลี่ยนรหัสผ่านผู้ใช้งาน</h2>
              <p className="text-xs text-zinc-400">Change Account Password</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#181b26] p-3 rounded-xl border border-zinc-800 text-xs flex items-center justify-between">
          <span className="text-zinc-400">ผู้ใช้งานปัจจุบัน:</span>
          <span className="font-bold text-white">{currentUser.name} ({currentUser.staffId})</span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-red-300 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              รหัสผ่านเดิม (Current Password) *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="กรอกรหัสผ่านปัจจุบัน"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-[#0a0c12] border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              รหัสผ่านใหม่ (New Password) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="ระบุรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0a0c12] border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              ยืนยันรหัสผ่านใหม่ (Confirm New Password) *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0a0c12] border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2.5 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกรหัสผ่านใหม่</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
