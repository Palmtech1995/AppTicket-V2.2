/**
 * ============================================================================
 * [MODULE: FORCED FIRST-LOGIN PASSWORD RESET MODAL]
 * File: /src/components/Auth/ForceChangePasswordModal.tsx
 * Description: Mandatory security gate modal triggered when a user logs in
 *              with the default seed password ("Lemony2026") or on first login.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Default Password Detection: ป้องกันการใช้รหัสผ่านตั้งต้นซ้ำ
 * 2. Mandatory Password Reset: ผู้ใช้ต้องตั้งรหัสผ่านใหม่ก่อนเข้าสู่หน้าหลักของระบบ
 * ============================================================================
 */

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check, Eye, EyeOff, Lock } from 'lucide-react';
import { UserProfile } from '../../types';

interface ForceChangePasswordModalProps {
  user: UserProfile;
  isOpen: boolean;
  onPasswordChanged: (newPassword: string) => void;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  user,
  isOpen,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword === 'Lemony2026') {
      setError('กรุณาตั้งรหัสผ่านใหม่ที่ไม่ใช่รหัสผ่านตั้งต้น (Lemony2026)');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    onPasswordChanged(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12141c] border border-cyan-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ตั้งรหัสผ่านใหม่สำหรับการเข้าสู่ระบบครั้งแรก</h2>
            <p className="text-xs text-zinc-400">First-Time Login Security Setup</p>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-300">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-200">นโยบายความปลอดภัยระบบไอที Xing Tai</div>
            <div>
              คุณกำลังเข้าสู่ระบบด้วยรหัสผ่านตั้งต้น <span className="font-mono font-bold bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-100">Lemony2026</span> เพื่อความปลอดภัยของข้อมูล กรุณากำหนดรหัสผ่านส่วนตัวใหม่ของคุณก่อนเริ่มใช้งาน
            </div>
          </div>
        </div>

        <div className="bg-[#181b26] p-3 rounded-xl border border-zinc-800 text-xs flex items-center justify-between">
          <span className="text-zinc-400">ผู้ใช้งาน (Account):</span>
          <span className="font-bold text-white">{user.name} ({user.staffId})</span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              ยืนยันรหัสผ่านใหม่ (Confirm Password) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0a0c12] border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 pr-10"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ</span>
          </button>
        </form>
      </div>
    </div>
  );
};
