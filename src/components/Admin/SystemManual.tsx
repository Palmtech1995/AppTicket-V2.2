/**
 * ============================================================================
 * [MODULE: SYSTEM MANUAL & USER OPERATIONS GUIDE (THAI PDF EXPORTER)]
 * File: /src/components/Admin/SystemManual.tsx
 * Description: Interactive enterprise system documentation, user operation guides
 *              by role (USER, IT, MANAGER, ACC, ADMIN), 3-step digital signature
 *              approval workflow, architecture diagrams, file dictionary, 
 *              WordPress packager, MySQL 8-table setup, and HD 5-Page Thai PDF exporter.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. User Guide by Role: คู่มือขั้นตอนการทำงานตามบทบาท (5 ระดับ)
 * 2. 3-Step Signature Workflow: แผนภาพและขั้นตอนการอนุมัติใบโอนย้ายทรัพย์สิน A4
 * 3. IT Helpdesk SLA: ตารางเวลา SLA และการจัดการงานซ่อมบำรุง
 * 4. Localhost Standalone Setup: วิธีรันระบบบนเครื่องแบบอิสระพร้อม One-Click scripts
 * 5. Architecture & RBAC Matrix: สถาปัตยกรรม 3-Tier และตารางกำหนดสิทธิ์
 * 6. File Dictionary: พจนานุกรมไฟล์ซอร์สโค้ดและหน้าที่ของแต่ละคอมโพเนนต์
 * 7. phpMyAdmin & MySQL 8-Table Setup: คู่มือการติดตั้งและคำอธิบายฟิลด์ LONGTEXT
 * 8. WordPress Deployment: 4 วิธีติดตั้งบน WordPress พร้อมดาวน์โหลด Plugin PHP
 * 9. Multi-Page HD Thai PDF Exporter: ส่งออกคู่มือ 5 หน้า A4 คมชัดสูง สระครบ 100%
 * ============================================================================
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  BookOpen,
  Layers,
  Server,
  Database,
  Globe,
  Code2,
  CheckCircle2,
  Printer,
  ChevronRight,
  FolderGit2,
  Settings,
  Shield,
  FileCode,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Clock,
  ShieldCheck,
  Building2,
  QrCode,
  Laptop,
  Briefcase,
  Calculator,
  User,
  Terminal,
  Cpu,
  Play,
  Monitor,
  UserCheck,
  Wrench,
  FileSignature,
  Key,
  ArrowRight,
  AlertTriangle,
  FileSpreadsheet,
  Workflow,
  Search,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { generateWordPressPluginCode } from '../../utils/wordpressPluginHelper';
import { XingTaiLogo } from '../Common/XingTaiLogo';

export const SystemManual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'userguide' | 'localhost' | 'overview' | 'files' | 'mysql' | 'wordpress'>('userguide');
  const [selectedRoleGuide, setSelectedRoleGuide] = useState<'USER' | 'IT' | 'MANAGER' | 'ACC' | 'ADMIN'>('USER');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [copiedWpCode, setCopiedWpCode] = useState(false);
  const [copiedShortcode, setCopiedShortcode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const wpPluginCode = generateWordPressPluginCode(window.location.origin);

  const handleCopyWpCode = () => {
    navigator.clipboard.writeText(wpPluginCode);
    setCopiedWpCode(true);
    setTimeout(() => setCopiedWpCode(false), 2500);
  };

  const handleCopyShortcode = () => {
    navigator.clipboard.writeText('[xingtai_assets height="100vh"]');
    setCopiedShortcode(true);
    setTimeout(() => setCopiedShortcode(false), 2500);
  };

  const handleDownloadWpPlugin = () => {
    const blob = new Blob([wpPluginCode], { type: 'application/x-php;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'xingtai-asset-manager.php';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  /**
   * High-Definition Multi-Page Thai PDF Export Engine
   * Uses HTML-to-Image canvas rendering to ensure 100% Thai font accuracy,
   * proper tone mark positioning, crisp vector logos, and A4 page boundaries.
   */
  const handleExportPdf = async () => {
    if (!pdfTemplateRef.current) return;
    setIsExportingPdf(true);
    setPdfProgress(10);

    try {
      // Find all A4 page containers in the hidden printable template
      const pageElements = pdfTemplateRef.current.querySelectorAll<HTMLElement>('.pdf-a4-page');
      if (pageElements.length === 0) {
        throw new Error('ไม่พบเทมเพลตหน้าเอกสาร PDF');
      }

      // Initialize jsPDF with standard A4 portrait (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const totalPages = pageElements.length;

      for (let i = 0; i < totalPages; i++) {
        const pageEl = pageElements[i];
        setPdfProgress(Math.round(((i + 0.5) / totalPages) * 100));

        // Render page with HTML-to-Image at 2x pixel ratio for maximum sharpness
        const imgData = await toPng(pageEl, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Exact A4 portrait size (210mm x 297mm)
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      setPdfProgress(100);
      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`XingTai_Enterprise_System_Manual_TH_${dateStr}.pdf`);
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      alert(`เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ${err?.message || err}`);
    } finally {
      setIsExportingPdf(false);
      setPdfProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#111f3d] to-[#091122] border border-blue-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  ศูนย์คู่มือการใช้งาน & สถาปัตยกรรมระบบ (System & User Operations Manual)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-700 text-emerald-300">
                  Version 2.5 (5-Page Thai PDF Ready)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                คู่มือการใช้งานสำหรับพนักงานทุกระดับ (USER, IT, MANAGER, ACC, ADMIN), แผนภาพกระบวนการอนุมัติ 3 ลายเซ็น, การติดตั้งบน Localhost & WordPress, พจนานุกรมไฟล์ และการเชื่อมต่อ MySQL 8 ตาราง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
              title="พิมพ์เอกสารออกเครื่องพิมพ์"
            >
              <Printer className="w-4 h-4 text-zinc-300" />
              <span>พิมพ์คู่มือ (Print)</span>
            </button>

            <button
              onClick={handleDownloadWpPlugin}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>ดาวน์โหลด Plugin WP (.php)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-70"
            >
              {isExportingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังสร้าง PDF ภาษาไทย ({pdfProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดคู่มือ PDF 5 หน้า (ภาษาไทย)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSection('userguide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'userguide'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-zinc-900 text-amber-400 hover:text-white border border-amber-800/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>📖 คู่มือการใช้งานสำหรับแต่ละบทบาท (User Guide)</span>
        </button>

        <button
          onClick={() => setActiveSection('localhost')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'localhost'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-zinc-900 text-cyan-400 hover:text-white border border-cyan-800/60'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>⚡ ติดตั้ง Standalone บน Localhost (เครื่องตนเอง)</span>
        </button>

        <button
          onClick={() => setActiveSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. สถาปัตยกรรม & RBAC 5 ระดับ</span>
        </button>

        <button
          onClick={() => setActiveSection('files')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'files'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>2. พจนานุกรมไฟล์ & วิธีแก้ไขโค้ด</span>
        </button>

        <button
          onClick={() => setActiveSection('mysql')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'mysql'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>3. ฐานข้อมูล MySQL 8 ตาราง & phpMyAdmin</span>
        </button>

        <button
          onClick={() => setActiveSection('wordpress')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'wordpress'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>4. กรณีใช้งานบน WordPress (Plugin)</span>
        </button>
      </div>

      {/* SECTION: USER GUIDE BY ROLE */}
      {activeSection === 'userguide' && (
        <div className="space-y-6">
          {/* Quick Security & First Login Alert */}
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-zinc-900 border border-amber-600/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  ข้อกำหนดความปลอดภัยและการเข้าสู่ระบบครั้งแรก (First-Time Login)
                </h4>
                <p className="text-xs text-zinc-300 mt-0.5">
                  รหัสผ่านเริ่มต้นของพนักงานทุกคนคือ <code className="px-1.5 py-0.5 bg-black/60 text-amber-400 font-mono font-bold rounded">Lemony2026</code> เมื่อเข้าสู่ระบบครั้งแรก ระบบจะบังคับให้ตั้งรหัสผ่านใหม่ส่วนตัวทันทีก่อนเข้าใช้งาน
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ความปลอดภัยระดับองค์กร</span>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-blue-400" />
                  <span>เลือกบทบาทเพื่อดูขั้นตอนการใช้งาน (Role-Based Workflow Guide)</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  คลิกเลือกประเภทผู้ใช้งานเพื่อดูขั้นตอนการปฏิบัติงาน หน้าที่ และคู่มือการคลิกเมนูอย่างละเอียด
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <button
                onClick={() => setSelectedRoleGuide('USER')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRoleGuide === 'USER'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>1. พนักงานทั่วไป</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">USER (ถือครอง/แจ้งซ่อม)</div>
              </button>

              <button
                onClick={() => setSelectedRoleGuide('IT')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRoleGuide === 'IT'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>2. เจ้าหน้าที่ไอที</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">IT Specialist (ช่าง/ทะเบียน)</div>
              </button>

              <button
                onClick={() => setSelectedRoleGuide('MANAGER')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRoleGuide === 'MANAGER'
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>3. ผู้จัดการแผนก</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">MANAGER (อนุมัติใบโอน)</div>
              </button>

              <button
                onClick={() => setSelectedRoleGuide('ACC')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRoleGuide === 'ACC'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>4. ฝ่ายบัญชีการเงิน</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">ACC (ตรวจสอบทรัพย์สิน)</div>
              </button>

              <button
                onClick={() => setSelectedRoleGuide('ADMIN')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRoleGuide === 'ADMIN'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>5. ผู้ดูแลระบบ</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">ADMIN (จัดการสิทธิ์/DB)</div>
              </button>
            </div>

            {/* Role Guide Details Content */}
            <div className="mt-4 p-5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-4">
              {selectedRoleGuide === 'USER' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-300 font-mono text-xs font-bold">
                        ROLE: USER
                      </span>
                      <h5 className="font-bold text-white text-sm">
                        คู่มือสำหรับพนักงานทั่วไป (General Staff Guide)
                      </h5>
                    </div>
                    <span className="text-xs text-zinc-400">สิทธิ์: ดูทรัพย์สินตนเอง / เปิด Ticket / รับมอบทรัพย์สิน</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-blue-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. การตรวจสอบทรัพย์สินในความรับผิดชอบ (My Assets)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"ทะเบียนทรัพย์สิน (Assets)"</strong> เพื่อดูอุปกรณ์ไอที โน้ตบุ๊ก หรืออุปกรณ์สำนักงานที่ตนถือครอง<br />
                        - สามารถคลิกดูประวัติ รหัสทรัพย์สิน (Asset Code) และสถานะการรับประกัน<br />
                        - สามารถใช้มือถือเปิดกล้องสแกน QR Code บนสติกเกอร์ที่ติดอยู่บนตัวเครื่องเพื่อดูข้อมูลได้ทันที
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. การแจ้งซ่อม Helpdesk (Open IT Ticket)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"แจ้งซ่อม IT (Tickets)"</strong> &rarr; กดปุ่ม <strong>"+ เปิดแจ้งซ่อมใหม่"</strong><br />
                        - เลือกทรัพย์สินที่มีปัญหา ระบุอาการเสีย และเลือกระดับความเร่งด่วน (Urgent / Normal)<br />
                        - ระบบจะส่งเรื่องให้ฝ่ายไอทีทันที พร้อมแสดงตัวนับเวลา SLA Countdown แบบ Real-time
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>3. การลงลายมือชื่อรับมอบทรัพย์สิน (Custodian Signature)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เมื่อมีการโอนย้ายหรือเบิกอุปกรณ์ใหม่ เข้าเมนู <strong>"ใบโอนย้าย (Transfers)"</strong><br />
                        - คลิกดูใบโอนย้าย A4 ตรวจสอบความถูกต้องของรายการและอุปกรณ์<br />
                        - เซ็นชื่อในช่อง <strong>"ผู้รับมอบทรัพย์สิน (Receiver / Custodian Signature)"</strong> ผ่านหน้าจอสัมผัสหรือเมาส์
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-purple-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>4. การเปลี่ยนรหัสผ่านส่วนตัว (Security Profile)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - คลิกที่ชื่อผู้ใช้มุมขวาบน &rarr; เลือก <strong>"เปลี่ยนรหัสผ่าน"</strong><br />
                        - กำหนดรหัสผ่านใหม่ที่มีความยาวอย่างน้อย 6 ตัวอักษร เพื่อความปลอดภัยของบัญชี
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoleGuide === 'IT' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded bg-cyan-900/60 text-cyan-300 font-mono text-xs font-bold">
                        ROLE: IT Specialist
                      </span>
                      <h5 className="font-bold text-white text-sm">
                        คู่มือสำหรับเจ้าหน้าที่ไอที (IT Specialist Guide)
                      </h5>
                    </div>
                    <span className="text-xs text-zinc-400">สิทธิ์: จัดการทรัพย์สิน / สร้าง QR / ออกใบโอน / รับงานซ่อม</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. การลงทะเบียนทรัพย์สิน & พิมพ์ QR สติกเกอร์</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"ทะเบียนทรัพย์สิน (Assets)"</strong> &rarr; กด <strong>"+ เพิ่มทรัพย์สินใหม่"</strong> หรือนำเข้าจาก Excel<br />
                        - กรอก Serial Number, รุ่น, สเปก, สาขา, แผนก และผู้ถือครอง<br />
                        - กดปุ่ม <strong>"พิมพ์สติกเกอร์ QR / บาร์โค้ด"</strong> เพื่อติดสติกเกอร์ที่ตัวอุปกรณ์
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. การออกใบโอนย้าย A4 (Transfer Form Step 1: IT Sign)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"ใบโอนย้าย (Transfers)"</strong> &rarr; กด <strong>"+ สร้างใบโอนย้าย A4"</strong><br />
                        - เลือกรายการทรัพย์สิน ระบุสาขา/แผนกต้นทางและปลายทาง<br />
                        - เซ็นชื่อในฐานะ <strong>"ผู้จัดทำ / ฝ่ายไอที (Prepared By)"</strong> ใน Step 1
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>3. การรับเรื่องแจ้งซ่อม & ควบคุมเวลา SLA</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"แจ้งซ่อม IT (Tickets)"</strong> ตรวจสอบรายการใหม่ที่ยังไม่รับเรื่อง<br />
                        - กด <strong>"รับเรื่อง (Acknowledge)"</strong> &rarr; จ่ายงานให้ช่างผู้รับผิดชอบ<br />
                        - เมื่อซ่อมเสร็จ ให้บันทึกวิธีแก้ปัญหา, อะไหล่ที่เปลี่ยน และค่าใช้จ่าย &rarr; กด <strong>"ปิดงานซ่อม (Resolved)"</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-blue-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>4. สรุปปัญหาประจำสัปดาห์ & ซิงค์ MySQL</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"สรุปปัญหาประจำสัปดาห์ (Weekly Problems)"</strong> เพื่อดูรายงานภาพรวมส่งผู้บริหาร<br />
                        - เข้าเมนู <strong>"Admin &rarr; จัดการ MySQL"</strong> เพื่อกดซิงค์ข้อมูลลงฐานข้อมูลจริง
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoleGuide === 'MANAGER' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded bg-amber-900/60 text-amber-300 font-mono text-xs font-bold">
                        ROLE: MANAGER
                      </span>
                      <h5 className="font-bold text-white text-sm">
                        คู่มือสำหรับผู้จัดการแผนก (Department Manager Guide)
                      </h5>
                    </div>
                    <span className="text-xs text-zinc-400">สิทธิ์: ตรวจสอบทรัพย์สินแผนก / อนุมัติใบโอน Step 2</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. การพิจารณาอนุมัติใบโอนย้าย A4 (Step 2: Manager Sign)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เมื่อมีทรัพย์สินในสังกัดถูกย้ายหรือยืม จะมีการแจ้งเตือนในเมนู <strong>"ใบโอนย้าย (Transfers)"</strong><br />
                        - คลิกเปิดใบโอนย้าย A4 &rarr; ตรวจสอบเหตุผลและปลายทาง<br />
                        - เซ็นชื่ออนุมัติในช่อง <strong>"ผู้อนุมัติแผนกต้นทาง (Approved By Manager)"</strong> ใน Step 2
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-blue-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. การติดตามสถานะทรัพย์สินและงานซ่อมของทีม</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - ตรวจสอบรายการทรัพย์สินทั้งหมดที่สังกัดอยู่ในแผนกของตนเองในหน้า Dashboard<br />
                        - ติดตามความคืบหน้าของงานแจ้งซ่อม IT Ticket ของพนักงานในแผนกว่าได้รับการแก้ไขตาม SLA หรือไม่
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoleGuide === 'ACC' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-800">
                        ROLE: ACC (Accounting & Finance)
                      </span>
                      <h5 className="font-bold text-white text-sm">
                        คู่มือสำหรับฝ่ายบัญชีและการเงิน (Accounting & Controller Guide)
                      </h5>
                    </div>
                    <span className="text-xs text-zinc-400">สิทธิ์: ตรวจสอบมูลค่าทรัพย์สิน / อนุมัติตัดรอบบัญชี Step 3</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. การอนุมัติตรวจสอบบัญชีขั้นสุดท้าย (Step 3: Accounting Sign)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"ใบโอนย้าย (Transfers)"</strong> เลือกเอกสารที่ผ่าน Step 1 (IT) และ Step 2 (Manager) แล้ว<br />
                        - ตรวจสอบรหัสทรัพย์สินทางบัญชี มูลค่าต้นทุน และสาขาปลายทาง<br />
                        - ลงลายมือชื่อในช่อง <strong>"ฝ่ายบัญชีตรวจสอบ (Accounting Controller)"</strong> เพื่อปิดกระบวนการโอนย้ายอย่างสมบูรณ์
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. การตรวจสอบรายงานค่าเสื่อมและประวัติส่งซ่อม</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - ดูมูลค่ารวมทรัพย์สินแยกตามสาขาและแผนก<br />
                        - ตรวจสอบประวัติค่าใช้จ่ายซ่อมบำรุงในระบบ Helpdesk เพื่อนำไปบันทึกเป็นค่าใช้จ่ายทางบัญชีได้อย่างแม่นยำ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoleGuide === 'ADMIN' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded bg-purple-900/60 text-purple-300 font-mono text-xs font-bold">
                        ROLE: ADMIN
                      </span>
                      <h5 className="font-bold text-white text-sm">
                        คู่มือสำหรับผู้ดูแลระบบสูงสุด (Super Administrator Guide)
                      </h5>
                    </div>
                    <span className="text-xs text-zinc-400">สิทธิ์: สูงสุดทุกเมนู / จัดการพนักงาน / ปรับสิทธิ์ RBAC / MySQL Hub</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-purple-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. การจัดการพนักงาน & สิทธิ์ (Staff & RBAC Matrix)</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"Admin &rarr; จัดการพนักงาน"</strong> เพื่อเพิ่ม ลบ แก้ไขแผนก หรือรีเซ็ตรหัสผ่านพนักงาน<br />
                        - เข้าเมนู <strong>"กำหนดสิทธิ์ (Role Matrix)"</strong> เพื่อเปิด-ปิดสิทธิ์การเข้าถึงเมนูของแต่ละ Role ตามนโยบายบริษัท
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="font-bold text-blue-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. การควบคุมฐานข้อมูล MySQL 8 ตาราง & phpMyAdmin</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        - เข้าเมนู <strong>"Admin &rarr; จัดการ MySQL"</strong> เพื่อดาวน์โหลดไฟล์ SQL Dump, ตรวจสอบ Schema Inspector หรือกดซิงค์ข้อมูลผ่าน REST API Gateway<br />
                        - นำเข้าไฟล์ SQL สู่ phpMyAdmin สำหรับ Production Server
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visual 3-Signatures Approval Cycle Flowchart */}
          <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-emerald-400" />
              <span>แผนภาพกระบวนการอนุมัติ 3 ลายเซ็นดิจิทัล (3-Step Digital Signature Flow)</span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ตามระเบียบปฏิบัติของ <strong>บริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด</strong> การโอนย้าย ยืม คืน หรือเบิกทรัพย์สิน ต้องผ่านการลงลายมือชื่อดิจิทัล 3 ขั้นตอนอย่างเป็นทางการ:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-2">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-cyan-700/60 space-y-2 relative">
                <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <strong className="text-cyan-300 font-bold block text-sm">Step 1: IT Specialist</strong>
                <div className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong>ผู้จัดทำ / ฝ่ายไอที:</strong><br />
                  สร้างเอกสาร ระบุรายการอุปกรณ์ ตรวจสอบ Serial No. และเซ็นชื่อจัดทำ
                </div>
                <div className="pt-2 text-[10px] text-cyan-400 font-mono font-semibold">
                  STATUS: PENDING_MGR
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-700/60 space-y-2 relative">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <strong className="text-amber-300 font-bold block text-sm">Step 2: Dept Manager</strong>
                <div className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong>ผู้จัดการแผนกต้นทาง:</strong><br />
                  ตรวจสอบเหตุผลในการโอนย้าย และเซ็นชื่ออนุมัติการปล่อยทรัพย์สิน
                </div>
                <div className="pt-2 text-[10px] text-amber-400 font-mono font-semibold">
                  STATUS: PENDING_ACC
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-700/60 space-y-2 relative">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <strong className="text-emerald-300 font-bold block text-sm">Step 3: Accounting</strong>
                <div className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong>ฝ่ายบัญชีและการเงิน:</strong><br />
                  ตรวจสอบรหัสสินทรัพย์ มูลค่า และเซ็นชื่อตัดรอบบัญชีทรัพย์สิน
                </div>
                <div className="pt-2 text-[10px] text-emerald-400 font-mono font-semibold">
                  STATUS: APPROVED
                </div>
              </div>

              {/* Custodian */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-purple-700/60 space-y-2 relative">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </div>
                <strong className="text-purple-300 font-bold block text-sm">Receiver / Custodian</strong>
                <div className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong>ผู้รับมอบทรัพย์สิน:</strong><br />
                  ตรวจนับอุปกรณ์จริงและเซ็นชื่อยืนยันการรับของเข้าครอบครอง
                </div>
                <div className="pt-2 text-[10px] text-purple-400 font-mono font-semibold">
                  STATUS: COMPLETED
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 0: STANDALONE LOCALHOST INSTALLATION */}
      {activeSection === 'localhost' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-cyan-950/60 via-blue-950/50 to-slate-950/80 border border-cyan-700/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold shadow-lg">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    การติดตั้งและรันแบบ Standalone บน Localhost (เครื่องตนเอง)
                  </h3>
                  <p className="text-xs text-cyan-200/80">
                    รันเป็นเว็บแอปพลิเคชันเต็มหน้าจอ (Full Page Web App) ผ่าน Node.js + Express โดยไม่ต้องฝัง iframe หรือหน้าเพจ WordPress
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Stack Port 3000
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-[#0b101d] p-3.5 rounded-xl border border-cyan-900/50">
                <span className="text-zinc-400 block mb-0.5">ความต้องการระบบ (Prerequisites)</span>
                <strong className="text-white text-sm">Node.js v18+ หรือ v20+ LTS</strong>
                <p className="text-[11px] text-zinc-400 mt-1">พร้อม npm หรือ bun สำหรับติดตั้ง dependencies</p>
              </div>

              <div className="bg-[#0b101d] p-3.5 rounded-xl border border-cyan-900/50">
                <span className="text-zinc-400 block mb-0.5">ฐานข้อมูล (Database)</span>
                <strong className="text-white text-sm">MySQL / XAMPP / Laragon</strong>
                <p className="text-[11px] text-zinc-400 mt-1">หรือรันแบบ Browser Cache ออฟไลน์ได้ทันที</p>
              </div>

              <div className="bg-[#0b101d] p-3.5 rounded-xl border border-cyan-900/50">
                <span className="text-zinc-400 block mb-0.5">URL สำหรับเปิดใช้งาน</span>
                <strong className="text-cyan-400 font-mono text-sm">http://localhost:3000</strong>
                <p className="text-[11px] text-zinc-400 mt-1">รองรับกล้องสแกน QR, พิมพ์ A4 และส่ง Ticket</p>
              </div>
            </div>
          </div>

          {/* Step by Step Execution Guide */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>ขั้นตอนการติดตั้ง 4 สเต็ป (Step-by-Step Command)</span>
            </h4>

            {/* Step 1 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h5 className="font-bold text-white text-sm">แตกไฟล์โปรเจกต์ หรือ Clone มายังโฟลเดอร์ในเครื่อง</h5>
                </div>
                <button
                  onClick={() => copyToClipboard('cd xingtai-asset-system', 'step1')}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCmd === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'step1' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                เปิด Terminal / Command Prompt (CMD) หรือ PowerShell แล้วเข้าไปยังโฟลเดอร์โปรเจกต์:
              </p>
              <pre className="bg-black/60 p-3 rounded-xl border border-zinc-800 text-cyan-300 font-mono text-xs overflow-x-auto">
cd /path/to/xingtai-asset-system
              </pre>
            </div>

            {/* Step 2 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h5 className="font-bold text-white text-sm">ติดตั้ง Dependencies ทั้งหมด (npm install)</h5>
                </div>
                <button
                  onClick={() => copyToClipboard('npm install', 'step2')}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCmd === 'step2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'step2' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                คำสั่งนี้จะทำการดาวน์โหลด React, Express, Vite, Tailwind CSS, MySQL2 และเครื่องมือประมวลผล PDF/QR:
              </p>
              <pre className="bg-black/60 p-3 rounded-xl border border-zinc-800 text-emerald-400 font-mono text-xs overflow-x-auto">
npm install
              </pre>
            </div>

            {/* Step 3 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h5 className="font-bold text-white text-sm">ตั้งค่าไฟล์สภาพแวดล้อม (.env) เพื่อเชื่อมต่อ MySQL บนเครื่อง</h5>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
`MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=xingtai_db`,
                      'step3'
                    )
                  }
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCmd === 'step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'step3' ? 'คัดลอก .env' : 'คัดลอก .env'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                สร้างไฟล์ชื่อ <code className="text-cyan-300 font-bold font-mono">.env</code> ในรูทโฟลเดอร์ของโปรเจกต์ แล้วกำหนดค่า MySQL (หากใช้ XAMPP ปกติ User คือ root และไม่มี Password):
              </p>
              <pre className="bg-black/60 p-3 rounded-xl border border-zinc-800 text-amber-300 font-mono text-xs overflow-x-auto">
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=xingtai_db
              </pre>
            </div>

            {/* Step 4 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <h5 className="font-bold text-white text-sm">สั่งรันเซิร์ฟเวอร์ (เลือกระหว่าง Dev Mode หรือ Production)</h5>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard('npm run dev', 'devcmd')}
                    className="text-xs px-2.5 py-1 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'devcmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>คัดลอก dev</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard('npm run build && npm start', 'prodcmd')}
                    className="text-xs px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'prodcmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>คัดลอก build & start</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3.5 bg-black/40 border border-blue-900/40 rounded-xl space-y-1.5">
                  <strong className="text-cyan-300 font-bold block">โหมดทดสอบ & พัฒนา (Development):</strong>
                  <pre className="p-2 bg-zinc-950 rounded text-cyan-400 font-mono text-xs">npm run dev</pre>
                  <span className="text-zinc-400 text-[11px] block">
                    ระบบจะเปิดเซิร์ฟเวอร์ Express และ Vite Middleware พร้อมเปิดเบราว์เซอร์ที่ http://localhost:3000
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 border border-emerald-900/40 rounded-xl space-y-1.5">
                  <strong className="text-emerald-300 font-bold block">โหมดใช้งานจริง (Production Build):</strong>
                  <pre className="p-2 bg-zinc-950 rounded text-emerald-400 font-mono text-xs">npm run build && npm start</pre>
                  <span className="text-zinc-400 text-[11px] block">
                    สร้างไฟล์ Bundled Optimized HTML/JS/CSS พร้อมรัน Express Node.js Server ความเร็วสูงสุด
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Scripts for Windows & Linux */}
          <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>สคริปต์เปิดระบบคลิกเดียว (One-Click Launchers)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-zinc-200">1. Windows One-Click (start-system.bat)</strong>
                  <button
                    onClick={() =>
                      copyToClipboard(
`@echo off
title Xing Tai Enterprise Asset System
echo Starting Xing Tai Asset & Ticket System on Localhost...
cd /d %~dp0
call npm install
start http://localhost:3000
npm run dev
pause`,
                        'bat'
                      )
                    }
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'bat' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'bat' ? 'คัดลอกแล้ว' : 'คัดลอกไฟล์ .bat'}</span>
                  </button>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  สร้างไฟล์ <code className="text-cyan-300 font-mono">start-system.bat</code> ไว้ที่โฟลเดอร์โปรเจกต์ ดับเบิ้ลคลิกเพื่อเปิดระบบและเปิดเบราว์เซอร์อัตโนมัติ:
                </p>
                <pre className="bg-black/60 p-3 rounded-xl border border-zinc-800 text-zinc-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`@echo off
title Xing Tai Enterprise Asset System
echo Starting Xing Tai Asset & Ticket System on Localhost...
cd /d %~dp0
call npm install
start http://localhost:3000
npm run dev
pause`}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-zinc-200">2. macOS / Linux (start.sh)</strong>
                  <button
                    onClick={() =>
                      copyToClipboard(
`#!/bin/bash
echo "Starting Xing Tai Asset & Ticket System on Localhost..."
cd "$(dirname "$0")"
npm install
if which xdg-open > /dev/null; then
  xdg-open http://localhost:3000 &
elif which open > /dev/null; then
  open http://localhost:3000 &
fi
npm run dev`,
                        'sh'
                      )
                    }
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'sh' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'sh' ? 'คัดลอกแล้ว' : 'คัดลอกไฟล์ .sh'}</span>
                  </button>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  สร้างไฟล์ <code className="text-cyan-300 font-mono">start.sh</code> แล้วรันคำสั่ง <code className="text-cyan-300 font-mono">chmod +x start.sh && ./start.sh</code>:
                </p>
                <pre className="bg-black/60 p-3 rounded-xl border border-zinc-800 text-zinc-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`#!/bin/bash
echo "Starting Xing Tai Asset & Ticket System on Localhost..."
cd "$(dirname "$0")"
npm install
open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null &
npm run dev`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: ARCHITECTURE OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                FE
              </div>
              <h4 className="font-bold text-white text-sm">Frontend (React 19 & Tailwind v4)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                สร้างด้วย React 19 และ Tailwind CSS 4 รวดเร็ว น้ำหนักเบา รองรับ Responsive เต็มรูปแบบ พร้อมระบบสร้างแบบฟอร์ม A4 สำหรับสั่งพิมพ์ความคมชัดสูง
              </p>
              <div className="text-[11px] text-zinc-500 font-mono">
                Entry: /src/main.tsx, /src/App.tsx
              </div>
            </div>

            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
                BE
              </div>
              <h4 className="font-bold text-white text-sm">Backend API (Express & Node.js)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                เซิร์ฟเวอร์ Express ให้บริการ REST API endpoints สำหรับการซิงค์ข้อมูลลง MySQL, ตรวจสอบสถานะการเชื่อมต่อ และทำหน้าที่เสิร์ฟไฟล์ Single Page App
              </p>
              <div className="text-[11px] text-zinc-500 font-mono">
                Entry: /server.ts
              </div>
            </div>

            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                DB
              </div>
              <h4 className="font-bold text-white text-sm">Database (MySQL & phpMyAdmin)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                จัดเก็บข้อมูลแบบ Relational Database บน MySQL/MariaDB 8 ตารางหลัก ครอบคลุมทรัพย์สิน, ใบโอนย้าย 3 ลายเซ็น, บันทึกส่งซ่อม และสิทธิ์ผู้ใช้ RBAC
              </p>
              <div className="text-[11px] text-zinc-500 font-mono">
                Engine: MySQL 5.7+ / 8.0+ / MariaDB
              </div>
            </div>
          </div>

          {/* RBAC Matrix Table */}
          <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ตารางสิทธิ์การใช้งาน 5 ระดับ (RBAC 5-Tier Permission Matrix)</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-300">
                <thead className="bg-zinc-900/80 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Role</th>
                    <th className="p-3">บทบาทและหน้าที่</th>
                    <th className="p-3">ขอบเขตสิทธิ์ในระบบ</th>
                    <th className="p-3">การอนุมัติใบโอน A4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-sans">
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 font-bold text-purple-400 font-mono">ADMIN</td>
                    <td className="p-3 text-zinc-200">ผู้ดูแลระบบสูงสุด</td>
                    <td className="p-3 text-zinc-400">เข้าถึงทุกเมนู, ปรับสิทธิ์ RBAC, นำเข้า/ส่งออก MySQL, จัดการพนักงาน</td>
                    <td className="p-3 text-emerald-400 font-semibold">อนุมัติได้ทุกขั้นตอน</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 font-bold text-cyan-400 font-mono">IT Specialist</td>
                    <td className="p-3 text-zinc-200">ฝ่ายเทคโนโลยีสารสนเทศ</td>
                    <td className="p-3 text-zinc-400">จัดการทะเบียนทรัพย์สิน, พิมพ์สติกเกอร์ QR, รับเรื่อง Ticket, จ่ายงานซ่อม</td>
                    <td className="p-3 text-cyan-400">อนุมัติ Step 1 (ผู้จัดทำ/ฝ่ายไอที)</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 font-bold text-amber-400 font-mono">MANAGER</td>
                    <td className="p-3 text-zinc-200">ผู้จัดการแผนก</td>
                    <td className="p-3 text-zinc-400">ดูทรัพย์สินแผนก, อนุมัติยืม/ย้าย, ดูรายงานภาพรวม</td>
                    <td className="p-3 text-amber-400">อนุมัติ Step 2 (ผจก. แผนกต้นทาง)</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 font-bold text-emerald-400 font-mono">ACC</td>
                    <td className="p-3 text-zinc-200">ฝ่ายบัญชีและการเงิน</td>
                    <td className="p-3 text-zinc-400">ตรวจมูลค่าต้นทุน, ตรวจสอบสินทรัพย์ตัดจำหน่ายและค่าเสื่อม</td>
                    <td className="p-3 text-emerald-400">อนุมัติ Step 3 (ฝ่ายบัญชีควบคุม)</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 font-bold text-zinc-400 font-mono">USER</td>
                    <td className="p-3 text-zinc-200">พนักงานทั่วไป</td>
                    <td className="p-3 text-zinc-400">ดูทรัพย์สินที่ตนถือครอง, เปิดแจ้งซ่อม Helpdesk Ticket, ดูประวัติการใช้งาน</td>
                    <td className="p-3 text-zinc-500">ดูรายการที่เกี่ยวข้อง</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FILE DICTIONARY */}
      {activeSection === 'files' && (
        <div className="space-y-4">
          <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-blue-400" />
              <span>พจนานุกรมไฟล์โครงสร้างระบบ (Source Code & File Reference)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-blue-400">
                  <span>/server.ts</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-300 rounded">Node.js Express</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  เซิร์ฟเวอร์ Express สำหรับรันระบบทั้งในโหมดพัฒนาและ Production, จัดการ MySQL Connection Pool (<code className="text-cyan-300">mysql2/promise</code>) และให้บริการ API Endpoints: <code className="text-cyan-300">GET /api/db/status</code>, <code className="text-cyan-300">POST /api/db/sync</code>, <code className="text-cyan-300">GET /api/db/data</code>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-blue-400">
                  <span>/src/App.tsx</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-300 rounded">State Hub & RBAC</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  ตัวควบคุมศูนย์กลางของแอปพลิเคชัน จัดการสถานะ Authentication, การเปลี่ยนรหัสผ่านครั้งแรก, การเปิด-ปิด Modal ต่างๆ, ระบบค้นหา Global Search, และการกระจายข้อมูล Props ไปยังแต่ละหน้า
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-emerald-400">
                  <span>/src/components/Transfers/TransferFormA4Modal.tsx</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded">A4 Form & Signature Engine</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  แสดงผลใบโอนย้ายทรัพย์สิน A4 มาตรฐาน 3 ภาษา (ไทย, อังกฤษ, จีน) พร้อมระบบ 3 ลายเซ็นดิจิทัล (IT &rarr; Manager &rarr; ACC) รองรับการตั้งค่ากล่องลายเซ็น 9 กล่อง, การสเกลขนาด A4 Fit, และการพิมพ์ออกเครื่องพิมพ์หรือ PDF คมชัดสมบูรณ์
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-purple-400">
                  <span>/src/components/Auth/LoginScreen.tsx</span>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-950 text-purple-300 rounded">Dual-Pane Portal</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  หน้าต่าง Login แบบ Dual-Pane พรีเมียม พร้อม Hero Status Card, การตรวจสอบรหัสผ่านอย่างปลอดภัย และการแสดงตราสัญลักษณ์ XingTaiLogo รองรับ Production เต็มรูปแบบ
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-amber-400">
                  <span>/src/components/Assets/AssetInventory.tsx</span>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-950 text-amber-300 rounded">Inventory & QR Scanner</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  ตารางทะเบียนทรัพย์สิน ค้นหา กรองสถานะ สแกน QR ตรวจสอบทรัพย์สิน และพิมพ์สติกเกอร์บาร์โค้ดขนาดมาตรฐาน
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-cyan-400">
                  <span>/src/components/Tickets/TicketList.tsx</span>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-950 text-cyan-300 rounded">Helpdesk & SLA Engine</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  ระบบเปิดใบแจ้งซ่อม ติดตามสถานะงานช่างไอที SLA Countdown และบันทึกประวัติค่าใช้จ่ายส่งซ่อมภายนอก
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-indigo-400">
                  <span>/src/services/mysqlService.ts</span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded">Database Metadata & DDL</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  นิยามโครงสร้าง Schema 8 ตาราง, ตัวสร้าง DDL/DML <code className="text-cyan-300">xingtai_db.sql</code> อัตโนมัติ, Schema Inspector Metadata, และตัวสร้างชุดไฟล์ PHP API Gateway (<code className="text-cyan-300">api.php</code>, <code className="text-cyan-300">db_config.php</code>)
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-rose-400">
                  <span>/src/components/Admin/MySQLManager.tsx</span>
                  <span className="text-[10px] px-2 py-0.5 bg-rose-950 text-rose-300 rounded">Database Control Hub</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  ศูนย์ควบคุม MySQL, ทดสอบการเชื่อมต่อ (Live Ping), นำเข้า/ส่งออก SQL Dump, ดู Schema Inspector ทุกตาราง และดาวน์โหลดชุดเชื่อมต่อ PHP Gateway
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MYSQL & PHPMYADMIN */}
      {activeSection === 'mysql' && (
        <div className="space-y-4">
          <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>ขั้นตอนการติดตั้ง MySQL & phpMyAdmin สำหรับระบบ Xing Tai (8 ตารางหลัก)</span>
            </h4>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">1. การสร้าง Database</strong>
                <p className="text-zinc-300">
                  เข้าสู่ phpMyAdmin &rarr; คลิก <strong>New</strong> &rarr; ตั้งชื่อฐานข้อมูล: <code className="text-cyan-300 font-mono font-bold">xingtai_db</code> &rarr; เลือกการเข้ารหัส (Collation): <code className="text-cyan-300 font-mono font-bold">utf8mb4_unicode_ci</code> &rarr; กด Create
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">2. การนำเข้า Schema & ข้อมูลเริ่มต้น (8 Tables with LONGTEXT Signatures)</strong>
                <p className="text-zinc-300">
                  ไปที่แท็บ <strong>Import</strong> ใน phpMyAdmin &rarr; เลือกไฟล์ <code className="text-cyan-300 font-mono font-bold">xingtai_db.sql</code> ที่ดาวน์โหลดจากเมนู <strong>Admin &rarr; จัดการ MySQL</strong> &rarr; กด <strong>Go</strong> เพื่อรันคำสั่งสร้างตารางทั้ง 8 ตาราง:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-cyan-400">
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">1. branches</div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">2. departments</div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">3. users</div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">4. assets</div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">5. transfer_forms</div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">6. it_tickets</div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">7. weekly_problems</div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">8. system_settings</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">3. การกำหนดค่าใน .env</strong>
                <p className="text-zinc-300">
                  ระบุตัวแปรสภาพแวดล้อมเพื่อเชื่อมต่อไปยังเซิร์ฟเวอร์ MySQL:
                </p>
                <pre className="mt-1 bg-zinc-950 p-2.5 rounded text-emerald-400 font-mono text-[11px]">
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=xingtai_db
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1.5">
                <strong className="text-white block font-bold">4. หมายเหตุความปลอดภัยของฟิลด์ LONGTEXT สำหรับลายเซ็น</strong>
                <p className="text-zinc-300 text-[11px]">
                  ฟิลด์ลายเซ็น <code className="text-cyan-300 font-mono">signature_data</code>, <code className="text-cyan-300 font-mono">it_signature</code>, <code className="text-cyan-300 font-mono">manager_signature</code>, <code className="text-cyan-300 font-mono">acc_signature</code> และ <code className="text-cyan-300 font-mono">receiver_signature</code> ถูกกำหนดเป็นประเภท <code className="text-emerald-400 font-mono font-bold">LONGTEXT</code> เพื่อรองรับรูปภาพ Base64 ความละเอียดสูงโดยไม่มีปัญหาข้อมูลถูกตัดทอน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WORDPRESS INTEGRATION */}
      {activeSection === 'wordpress' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method 1 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="font-bold text-white text-sm">วิธีที่ 1: ติดตั้งผ่าน WordPress Plugin (แนะนำ)</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                1. กดปุ่ม <strong>"ดาวน์โหลด Plugin WP"</strong> ด้านบน<br />
                2. นำไฟล์ <code className="text-cyan-300 font-mono">xingtai-asset-manager.php</code> ไปวางในโฟลเดอร์ <code className="text-cyan-300 font-mono">/wp-content/plugins/xingtai-asset-manager/</code> บน Hosting หรือใส่ใน zip แล้วกด Add New Plugin ใน WordPress Admin<br />
                3. กด <strong>Activate Plugin</strong><br />
                4. ในหน้าเพจของ WordPress ให้พิมพ์ Shortcode:
              </p>
              <div className="flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-zinc-800 font-mono text-xs text-cyan-300">
                <span>[xingtai_assets height="100vh"]</span>
                <button
                  onClick={handleCopyShortcode}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                  title="คัดลอก Shortcode"
                >
                  {copiedShortcode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Method 2 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="font-bold text-white text-sm">วิธีที่ 2: วางใน Elementor หรือ Gutenberg HTML</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                หากใช้ Elementor หรือ Gutenberg สามารถเพิ่มวิดเจ็ต <strong>Custom HTML</strong> แล้วใส่โค้ด iframe นี้ได้ทันที:
              </p>
              <pre className="bg-black/50 p-2.5 rounded-lg border border-zinc-800 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed select-all">
{`<iframe 
  src="${window.location.origin}" 
  style="width:100%; height:950px; border:none; border-radius:12px;" 
  allow="camera; clipboard-read; clipboard-write;"
></iframe>`}
              </pre>
            </div>

            {/* Method 3 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="font-bold text-white text-sm">วิธีที่ 3: Build & อัปโหลดไปยังโฟลเดอร์ย่อย</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                1. รันคำสั่ง <code className="text-cyan-300 font-mono">npm run build</code> เพื่อสร้างไฟล์ HTML/JS/CSS ในโฟลเดอร์ <code className="text-cyan-300 font-mono">/dist</code><br />
                2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์ <code className="text-cyan-300 font-mono">dist</code> ไปไว้ที่โฟลเดอร์ของ WordPress เช่น <code className="text-cyan-300 font-mono">public_html/assets/</code><br />
                3. สามารถเข้าสู่ระบบได้ที่ <code className="text-cyan-300 font-mono">https://your-domain.com/assets/</code> โดยตรง
              </p>
            </div>

            {/* Method 4 */}
            <div className="bg-[#111420] border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  4
                </div>
                <h4 className="font-bold text-white text-sm">วิธีที่ 4: เชื่อมต่อผ่าน MySQL เดียวกับ WordPress</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ระบบ Xing Tai สามารถใช้ฐานข้อมูล MySQL เดียวกับ WordPress ได้ โดยเพียงแค่นำเข้าตารางทั้ง 8 ตารางลงใน Database ของ WordPress ผ่าน phpMyAdmin เพื่อรวมศูนย์ข้อมูลและการสำรองข้อมูลไว้ในที่เดียว
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN PRINTABLE / PDF GENERATION TEMPLATE (A4 HIGH-RESOLUTION 5 THAI PAGES) */}
      {/* ========================================================================= */}
      <div className="overflow-hidden h-0 w-0 opacity-0 pointer-events-none fixed -top-[10000px] -left-[10000px]">
        <div ref={pdfTemplateRef} className="font-sans text-zinc-900 bg-white">
          
          {/* ==================== PAGE 1: COVER, ARCHITECTURE & RBAC ==================== */}
          <div className="pdf-a4-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border text-zinc-900 relative">
            <div>
              {/* Header */}
              <div className="border-b-2 border-blue-900 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center text-white font-extrabold text-lg shadow">
                    XT
                  </div>
                  <div>
                    <h1 className="text-lg font-extrabold text-blue-950 tracking-tight">
                      บริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด
                    </h1>
                    <div className="text-[11px] font-semibold text-zinc-600">
                      XING TAI TRADING (THAILAND) CO., LTD.
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-blue-900 text-white rounded font-bold text-xs">
                    SYSTEM MANUAL & USER SPECIFICATION
                  </span>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Version 2.5 (Enterprise Edition)
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="my-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-xl shadow-md">
                <h2 className="text-xl font-bold">
                  คู่มือสถาปัตยกรรมระบบ, การบริหารสิทธิ์ RBAC & คู่มือการปฏิบัติงาน
                </h2>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Enterprise Asset Governance, 3-Step Approval Transfer Forms, IT Helpdesk SLA & MySQL Architecture
                </p>
              </div>

              {/* Section 1: System Overview */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-blue-950 border-b border-zinc-300 pb-1 mb-2.5 flex items-center gap-1.5">
                  <span>1. ภาพรวมสถาปัตยกรรม 3-Tier Enterprise</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <div className="font-bold text-blue-900 mb-1">1. Frontend Layer</div>
                    <div className="text-[11px] text-zinc-700 leading-relaxed">
                      React 19 + TypeScript + Vite + Tailwind CSS 4 ออกแบบเป็น Single Page Application (SPA) รองรับ Responsive และพิมพ์เอกสาร A4 คมชัดสูง
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <div className="font-bold text-blue-900 mb-1">2. Backend API Layer</div>
                    <div className="text-[11px] text-zinc-700 leading-relaxed">
                      Node.js Express Server พร้อม Connection Pool เชื่อมต่อไปยัง MySQL พร้อม API Endpoint สำหรับซิงค์ข้อมูลและตรวจสอบสถานะระบบ
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <div className="font-bold text-blue-900 mb-1">3. Database Layer</div>
                    <div className="text-[11px] text-zinc-700 leading-relaxed">
                      MySQL 5.7+ / 8.0+ / MariaDB จัดเก็บ 8 ตารางหลัก รองรับ utf8mb4_unicode_ci และสามารถบริหารจัดการผ่าน phpMyAdmin ได้ 100%
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: RBAC Matrix */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-blue-950 border-b border-zinc-300 pb-1 mb-2.5 flex items-center gap-1.5">
                  <span>2. ตารางสิทธิ์การใช้งาน 5 ระดับ (RBAC 5-Tier Permission Matrix)</span>
                </h3>
                <table className="w-full text-xs text-left border border-zinc-300 border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
                      <th className="p-2 border-r border-zinc-300 w-24">Role</th>
                      <th className="p-2 border-r border-zinc-300">บทบาทและหน้าที่</th>
                      <th className="p-2 border-r border-zinc-300">ขอบเขตสิทธิ์ในระบบ</th>
                      <th className="p-2">การอนุมัติใบโอน A4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-[11px] text-zinc-800">
                    <tr>
                      <td className="p-2 font-bold text-purple-800 border-r border-zinc-200">ADMIN</td>
                      <td className="p-2 border-r border-zinc-200">ผู้ดูแลระบบสูงสุด</td>
                      <td className="p-2 border-r border-zinc-200">เข้าถึงทุกเมนู, ปรับสิทธิ์ RBAC, นำเข้า/ส่งออก MySQL, จัดการพนักงาน</td>
                      <td className="p-2 font-bold text-emerald-700">อนุมัติได้ทุกขั้นตอน</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-cyan-800 border-r border-zinc-200">IT Specialist</td>
                      <td className="p-2 border-r border-zinc-200">ฝ่ายเทคโนโลยีสารสนเทศ</td>
                      <td className="p-2 border-r border-zinc-200">จัดการทะเบียนทรัพย์สิน, พิมพ์สติกเกอร์ QR, รับเรื่อง Ticket, จ่ายงานซ่อม</td>
                      <td className="p-2 text-cyan-800">อนุมัติ Step 1 (ผู้จัดทำ/ฝ่ายไอที)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-amber-800 border-r border-zinc-200">MANAGER</td>
                      <td className="p-2 border-r border-zinc-200">ผู้จัดการแผนก</td>
                      <td className="p-2 border-r border-zinc-200">ดูทรัพย์สินแผนก, อนุมัติยืม/ย้าย, ดูรายงานภาพรวม</td>
                      <td className="p-2 text-amber-800">อนุมัติ Step 2 (ผจก. แผนกต้นทาง)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-emerald-800 border-r border-zinc-200">ACC</td>
                      <td className="p-2 border-r border-zinc-200">ฝ่ายบัญชีและการเงิน</td>
                      <td className="p-2 border-r border-zinc-200">ตรวจมูลค่าต้นทุน, ตรวจสอบสินทรัพย์ตัดจำหน่ายและค่าเสื่อม</td>
                      <td className="p-2 text-emerald-800">อนุมัติ Step 3 (ฝ่ายบัญชีควบคุม)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-zinc-700 border-r border-zinc-200">USER</td>
                      <td className="p-2 border-r border-zinc-200">พนักงานทั่วไป</td>
                      <td className="p-2 border-r border-zinc-200">ดูทรัพย์สินที่ตนถือครอง, เปิดแจ้งซ่อม Helpdesk Ticket, ดูประวัติการใช้งาน</td>
                      <td className="p-2 text-zinc-500">ดูรายการที่เกี่ยวข้อง</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Security & Approvals */}
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg text-xs text-zinc-800 space-y-1">
                <div className="font-bold text-blue-950">มาตรฐานความปลอดภัยและกระบวนการอนุมัติ 3 ลายเซ็น:</div>
                <div className="text-[11px] text-zinc-700 leading-relaxed">
                  ระบบบังคับใช้กระบวนการ 3 ลายเซ็นดิจิทัลตามมาตรฐานองค์กร: <strong>IT Specialist &rarr; Dept Manager &rarr; Accounting Controller</strong> เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้ 100% พร้อมระบบบันทึก Audit Log และการป้องกันข้อมูลระดับ Enterprise
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-300 pt-2.5 flex items-center justify-between text-[10px] text-zinc-500">
              <span>บริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด • ฝ่ายเทคโนโลยีสารสนเทศ</span>
              <span>หน้าที่ 1 จาก 5</span>
            </div>
          </div>

          {/* ==================== PAGE 2: USER WORKFLOWS & 3 SIGNATURES ==================== */}
          <div className="pdf-a4-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border text-zinc-900 relative">
            <div>
              {/* Header */}
              <div className="border-b-2 border-blue-900 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white font-extrabold text-base">
                    XT
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-blue-950">
                      คู่มือการใช้งานตามบทบาท & กระบวนการอนุมัติ (User Workflows)
                    </h2>
                    <div className="text-[10px] text-zinc-600">
                      Role-Based Operation Guidelines & 3-Step Signature Approval Cycle
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-zinc-500 font-mono">
                  SECTION 2: USER OPERATIONS GUIDE
                </div>
              </div>

              {/* Workflows */}
              <div className="mt-4 space-y-3.5 text-xs">
                {/* 1. Login */}
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-xs mb-1">
                    1. การเข้าสู่ระบบครั้งแรก (First-Time Login & Security)
                  </div>
                  <p className="text-[11px] text-zinc-700 leading-relaxed">
                    พนักงานทุกคนใช้รหัสผ่านเริ่มต้น <code className="font-mono font-bold text-blue-900">Lemony2026</code> ในการเข้าสู่ระบบครั้งแรก ระบบจะบังคับให้เปลี่ยนรหัสผ่านส่วนตัวทันทีก่อนเข้าใช้งานเพื่อความปลอดภัย
                  </p>
                </div>

                {/* 2. 3-Signatures */}
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-xs mb-1">
                    2. ขั้นตอนการอนุมัติใบโอนย้ายทรัพย์สิน A4 (3-Step Signature Workflow)
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                    <div className="p-2 bg-cyan-50 border border-cyan-200 rounded">
                      <strong className="text-cyan-950 block">Step 1: IT Specialist</strong>
                      <span>สร้างเอกสาร ตรวจสอบ Serial No. และเซ็นชื่อจัดทำ</span>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                      <strong className="text-amber-950 block">Step 2: Dept Manager</strong>
                      <span>ผู้จัดการแผนกต้นทางพิจารณาและเซ็นชื่ออนุมัติ</span>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
                      <strong className="text-emerald-950 block">Step 3: Accounting</strong>
                      <span>ฝ่ายบัญชีตรวจสอบมูลค่าและเซ็นชื่อตัดรอบบัญชี</span>
                    </div>
                  </div>
                </div>

                {/* 3. Helpdesk SLA */}
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-xs mb-1">
                    3. การแจ้งซ่อม IT Helpdesk & ตารางเวลา SLA Countdown
                  </div>
                  <p className="text-[11px] text-zinc-700 leading-relaxed">
                    พนักงานสามารถเปิด Ticket แจ้งปัญหาได้ตลอด 24 ชั่วโมง โดยระบบมีมาตรฐานเวลา SLA ในการปิดงานซ่อม:
                  </p>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] text-center font-semibold">
                    <div className="p-1.5 bg-red-50 text-red-900 border border-red-200 rounded">Critical: ภายใน 4 ชม.</div>
                    <div className="p-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded">High: ภายใน 8 ชม.</div>
                    <div className="p-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded">Medium: ภายใน 24 ชม.</div>
                    <div className="p-1.5 bg-zinc-100 text-zinc-800 border border-zinc-200 rounded">Low: ภายใน 48 ชม.</div>
                  </div>
                </div>

                {/* 4. QR Scanner */}
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-xs mb-1">
                    4. การสแกน QR Code ตรวจนับทรัพย์สิน & พิมพ์สติกเกอร์บาร์โค้ด
                  </div>
                  <p className="text-[11px] text-zinc-700 leading-relaxed">
                    เจ้าหน้าที่สามารถใช้กล้องบนสมาร์ตโฟนหรือแท็บเล็ตสแกน QR Code บนสติกเกอร์ที่ติดอยู่บนเครื่องเพื่อตรวจสอบสถานะ ประวัติการโอนย้าย และประวัติการส่งซ่อมได้ทันที
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-300 pt-2.5 flex items-center justify-between text-[10px] text-zinc-500">
              <span>บริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด • คู่มือการปฏิบัติงานสำหรับผู้ใช้งาน</span>
              <span>หน้าที่ 2 จาก 5</span>
            </div>
          </div>

          {/* ==================== PAGE 3: SOURCE CODE & FILE DICTIONARY ==================== */}
          <div className="pdf-a4-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border text-zinc-900 relative">
            <div>
              {/* Header */}
              <div className="border-b-2 border-blue-900 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white font-extrabold text-base">
                    XT
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-blue-950">
                      พจนานุกรมไฟล์โครงสร้างระบบ (Source Code & File Reference)
                    </h2>
                    <div className="text-[10px] text-zinc-600">
                      Xing Tai Enterprise Asset Management System
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-zinc-500 font-mono">
                  SECTION 3: SOURCE CODE DICTIONARY
                </div>
              </div>

              {/* Content List */}
              <div className="mt-4 space-y-2.5 text-xs">
                {/* 1 */}
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex items-center justify-between font-mono font-bold text-blue-900 text-xs">
                    <span>/server.ts</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-sans">Node.js / Express</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-1 leading-relaxed">
                    <strong>หน้าที่หลัก:</strong> เซิร์ฟเวอร์ Express สำหรับรันระบบทั้งในโหมดพัฒนาและ Production, จัดการ MySQL Connection Pool (<code className="text-blue-800">mysql2/promise</code>) และให้บริการ API Endpoints: <code className="text-blue-800">GET /api/db/status</code>, <code className="text-blue-800">POST /api/db/sync</code>, <code className="text-blue-800">GET /api/db/data</code>
                  </p>
                </div>

                {/* 2 */}
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex items-center justify-between font-mono font-bold text-blue-900 text-xs">
                    <span>/src/App.tsx</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-sans">State Hub & RBAC</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-1 leading-relaxed">
                    <strong>หน้าที่หลัก:</strong> ตัวควบคุมศูนย์กลางของแอปพลิเคชัน จัดการสถานะ Authentication, การเปลี่ยนรหัสผ่านครั้งแรก, การเปิด-ปิด Modal ต่างๆ, ระบบค้นหา Global Search, และการกระจายข้อมูล Props ไปยังแต่ละหน้า
                  </p>
                </div>

                {/* 3 */}
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex items-center justify-between font-mono font-bold text-blue-900 text-xs">
                    <span>/src/components/Transfers/TransferFormA4Modal.tsx</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans">A4 Form & Signature Engine</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-1 leading-relaxed">
                    <strong>หน้าที่หลัก:</strong> แสดงผลใบโอนย้ายทรัพย์สิน A4 มาตรฐาน 3 ภาษา (ไทย, อังกฤษ, จีน) พร้อมระบบ 3 ลายเซ็นดิจิทัล (IT &rarr; Manager &rarr; ACC) รองรับการตั้งค่ากล่องลายเซ็น 9 กล่อง, การสเกลขนาด A4 Fit, และการพิมพ์ออกเครื่องพิมพ์หรือ PDF คมชัดสมบูรณ์
                  </p>
                </div>

                {/* 4 */}
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex items-center justify-between font-mono font-bold text-blue-900 text-xs">
                    <span>/src/components/Auth/LoginScreen.tsx</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-sans">Production Auth Portal</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-1 leading-relaxed">
                    <strong>หน้าที่หลัก:</strong> หน้าต่าง Login แบบ Dual-Pane พรีเมียม พร้อม Hero Status Card, การตรวจสอบรหัสผ่านอย่างปลอดภัย และการแสดงตราสัญลักษณ์ XingTaiLogo
                  </p>
                </div>

                {/* 5 */}
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex items-center justify-between font-mono font-bold text-blue-900 text-xs">
                    <span>/src/components/Tickets/TicketList.tsx</span>
                    <span className="text-[10px] px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded font-sans">Helpdesk & SLA Engine</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-1 leading-relaxed">
                    <strong>หน้าที่หลัก:</strong> ระบบเปิดใบแจ้งซ่อม ติดตามสถานะงานช่างไอที SLA Countdown และบันทึกประวัติค่าใช้จ่ายส่งซ่อมภายนอก
                  </p>
                </div>

                {/* 6 */}
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex items-center justify-between font-mono font-bold text-blue-900 text-xs">
                    <span>/src/services/mysqlService.ts & /src/components/Admin/MySQLManager.tsx</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-sans">Database Bridge</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-1 leading-relaxed">
                    <strong>หน้าที่หลัก:</strong> นิยาม 8 ตารางหลัก, ตัวสร้างไฟล์ DDL/DML <code className="text-blue-800">xingtai_db.sql</code> อัตโนมัติ, ซิงค์ข้อมูล, ตรวจสอบสถานะการเชื่อมต่อ และตัวสร้างชุดไฟล์ PHP API Gateway
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-300 pt-2.5 flex items-center justify-between text-[10px] text-zinc-500">
              <span>บริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด • เอกสารอ้างอิงโครงสร้างซอร์สโค้ด</span>
              <span>หน้าที่ 3 จาก 5</span>
            </div>
          </div>

          {/* ==================== PAGE 4: WORDPRESS DEPLOYMENT GUIDE ==================== */}
          <div className="pdf-a4-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border text-zinc-900 relative">
            <div>
              {/* Header */}
              <div className="border-b-2 border-blue-900 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white font-extrabold text-base">
                    XT
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-blue-950">
                      คู่มือการนำระบบไปติดตั้งบน WordPress (WordPress Deployment Guide)
                    </h2>
                    <div className="text-[10px] text-zinc-600">
                      4 วิธีการติดตั้งสำหรับสภาพแวดล้อมองค์กร
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-zinc-500 font-mono">
                  SECTION 4: WORDPRESS INTEGRATION
                </div>
              </div>

              {/* 4 Methods */}
              <div className="mt-4 space-y-3.5 text-xs">
                {/* Method 1 */}
                <div className="p-3.5 bg-zinc-50 border border-blue-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-sm mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs">1</span>
                    <span>วิธีที่ 1: ติดตั้งผ่าน WordPress Plugin สำเร็จรูป (แนะนำ)</span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-zinc-700 space-y-1 pl-1 leading-relaxed">
                    <li>ดาวน์โหลดไฟล์ <code className="font-mono text-blue-900 font-bold">xingtai-asset-manager.php</code> จากปุ่มในระบบ</li>
                    <li>นำไฟล์ไปวางในโฟลเดอร์ <code className="font-mono text-blue-900">/wp-content/plugins/xingtai-asset-manager/</code> บนเว็บโฮสติ้ง หรือ Zip แล้วอัปโหลดผ่าน WordPress Admin</li>
                    <li>ไปที่เมนู <strong>Plugins &rarr; Installed Plugins</strong> แล้วกด <strong>Activate</strong></li>
                    <li>สร้างหน้าเพจใหม่ (Page) แล้ววาง Shortcode: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-900">[xingtai_assets height="100vh"]</code></li>
                  </ol>
                </div>

                {/* Method 2 */}
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-sm mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs">2</span>
                    <span>วิธีที่ 2: ฝังผ่าน Elementor หรือ Gutenberg Custom HTML Block</span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-zinc-700 space-y-1 pl-1 leading-relaxed">
                    <li>เปิดหน้าแก้ไขของ Elementor หรือ Gutenberg Block Editor</li>
                    <li>เพิ่มวิดเจ็ต <strong>Custom HTML</strong> แล้วใส่โค้ด iframe:</li>
                  </ol>
                  <div className="mt-1.5 p-2 bg-zinc-900 text-cyan-300 font-mono text-[10px] rounded border border-zinc-700">
                    &lt;iframe src="{window.location.origin}" style="width:100%; height:950px; border:none; border-radius:12px;" allow="camera; clipboard-read; clipboard-write;"&gt;&lt;/iframe&gt;
                  </div>
                </div>

                {/* Method 3 */}
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-sm mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs">3</span>
                    <span>วิธีที่ 3: Build และอัปโหลดไปยังโฟลเดอร์ย่อย (Subdirectory)</span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-zinc-700 space-y-1 pl-1 leading-relaxed">
                    <li>รันคำสั่ง <code className="font-mono text-blue-900 font-bold">npm run build</code> เพื่อสร้างไฟล์ HTML/JS/CSS ในโฟลเดอร์ <code className="font-mono text-blue-900">/dist</code></li>
                    <li>อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์ <code className="font-mono text-blue-900">dist</code> ไปไว้ที่โฟลเดอร์ของ WordPress เช่น <code className="font-mono text-blue-900">public_html/assets/</code></li>
                    <li>สามารถเข้าสู่ระบบได้ที่ <code className="font-mono text-blue-900 font-bold">https://your-domain.com/assets/</code> โดยตรง รวดเร็วและปลอดภัย</li>
                  </ol>
                </div>

                {/* Method 4 */}
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 text-sm mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs">4</span>
                    <span>วิธีที่ 4: เชื่อมต่อผ่านฐานข้อมูล MySQL เดียวกับ WordPress</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 leading-relaxed pl-1">
                    ระบบ Xing Tai สามารถใช้ฐานข้อมูล MySQL เดียวกับ WordPress ได้ โดยเพียงแค่นำเข้าตารางทั้ง 8 ตารางลงใน Database ของ WordPress ผ่าน phpMyAdmin เพื่อรวมศูนย์ข้อมูลและการสำรองข้อมูลไว้ในที่เดียว
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-300 pt-2.5 flex items-center justify-between text-[10px] text-zinc-500">
              <span>บริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด • คู่มือการติดตั้งบน WordPress</span>
              <span>หน้าที่ 4 จาก 5</span>
            </div>
          </div>

          {/* ==================== PAGE 5: MYSQL SETUP & SLA ==================== */}
          <div className="pdf-a4-page w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between box-border text-zinc-900 relative">
            <div>
              {/* Header */}
              <div className="border-b-2 border-blue-900 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white font-extrabold text-base">
                    XT
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-blue-950">
                      คู่มือการติดตั้ง MySQL & phpMyAdmin และการบำรุงรักษาระบบ
                    </h2>
                    <div className="text-[10px] text-zinc-600">
                      Database Installation, Maintenance & Support SLA
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-zinc-500 font-mono">
                  SECTION 5: DATABASE & SLA
                </div>
              </div>

              {/* MySQL Setup Steps */}
              <div className="mt-4 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-blue-950 border-b border-zinc-300 pb-1 flex items-center gap-1.5">
                  <span>ขั้นตอนการตั้งค่า MySQL & phpMyAdmin (8 ตาราง)</span>
                </h3>

                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 mb-0.5">1. การสร้างฐานข้อมูล (Database Creation)</div>
                  <div className="text-[11px] text-zinc-700 leading-relaxed">
                    เข้าสู่ phpMyAdmin &rarr; คลิก <strong>New</strong> &rarr; ตั้งชื่อ Database: <code className="font-mono font-bold text-blue-900">xingtai_db</code> &rarr; เลือก Collation: <code className="font-mono font-bold text-blue-900">utf8mb4_unicode_ci</code> &rarr; กด Create
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 mb-0.5">2. การนำเข้าโครงสร้าง 8 ตาราง (Schema & Seed Data)</div>
                  <div className="text-[11px] text-zinc-700 leading-relaxed">
                    ไปที่แท็บ <strong>Import</strong> ใน phpMyAdmin &rarr; เลือกไฟล์ <code className="font-mono font-bold text-blue-900">xingtai_db.sql</code> ที่ดาวน์โหลดจากเมนู Admin &rarr; กด <strong>Go</strong> เพื่อสร้างตารางทั้ง 8 ตาราง พร้อมฟิลด์ LONGTEXT สำหรับจัดเก็บลายเซ็นดิจิทัล
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 mb-0.5">3. การกำหนดค่า Environment Variables (.env)</div>
                  <pre className="mt-1 bg-zinc-900 text-emerald-400 p-2 rounded font-mono text-[10px]">
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=xingtai_db
                  </pre>
                </div>

                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-bold text-blue-950 mb-0.5">4. การรันเซิร์ฟเวอร์ใน Production</div>
                  <div className="text-[11px] text-zinc-700 leading-relaxed">
                    รันคำสั่ง <code className="font-mono text-blue-900 font-bold">npm run build</code> แล้วสตาร์ทด้วย <code className="font-mono text-blue-900 font-bold">npm start</code> หรือใช้ PM2 / Docker Container ในการควบคุมกระบวนการทำงานตลอด 24/7
                  </div>
                </div>

                {/* IT Support & SLA Box */}
                <div className="mt-3 p-3.5 bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-xl shadow">
                  <div className="font-bold text-sm mb-1.5 text-cyan-300">
                    ข้อมูลติดต่อฝ่ายเทคนิคและการรับประกัน SLA (IT Support & Maintenance)
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-zinc-300">
                    <div>
                      <div><strong>ฝ่ายเทคโนโลยีสารสนเทศ:</strong> บริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด</div>
                      <div><strong>เบอร์โทรศัพท์ภายใน:</strong> ต่อ 1102 (ฝ่ายไอที)</div>
                      <div><strong>อีเมลแจ้งปัญหา:</strong> it-support@xingtai.co.th</div>
                    </div>
                    <div>
                      <div><strong>เป้าหมาย SLA แก้ไขปัญหา:</strong> ปิดงานภายใน 4-24 ชั่วโมง</div>
                      <div><strong>การสำรองข้อมูล (Backup):</strong> อัตโนมัติทุกวันเวลา 00:00 น.</div>
                      <div><strong>สถานะความพร้อมใช้งาน (Uptime):</strong> 99.8% Guarantee</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature sign-off */}
            <div className="pt-3 border-t border-zinc-300 flex items-center justify-between text-xs text-zinc-600">
              <div>
                <div className="text-[10px] text-zinc-500">ผู้อนุมัติเอกสารคู่มือ:</div>
                <div className="font-bold text-zinc-800">ฝ่ายเทคโนโลยีสารสนเทศ และผู้บริหารเทคโนโลยี</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500">วันที่จัดทำเอกสาร:</div>
                <div className="font-bold text-zinc-800">{new Date().toLocaleDateString('th-TH')}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
