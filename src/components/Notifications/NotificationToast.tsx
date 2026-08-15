/**
 * ============================================================================
 * [MODULE: REAL-TIME NOTIFICATION TOAST POPUP]
 * File: /src/components/Notifications/NotificationToast.tsx
 * Description: Floating Toast Banner for Real-time New Ticket Notifications
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { Ticket, X, ArrowRight, Bell, AlertTriangle, Sparkles } from 'lucide-react';
import { AppNotification } from '../../types';

interface NotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onOpenTicket: (ticketId: string) => void;
  autoCloseDuration?: number; // ms
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onOpenTicket,
  autoCloseDuration = 8000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;
    setProgress(100);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDuration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification, autoCloseDuration, onClose]);

  if (!notification) return null;

  const isUrgent = notification.priority === 'URGENT' || notification.priority === 'HIGH';

  return (
    <div
      id="ticket-notification-toast"
      className="fixed bottom-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
          isUrgent
            ? 'bg-[#181119]/95 border-red-500/50 shadow-red-950/50 text-zinc-100'
            : 'bg-[#111622]/95 border-cyan-500/40 shadow-cyan-950/50 text-zinc-100'
        }`}
      >
        {/* Glow accent */}
        <div
          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-50 ${
            isUrgent ? 'bg-red-500' : 'bg-cyan-500'
          }`}
        />

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800/60 h-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              isUrgent ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isUrgent
                    ? 'bg-red-950/80 border-red-500/50 text-red-400 animate-pulse'
                    : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                }`}
              >
                {isUrgent ? <AlertTriangle className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border uppercase ${
                      isUrgent
                        ? 'bg-red-900/60 border-red-700 text-red-300'
                        : 'bg-cyan-900/60 border-cyan-700 text-cyan-300'
                    }`}
                  >
                    {isUrgent ? '⚡ แจ้งซ่อมด่วน (Urgent)' : '🔔 มี Ticket แจ้งซ่อมใหม่'}
                  </span>
                  {notification.ticketId && (
                    <span className="text-xs font-mono text-zinc-400 font-bold">{notification.ticketId}</span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white mt-1 leading-snug line-clamp-1">
                  {notification.title}
                </h4>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="ปิดแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-300 mt-2 line-clamp-2 pl-11">{notification.message}</p>

          <div className="mt-3.5 pt-3 border-t border-zinc-700/50 flex items-center justify-between pl-11">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>ผู้แจ้ง:</span>
              <span className="font-medium text-zinc-200">{notification.requesterName || 'พนักงาน'}</span>
              {notification.department && (
                <span className="text-zinc-500 font-mono">({notification.department})</span>
              )}
            </div>

            {notification.ticketId && (
              <button
                onClick={() => {
                  onOpenTicket(notification.ticketId!);
                  onClose();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                  isUrgent
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40'
                }`}
              >
                <span>เปิดดู Ticket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
