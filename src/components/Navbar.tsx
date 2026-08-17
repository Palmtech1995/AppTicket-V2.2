/**
 * ============================================================================
 * [MODULE: TOP NAVIGATION & USER SWITCHER]
 * File: /src/components/Navbar.tsx
 * Description: Top bar with global asset search, camera QR scanner trigger,
 *              role profile badges, quick password change, and logout action.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Global Search: ค้นหาด่วน Asset ID, Serial No, หรือชื่อผู้ถือครอง
 * 2. QR Code Scanner Quick Trigger: เปิดกล้องสแกนเพื่อค้นหาและดู Bin Card ทันที
 * 3. Role Switcher Dropdown: สลับบทบาท (ADMIN, IT, ACC, MANAGER, USER) เพื่อทดสอบระบบ
 * 4. User Profile & Password: แสดงข้อมูลสังกัดสาขาและปุ่มเปลี่ยนรหัสผ่าน
 * ============================================================================
 */

import React from 'react';
import {
  QrCode,
  Building2,
  ShieldCheck,
  Laptop,
  Calculator,
  Briefcase,
  User,
  Search,
  KeyRound,
  LogOut,
  Menu,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { AppNotification, UserProfile, UserRole } from '../types';
import { NotificationCenter } from './Notifications/NotificationCenter';

interface NavbarProps {
  currentUser: UserProfile;
  allStaff?: UserProfile[];
  onSelectUser?: (user: UserProfile) => void;
  onOpenQrScanner: () => void;
  onSearchGlobal: (query: string) => void;
  searchQuery: string;
  onOpenChangePassword?: () => void;
  onOpenEditProfile?: () => void;
  onOpenGoogleSheetsSync?: () => void;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  dbSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  onForceSyncDb?: () => void;
  onFetchFromDb?: () => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onSelectTicketNotification?: (ticketId: string) => void;
  onSendTestNotification?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allStaff,
  onSelectUser,
  onOpenQrScanner,
  onSearchGlobal,
  searchQuery,
  onOpenChangePassword,
  onOpenEditProfile,
  onOpenGoogleSheetsSync,
  onLogout,
  onToggleMobileMenu,
  dbSyncStatus = 'synced',
  onForceSyncDb,
  onFetchFromDb,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onSelectTicketNotification,
  onSendTestNotification,
}) => {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin (Full Access)', color: 'bg-red-950 text-red-400 border-red-800/60', icon: ShieldCheck };
      case 'IT':
        return { label: 'IT Specialist', color: 'bg-cyan-950 text-cyan-400 border-cyan-800/60', icon: Laptop };
      case 'ACC':
        return { label: 'ACC Role (Finance)', color: 'bg-emerald-950 text-emerald-400 border-emerald-800/60', icon: Calculator };
      case 'MANAGER':
        return { label: 'Manager (Approver)', color: 'bg-amber-950 text-amber-400 border-amber-800/60', icon: Briefcase };
      case 'USER':
      default:
        return { label: 'User ทั่วไป', color: 'bg-zinc-800 text-zinc-300 border-zinc-700', icon: User };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="h-16 bg-[#0e1014] border-b border-zinc-800/80 px-3 sm:px-5 flex items-center justify-between text-zinc-100 sticky top-0 z-30 gap-2">
      {/* Mobile Hamburger & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            id="global-search-input"
            type="text"
            placeholder="ค้นหารหัสทรัพย์สิน, S/N, ชื่ออุปกรณ์..."
            value={searchQuery}
            onChange={(e) => onSearchGlobal(e.target.value)}
            className="w-full bg-[#16181f] border border-zinc-800 rounded-xl pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchGlobal('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              ล้าง
            </button>
          )}
        </div>

        <button
          id="nav-qr-scan-btn"
          onClick={onOpenQrScanner}
          className="flex items-center gap-1.5 sm:gap-2 bg-[#1b1e27] hover:bg-[#232733] border border-zinc-700/70 text-zinc-200 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm shrink-0 active:scale-95"
          title="สแกน QR Code เพื่อดูข้อมูลทรัพย์สินทันที"
        >
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">สแกน QR</span>
        </button>
      </div>

      {/* Right Controls: Notification Bell, DB Status, Sheets Sync, Password & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Notification Center with Bell & Unread Badges */}
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={(id) => onMarkNotificationAsRead && onMarkNotificationAsRead(id)}
          onMarkAllAsRead={() => onMarkAllNotificationsAsRead && onMarkAllNotificationsAsRead()}
          onClearAll={() => onClearAllNotifications && onClearAllNotifications()}
          onSelectTicket={(ticketId) => onSelectTicketNotification && onSelectTicketNotification(ticketId)}
          onSendTestNotification={onSendTestNotification}
        />

        {/* Database Quick Fetch & Sync Status Badge */}
        {onFetchFromDb && (
          <button
            onClick={onFetchFromDb}
            className="hidden sm:flex items-center gap-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="ดึงข้อมูลล่าสุดจากฐานข้อมูล (Database / MySQL) เข้าสู่ระบบทันที"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">ดึงข้อมูลจาก DB</span>
          </button>
        )}

        {/* Database Auto-Sync Status Badge */}
        <div
          onClick={onForceSyncDb}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all active:scale-95 ${
            dbSyncStatus === 'syncing'
              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60'
              : dbSyncStatus === 'synced'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70 hover:bg-emerald-900/60'
              : dbSyncStatus === 'error'
              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
              : 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
          }`}
          title="สถานะการบันทึกฐานข้อมูล (คลิกเพื่อบันทึกซ้ำทันที)"
        >
          <Database className="w-3.5 h-3.5" />
          {dbSyncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
              <span className="hidden xl:inline">กำลังบันทึก DB...</span>
            </>
          ) : dbSyncStatus === 'synced' ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="hidden xl:inline">Database Synced</span>
            </>
          ) : dbSyncStatus === 'error' ? (
            <>
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span className="hidden xl:inline">DB Local Mode</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-zinc-400" />
              <span className="hidden xl:inline">Database Ready</span>
            </>
          )}
        </div>

        {/* Google Sheets Sync Button */}
        {onOpenGoogleSheetsSync && (
          <button
            onClick={onOpenGoogleSheetsSync}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="ซิงค์ข้อมูลกับ Google Sheets (OAuth)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Google Sheets</span>
          </button>
        )}

        {/* Change Password Button */}
        {onOpenChangePassword && (
          <button
            onClick={onOpenChangePassword}
            className="hidden md:flex items-center gap-1.5 bg-[#161822] hover:bg-[#202433] text-zinc-300 border border-zinc-700/80 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            title="เปลี่ยนรหัสผ่านผู้ใช้งาน"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>รหัสผ่าน</span>
          </button>
        )}

        {/* Current Active Badge */}
        <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badge.color}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>

        {/* Profile Avatar & Quick Edit Trigger */}
        <div
          onClick={onOpenEditProfile}
          className={`flex items-center gap-2 pl-0.5 sm:pl-1 ${
            onOpenEditProfile ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''
          }`}
          title={onOpenEditProfile ? 'คลิกเพื่อแก้ไขข้อมูลโปรไฟล์ผู้ใช้งาน (Edit Profile)' : undefined}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-800 to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner border border-cyan-500/40 shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-medium text-zinc-200 leading-tight max-w-[100px] truncate">
              {currentUser.thaiName || currentUser.name}
            </div>
            <div className="text-zinc-500 font-mono text-[10px]">{currentUser.staffId}</div>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 p-1.5 sm:p-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-xl text-xs transition-colors shrink-0"
            title="ออกจากระบบ (Sign Out)"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
