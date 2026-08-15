/**
 * ============================================================================
 * [MODULE: NOTIFICATION CENTER & BELL MENU]
 * File: /src/components/Notifications/NotificationCenter.tsx
 * Description: Dropdown & Drawer for IT Ticket Alerts, Unread Counter & Settings
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Ticket,
  CheckCircle2,
  Trash2,
  Volume2,
  VolumeX,
  Smartphone,
  ExternalLink,
  Clock,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { AppNotification } from '../../types';
import { playTicketNotificationSound, requestBrowserNotificationPermission } from '../../utils/sound';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectTicket: (ticketId: string) => void;
  onSendTestNotification?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectTicket,
  onSendTestNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [hasBrowserPermission, setHasBrowserPermission] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasBrowserPermission(Notification.permission === 'granted');
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setHasBrowserPermission(res === 'granted');
    if (res === 'granted') {
      playTicketNotificationSound('MEDIUM');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300'
            : unreadCount > 0
            ? 'bg-[#181a24] hover:bg-[#202333] border-cyan-600/50 text-cyan-300'
            : 'bg-[#161822] hover:bg-[#202433] text-zinc-300 border-zinc-700/80'
        }`}
        title={`การแจ้งเตือน (${unreadCount} รายการใหม่)`}
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-cyan-400 animate-bounce' : ''}`} />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0e111a] animate-pulse shadow-lg shadow-red-500/40">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2.5 w-[330px] sm:w-[380px] md:w-[420px] bg-[#11141d]/95 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl shadow-2xl z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  ศูนย์แจ้งเตือน
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-mono font-bold">
                      {unreadCount} ใหม่
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-zinc-400">แจ้งเตือน Ticket แจ้งซ่อมและสถานะงาน IT</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Browser Push & Sound Quick Bar */}
          <div className="px-3.5 py-2 bg-[#0d1017] border-b border-zinc-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <button
                onClick={() => playTicketNotificationSound('MEDIUM')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
                title="ทดสอบเสียงกระดิ่งเตือน"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>ทดสอบเสียง</span>
              </button>

              {onSendTestNotification && (
                <button
                  onClick={onSendTestNotification}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer ml-2"
                  title="จำลองแจ้งเตือน Ticket ใหม่"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>จำลอง Ticket ใหม่</span>
                </button>
              )}
            </div>

            {!hasBrowserPermission ? (
              <button
                onClick={handleRequestPermission}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                title="เปิดการแจ้งเตือนบนหน้าจอคอมพิวเตอร์ (Desktop Notification)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>เปิดแจ้งเตือนบนจอ</span>
              </button>
            ) : (
              <span className="text-[10px] text-emerald-400/90 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Desktop Ready
              </span>
            )}
          </div>

          {/* Filter Tabs & Actions */}
          <div className="px-3.5 py-2 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/40">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ทั้งหมด ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ยังไม่อ่าน ({unreadCount})
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[11px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
                  title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>อ่านหมดแล้ว</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
                  title="ล้างประวัติการแจ้งเตือนทั้งหมด"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ล้าง</span>
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[340px] sm:max-h-[380px] overflow-y-auto divide-y divide-zinc-800/40">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-500 border border-zinc-700/60">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-zinc-300">ไม่มีการแจ้งเตือนในขณะนี้</p>
                <p className="text-xs text-zinc-500 mt-1">เมื่อมี Ticket หรือสถานะงานใหม่ ระบบจะแจ้งเตือนทันที</p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isUrgent = n.priority === 'URGENT' || n.priority === 'HIGH';
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      onMarkAsRead(n.id);
                      if (n.ticketId) {
                        onSelectTicket(n.ticketId);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 transition-all cursor-pointer relative group flex items-start gap-3 ${
                      !n.isRead
                        ? isUrgent
                          ? 'bg-red-950/20 hover:bg-red-950/30'
                          : 'bg-cyan-950/20 hover:bg-cyan-950/30'
                        : 'hover:bg-zinc-800/40 opacity-80'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!n.isRead && (
                      <span
                        className={`absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full ${
                          isUrgent ? 'bg-red-500' : 'bg-cyan-400'
                        }`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isUrgent
                          ? 'bg-red-950/80 border-red-500/50 text-red-400'
                          : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
                      }`}
                    >
                      {isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            isUrgent
                              ? 'bg-red-900/40 border-red-700 text-red-300'
                              : 'bg-cyan-900/40 border-cyan-700 text-cyan-300'
                          }`}
                        >
                          {n.type === 'NEW_TICKET' ? 'Ticket ใหม่' : 'อัปเดตงาน'}
                        </span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {n.timestamp}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-zinc-100 mt-1 leading-snug truncate">
                        {n.title}
                      </h4>

                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                        <div className="truncate">
                          <span>โดย: </span>
                          <span className="text-zinc-200 font-medium">{n.requesterName || '-'}</span>
                          {n.department && <span className="text-zinc-500"> ({n.department})</span>}
                        </div>

                        {n.ticketId && (
                          <span className="text-cyan-400 group-hover:underline inline-flex items-center gap-1 text-[11px] font-mono shrink-0">
                            {n.ticketId}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-zinc-950/80 border-t border-zinc-800/80 text-center text-[11px] text-zinc-400">
            ระบบส่งเสียงและแสดง Pop-up ทันทีเมื่อมีผู้ส่ง Ticket ใหม่
          </div>
        </div>
      )}
    </div>
  );
};
