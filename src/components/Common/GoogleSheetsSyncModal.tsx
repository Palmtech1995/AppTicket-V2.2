/**
 * ============================================================================
 * [COMPONENT: GOOGLE SHEETS SYNC MODAL]
 * File: /src/components/Common/GoogleSheetsSyncModal.tsx
 * Description: Interactive dialog for connecting Google Workspace, creating
 *              linked Google Sheets, and syncing enterprise asset & ticket data.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  LogOut,
  UploadCloud,
  FileText,
  Boxes,
  Ticket,
} from 'lucide-react';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  createGoogleSpreadsheet,
  syncAllDataToSpreadsheet,
  getCurrentGoogleUser,
  initAuth,
} from '../../services/googleSheetsService';
import { Asset, ITTicket, TransferForm } from '../../types';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  tickets: ITTicket[];
  transfers: TransferForm[];
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  assets,
  tickets,
  transfers,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState(
    `Xing Tai Enterprise Asset & IT Data (${new Date().toLocaleDateString('th-TH')})`
  );
  const [existingSheetId, setExistingSheetId] = useState('');
  const [syncMode, setSyncMode] = useState<'new' | 'existing'>('new');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const user = getCurrentGoogleUser();
      const currentToken = getAccessToken();
      if (user && currentToken) {
        setGoogleUser(user);
        setToken(currentToken);
      } else {
        initAuth(
          (u, tok) => {
            setGoogleUser(u);
            setToken(tok);
          },
          () => {
            setGoogleUser(null);
            setToken(null);
          }
        );
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User closed the popup intentionally
        return;
      }
      setErrorMessage(err.message || 'ไม่สามารถลงชื่อเข้าใช้ด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setToken(null);
    setCreatedSheetUrl(null);
  };

  const handleStartSync = () => {
    setErrorMessage(null);
    if (!token) {
      setErrorMessage('กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google ก่อนดำเนินการซิงค์ข้อมูล');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSync = async () => {
    setShowConfirmModal(false);
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncStatus('กำลังเตรียมข้อมูลและเชื่อมต่อ Google Sheets API...');

    try {
      let targetId = existingSheetId.trim();
      let targetUrl = '';

      if (syncMode === 'new') {
        setSyncStatus('กำลังสร้าง Google Spreadsheet ใหม่ใน Google Drive ของคุณ...');
        const newSheet = await createGoogleSpreadsheet(sheetTitle, token!);
        targetId = newSheet.spreadsheetId;
        targetUrl = newSheet.spreadsheetUrl;
      } else {
        // Extract ID if full URL pasted
        if (targetId.includes('/d/')) {
          const parts = targetId.split('/d/')[1];
          targetId = parts.split('/')[0];
        }
        if (!targetId) {
          throw new Error('กรุณากรอก Spreadsheet ID หรือ URL ของ Google Sheets ที่ถูกต้อง');
        }
        targetUrl = `https://docs.google.com/spreadsheets/d/${targetId}`;
      }

      setSyncStatus('กำลังนำเข้าข้อมูล สินทรัพย์, ใบแจ้งซ่อม IT, ใบโอนย้าย, และสรุป KPI...');
      await syncAllDataToSpreadsheet(targetId, token!, assets, tickets, transfers);

      setCreatedSheetUrl(targetUrl);
      setSyncStatus('ซิงค์ข้อมูลไปยัง Google Sheets สำเร็จเรียบร้อยแล้ว!');
    } catch (err: any) {
      console.error('Google Sheets sync error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets');
      setSyncStatus(null);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111420] border border-zinc-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e101a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google Sheets Data Link & Synchronization</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Google Workspace
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                เชื่อมต่อและซิงค์ข้อมูลทรัพย์สิน, IT Tickets, และใบโอนย้ายไปยัง Google Sheets แบบเรียลไทม์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Google Account Authentication Status */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                สถานะการเชื่อมต่อบัญชี Google (Google OAuth)
              </span>
              {googleUser && (
                <button
                  onClick={handleSignOut}
                  className="text-[11px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>ตัดการเชื่อมต่อ</span>
                </button>
              )}
            </div>

            {googleUser ? (
              <div className="flex items-center gap-3 p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google User'}
                    className="w-9 h-9 rounded-full border border-emerald-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">
                    {googleUser.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <strong className="text-white block truncate text-xs">
                    {googleUser.displayName || 'Google Account'}
                  </strong>
                  <span className="text-emerald-300/80 text-[11px] truncate block font-mono">
                    {googleUser.email}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>เชื่อมต่อแล้ว</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 space-y-3">
                <p className="text-zinc-400 text-xs">
                  ยังไม่ได้เชื่อมต่อบัญชี Google กรุณาลงชื่อเข้าใช้เพื่ออนุญาตให้ระบบสร้างหรืออัปเดตไฟล์สเปรดชีตใน Google Drive ของคุณ
                </p>
                <button
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'กำลังเชื่อมต่อ Google...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Sync Configuration Mode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <button
                onClick={() => setSyncMode('new')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  syncMode === 'new'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                1. สร้าง Google Sheet ไฟล์ใหม่ (แนะนำ)
              </button>
              <button
                onClick={() => setSyncMode('existing')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  syncMode === 'existing'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                2. อัปเดตไปยัง Sheet เดิมที่มีอยู่
              </button>
            </div>

            {syncMode === 'new' ? (
              <div className="space-y-2">
                <label className="text-zinc-300 font-bold block">
                  ชื่อไฟล์ Google Spreadsheet ที่ต้องการสร้าง:
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="เช่น Xing Tai Enterprise Asset & IT Data"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-zinc-300 font-bold block">
                  ระบุ Google Sheet URL หรือ Spreadsheet ID เดิม:
                </label>
                <input
                  type="text"
                  value={existingSheetId}
                  onChange={(e) => setExistingSheetId(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-400">
                  *ระบบจะทำการเขียนทับข้อมูลในแท็บ <code>Asset_Inventory</code>, <code>IT_Tickets</code>, <code>Transfer_Handover</code> และ <code>Summary_Report</code>
                </p>
              </div>
            )}
          </div>

          {/* Dataset Summary Cards to be synced */}
          <div className="space-y-2">
            <span className="font-bold text-zinc-300 block">
              สรุปรายการที่จะทำการซิงค์ (Dataset Tabs to Sync):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-black/40 border border-cyan-900/40 rounded-xl">
                <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                  <Boxes className="w-3.5 h-3.5" />
                  <strong className="text-[11px]">Asset Inventory</strong>
                </div>
                <span className="text-base font-bold text-white font-mono">{assets.length}</span>
                <span className="text-[10px] text-zinc-400 block">รายการทรัพย์สิน</span>
              </div>

              <div className="p-2.5 bg-black/40 border border-amber-900/40 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                  <Ticket className="w-3.5 h-3.5" />
                  <strong className="text-[11px]">IT Tickets</strong>
                </div>
                <span className="text-base font-bold text-white font-mono">{tickets.length}</span>
                <span className="text-[10px] text-zinc-400 block">ใบแจ้งซ่อม</span>
              </div>

              <div className="p-2.5 bg-black/40 border border-emerald-900/40 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <strong className="text-[11px]">Transfer Handover</strong>
                </div>
                <span className="text-base font-bold text-white font-mono">{transfers.length}</span>
                <span className="text-[10px] text-zinc-400 block">ใบโอนย้าย</span>
              </div>

              <div className="p-2.5 bg-black/40 border border-purple-900/40 rounded-xl">
                <div className="flex items-center gap-1.5 text-purple-400 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <strong className="text-[11px]">Summary KPI</strong>
                </div>
                <span className="text-base font-bold text-white font-mono">4 Tabs</span>
                <span className="text-[10px] text-zinc-400 block">รายงานสรุป</span>
              </div>
            </div>
          </div>

          {/* Status & Error Messages */}
          {syncStatus && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Result Action */}
          {createdSheetUrl && (
            <div className="p-4 bg-gradient-to-r from-emerald-950/70 to-teal-950/60 border border-emerald-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Google Spreadsheet พร้อมใช้งานแล้ว
                </strong>
                <a
                  href={createdSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span>เปิดดูใน Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-emerald-200/80 font-mono truncate">
                {createdSheetUrl}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#0e101a] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>

          <button
            onClick={handleStartSync}
            disabled={isSyncing || !googleUser}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังส่งข้อมูลไปยัง Google Sheets...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>เริ่มซิงค์ข้อมูล (Start Sync)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141824] border border-amber-700/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">ยืนยันการเชื่อมโยงข้อมูลไปยัง Google Sheets?</h3>
                <p className="text-[11px] text-zinc-400">การยืนยันสิทธิ์การเขียนข้อมูลลงใน Google Workspace</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              ระบบจะทำการเขียนหรืออัปเดตข้อมูลทั้งหมด <strong>{assets.length} สินทรัพย์</strong>,{' '}
              <strong>{tickets.length} ใบแจ้งซ่อม</strong> และ <strong>{transfers.length} ใบโอนย้าย</strong> ลงในสเปรดชีต Google ของคุณ
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={executeSync}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันและเริ่มส่งข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
