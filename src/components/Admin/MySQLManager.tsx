/**
 * ============================================================================
 * [MODULE: MYSQL & PHPMYADMIN ENTERPRISE GATEWAY]
 * File: /src/components/Admin/MySQLManager.tsx
 * Description: Control plane for MySQL database connectivity, automatic SQL DDL
 *              generation, 8-table verification, REST API sync, and PHP backend scripts.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Live Connection Status: ตรวจสอบสถานะการเชื่อมต่อ MySQL และนับจำนวน Records แต่ละตาราง
 * 2. 1-Click Database Sync: ซิงค์ข้อมูลทั้งหมดจากเบราว์เซอร์เข้าสู่ MySQL
 * 3. SQL DDL & Dump Generator: ส่งออกสคริปต์ `xingtai_db.sql` สำหรับนำเข้า phpMyAdmin
 * 4. PHP API Gateway Bundler: สร้างไฟล์ `db.php`, `api.php`, `.htaccess` สำหรับติดตั้งบน Apache/Nginx โฮสติ้งทั่วไป
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Copy,
  Check,
  RefreshCw,
  Server,
  Code2,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Table,
  UploadCloud,
  FolderDown,
  Layers,
  Info,
  Terminal,
} from 'lucide-react';
import {
  Asset,
  Branch,
  Department,
  FormAdjustmentConfig,
  ITTicket,
  SystemRolePermissions,
  TransferForm,
  UserProfile,
  WeeklyProblemSummary,
} from '../../types';
import {
  checkDatabaseStatus,
  DbStatusResponse,
  generateFullSqlDump,
  generatePhpBackendScripts,
  syncDataToMySQL,
  DATABASE_SCHEMA_METADATA,
  TableSchemaDef,
} from '../../services/mysqlService';

interface MySQLManagerProps {
  branches: Branch[];
  departments: Department[];
  staffList: UserProfile[];
  assets: Asset[];
  transfers: TransferForm[];
  tickets: ITTicket[];
  weeklyProblems: WeeklyProblemSummary[];
  formConfig: FormAdjustmentConfig;
  rolePermissions: SystemRolePermissions;
  onRefreshData?: () => Promise<any> | void;
}

export const MySQLManager: React.FC<MySQLManagerProps> = ({
  branches,
  departments,
  staffList,
  assets,
  transfers,
  tickets,
  weeklyProblems,
  formConfig,
  rolePermissions,
  onRefreshData,
}) => {
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedPhp, setCopiedPhp] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('assets');
  const [viewTab, setViewTab] = useState<'overview' | 'sqlViewer' | 'phpBridge' | 'guide'>('overview');

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await checkDatabaseStatus();
      setDbStatus(res);
    } catch {
      setDbStatus({
        connected: false,
        driver: 'local_fallback',
        message: 'Could not reach database check endpoint.',
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFetchFromDB = async () => {
    setIsFetching(true);
    setSyncFeedback(null);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      await fetchStatus();
      setSyncFeedback('✅ ดึงข้อมูลล่าสุดจากฐานข้อมูล (Database) มาแสดงผลเรียบร้อยแล้ว');
    } catch (err: any) {
      setSyncFeedback(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Generate Current SQL Dump
  const currentSql = generateFullSqlDump({
    branches,
    departments,
    staffList,
    assets,
    transfers,
    tickets,
    weeklyProblems,
    formConfig,
    rolePermissions,
  });

  const { dbConfigPhp, apiPhp } = generatePhpBackendScripts();

  const handleDownloadSql = () => {
    const blob = new Blob([currentSql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xingtai_db_${new Date().toISOString().slice(0, 10)}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(currentSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadPhpZip = () => {
    const fullScript = `/* =======================================\n   File 1: db_config.php\n   ======================================= */\n\n${dbConfigPhp}\n\n/* =======================================\n   File 2: api.php\n   ======================================= */\n\n${apiPhp}`;
    const blob = new Blob([fullScript], { type: 'application/x-php;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xingtai_php_api_package.php`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPhp = () => {
    navigator.clipboard.writeText(`${dbConfigPhp}\n\n// --- api.php ---\n${apiPhp}`);
    setCopiedPhp(true);
    setTimeout(() => setCopiedPhp(false), 2500);
  };

  const handleSyncToMySQL = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncDataToMySQL({
        branches,
        departments,
        staffList,
        assets,
        transfers,
        tickets,
        weeklyProblems,
        formConfig,
        rolePermissions,
      });
      setSyncFeedback(res.message);
      fetchStatus();
    } catch (err: any) {
      setSyncFeedback(`เกิดข้อผิดพลาดในการซิงค์: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#111c38] to-[#0c1222] border border-blue-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-cyan-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  phpMyAdmin & MySQL Database Connector
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 border border-blue-700 text-blue-300">
                  v8.0 / MariaDB Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                เชื่อมต่อฐานข้อมูล MySQL ขององค์กร, ส่งออกสคริปต์ SQL นำเข้าใน phpMyAdmin ด้วย 1-คลิก, ซิงค์ข้อมูลอัตโนมัติ และดาวน์โหลดชุด API ภาษา PHP สำหรับเซิร์ฟเวอร์
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleFetchFromDB}
              disabled={isFetching}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              title="ดึงข้อมูลล่าสุดจาก MySQL/Database เข้ามาแสดงผลในระบบทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลจาก Database'}</span>
            </button>
            <button
              onClick={handleSyncToMySQL}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer active:scale-95"
              title="บันทึกข้อมูลทั้งหมดปัจจุบันลงฐานข้อมูล MySQL"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังบันทึก...' : 'ซิงค์บันทึกสู่ DB'}</span>
            </button>
            <button
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>ทดสอบการเชื่อมต่อ</span>
            </button>
            <button
              onClick={handleDownloadSql}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด xingtai_db.sql</span>
            </button>
          </div>
        </div>

        {/* Real-time Status Card */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-black/30 rounded-xl p-3 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">สถานะการเชื่อมต่อ (Status)</div>
            <div className="flex items-center gap-2">
              {dbStatus?.connected ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-400">MySQL Online</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-300">Local / Standalone Mode</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">ฐานข้อมูลเป้าหมาย (Database)</div>
            <div className="font-mono font-bold text-zinc-200 truncate">
              {dbStatus?.database || 'xingtai_db'}
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">โฮสต์เซิร์ฟเวอร์ (Host / Port)</div>
            <div className="font-mono text-zinc-300 truncate">
              {dbStatus?.host || 'localhost'}:{dbStatus?.port || 3306}
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">ตารางทั้งหมด (Tables Ready)</div>
            <div className="font-bold text-cyan-400">
              8 Tables (Assets, Tickets, Transfers...)
            </div>
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-950/80 border border-blue-700/80 text-blue-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-zinc-400 hover:text-white text-xs"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setViewTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            viewTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>ภาพรวมโครงสร้างตาราง (Table Schema)</span>
        </button>

        <button
          onClick={() => setViewTab('sqlViewer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            viewTab === 'sqlViewer'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>ตัวสร้างสคริปต์ SQL (SQL Generator)</span>
        </button>

        <button
          onClick={() => setViewTab('phpBridge')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            viewTab === 'phpBridge'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>ชุดเชื่อมต่อ PHP (PHP API Gateway)</span>
        </button>

        <button
          onClick={() => setViewTab('guide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            viewTab === 'guide'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>คู่มือนำเข้า phpMyAdmin (Setup Guide)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TABLE SCHEMA */}
      {viewTab === 'overview' && (
        <div className="space-y-6">
          {/* Table summary cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {DATABASE_SCHEMA_METADATA.map((tbl) => {
              const count =
                tbl.tableName === 'assets'
                  ? assets.length
                  : tbl.tableName === 'transfer_forms'
                  ? transfers.length
                  : tbl.tableName === 'it_tickets'
                  ? tickets.length
                  : tbl.tableName === 'users'
                  ? staffList.length
                  : tbl.tableName === 'branches'
                  ? branches.length
                  : tbl.tableName === 'departments'
                  ? departments.length
                  : tbl.tableName === 'weekly_problems'
                  ? weeklyProblems.length
                  : 2;

              const isSelected = selectedTable === tbl.tableName;

              return (
                <button
                  key={tbl.tableName}
                  onClick={() => setSelectedTable(tbl.tableName)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-[#111420] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {tbl.tableName}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-blue-400' : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{tbl.thaiName}</div>
                  <div className="mt-2 text-[11px] font-mono font-bold text-blue-400">
                    {count} records
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Table Details Inspector */}
          {(() => {
            const currentTableDef =
              DATABASE_SCHEMA_METADATA.find((t) => t.tableName === selectedTable) ||
              DATABASE_SCHEMA_METADATA[0];

            return (
              <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Table className="w-5 h-5 text-blue-400" />
                      <span className="text-base font-bold text-white font-mono">
                        {currentTableDef.tableName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300">
                        {currentTableDef.thaiName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        PK: {currentTableDef.primaryKey}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{currentTableDef.description}</p>
                  </div>

                  {currentTableDef.relations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-300 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 font-semibold">Foreign Keys / Relations:</span>
                      {currentTableDef.relations.map((rel, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px] border border-cyan-800/60"
                        >
                          {rel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column Table */}
                <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 font-semibold">
                        <th className="py-2.5 px-3.5 w-12 text-center">#</th>
                        <th className="py-2.5 px-3.5 font-mono">Field Name</th>
                        <th className="py-2.5 px-3.5 font-mono">Data Type</th>
                        <th className="py-2.5 px-3.5 text-center">Key</th>
                        <th className="py-2.5 px-3.5 text-center">Null</th>
                        <th className="py-2.5 px-3.5 font-mono">Default</th>
                        <th className="py-2.5 px-3.5">คำอธิบายฟิลด์ (Description)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {currentTableDef.columns.map((col, idx) => (
                        <tr
                          key={col.name}
                          className="hover:bg-zinc-800/30 transition-colors text-zinc-300"
                        >
                          <td className="py-2.5 px-3.5 text-center text-zinc-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-white flex items-center gap-1.5">
                            <span>{col.name}</span>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-cyan-300">
                            {col.type}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            {col.key === 'PRI' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                PRI
                              </span>
                            )}
                            {col.key === 'UNI' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                UNI
                              </span>
                            )}
                            {col.key === 'FK' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                FK
                              </span>
                            )}
                            {col.key === 'MUL' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                MUL
                              </span>
                            )}
                            {!col.key && <span className="text-zinc-600">-</span>}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            {col.nullable ? (
                              <span className="text-zinc-400">YES</span>
                            ) : (
                              <span className="text-rose-400 font-semibold">NO</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-zinc-400">
                            {col.defaultValue || <span className="text-zinc-600">NULL</span>}
                          </td>
                          <td className="py-2.5 px-3.5 text-zinc-300">{col.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Action Row: Sync Button */}
          <div className="bg-[#111728] border border-blue-900/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                <span>ซิงค์ข้อมูลทั้งหมดไปยัง MySQL Server (Live Sync)</span>
              </div>
              <p className="text-xs text-zinc-400">
                กดเพื่อเขียนข้อมูลปัจจุบัน (ทรัพย์สิน, ใบโอนย้าย, Ticket, พนักงาน, สาขา) เข้าสู่ตาราง MySQL ทันที
              </p>
            </div>

            <button
              onClick={handleSyncToMySQL}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ข้อมูลเข้า MySQL ทันที'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SQL SCRIPT VIEWER */}
      {viewTab === 'sqlViewer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">
                สคริปต์ SQL DDL & Data Dump สำหรับ phpMyAdmin
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                สามารถคัดลอกคำสั่งด้านล่างไปรันในแท็บ SQL ของ phpMyAdmin ได้โดยตรง
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'คัดลอกแล้ว!' : 'คัดลอก SQL'}</span>
              </button>
              <button
                onClick={handleDownloadSql}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด .sql</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="w-full h-96 bg-[#090c14] border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-cyan-300 overflow-auto select-all leading-relaxed">
              {currentSql}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: PHP API BRIDGE */}
      {viewTab === 'phpBridge' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">
                PHP REST API Gateway สำหรับ Apache / Nginx / XAMPP
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                หากองค์กรมีเซิร์ฟเวอร์ PHP + MySQL หรือต้องการสร้างเว็บเซอร์วิสเฉพาะทาง
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPhp}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
              >
                {copiedPhp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPhp ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด PHP'}</span>
              </button>
              <button
                onClick={handleDownloadPhpZip}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์ api.php</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>db_config.php (ไฟล์เชื่อมต่อฐานข้อมูล PDO)</span>
              </div>
              <pre className="h-72 bg-[#090c14] border border-zinc-800 rounded-xl p-3.5 text-[11px] font-mono text-amber-300 overflow-auto select-all leading-relaxed">
                {dbConfigPhp}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>api.php (REST API Router สำหรับ Assets, Tickets, Transfers)</span>
              </div>
              <pre className="h-72 bg-[#090c14] border border-zinc-800 rounded-xl p-3.5 text-[11px] font-mono text-cyan-300 overflow-auto select-all leading-relaxed">
                {apiPhp}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETUP GUIDE */}
      {viewTab === 'guide' && (
        <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <span>ขั้นตอนการนำเข้าฐานข้อมูลใน phpMyAdmin (Step-by-Step Guide)</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              ทำตาม 4 ขั้นตอนนี้เพื่อเริ่มใช้งาน MySQL ร่วมกับระบบ Xing Tai ได้ทันที
            </p>
          </div>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">สร้างฐานข้อมูลใหม่ใน phpMyAdmin</div>
                <div>
                  เปิดโปรแกรม phpMyAdmin ในเบราว์เซอร์ (เช่น <code className="text-cyan-300 font-mono">http://localhost/phpmyadmin</code>) &rarr; เมนูด้านซ้ายกด <strong>"New" (สร้าง)</strong> &rarr; ตั้งชื่อฐานข้อมูลว่า <code className="text-cyan-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">xingtai_db</code> &rarr; เลือก Collation เป็น <code className="text-cyan-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">utf8mb4_unicode_ci</code> &rarr; กดปุ่ม <strong>Create</strong>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">นำเข้าไฟล์ SQL (Import .sql)</div>
                <div>
                  คลิกที่ฐานข้อมูล <code className="text-cyan-300 font-mono">xingtai_db</code> ที่เพิ่งสร้าง &rarr; ไปที่แท็บเมนูด้านบน <strong>"Import" (นำเข้า)</strong> &rarr; กดเลือกไฟล์ <strong>"Choose File"</strong> และเลือกไฟล์ <code className="text-cyan-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">xingtai_db.sql</code> ที่ดาวน์โหลดจากระบบ &rarr; เลื่อนลงล่างแล้วกดปุ่ม <strong>"Go" (ดำเนินการ)</strong>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">การตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)</div>
                <div>
                  ระบุข้อมูลการเชื่อมต่อในไฟล์ <code className="text-cyan-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">.env</code> ของแอปพลิเคชัน:
                  <div className="mt-2 bg-[#090c14] p-3 rounded-lg font-mono text-[11px] text-emerald-400 border border-zinc-800">
                    MYSQL_HOST=localhost<br />
                    MYSQL_PORT=3306<br />
                    MYSQL_USER=root<br />
                    MYSQL_PASSWORD=รหัสผ่านของคุณ<br />
                    MYSQL_DATABASE=xingtai_db
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                4
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">การใช้งานจริงและการสำรองข้อมูล (Backup & Replication)</div>
                <div>
                  เมื่อต่อกับ MySQL แล้ว ระบบจะจัดเก็บข้อมูลลงตาราง <code className="text-cyan-300 font-mono">assets</code>, <code className="text-cyan-300 font-mono">it_tickets</code>, <code className="text-cyan-300 font-mono">transfer_forms</code> โดยตรง สามารถใช้ phpMyAdmin ทำการ Export Backup ข้อมูล หรือเชื่อมกับระบบ ERP อื่นๆ ของบริษัท ซิงไท่ ได้อย่างราบรื่น
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
