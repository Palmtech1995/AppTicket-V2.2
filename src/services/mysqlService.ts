/**
 * ============================================================================
 * [SERVICE LAYER: MYSQL & DATABASE INTERACTION ENGINE]
 * File: /src/services/mysqlService.ts
 * Description: Client-side service for communicating with the backend MySQL REST API,
 *              generating standalone SQL DDL dumps, and bundling PHP API scripts.
 * 
 * [ฟังก์ชันหลัก]:
 * - checkDatabaseStatus: ส่ง Request ตรวจสอบสถานะการเชื่อมต่อ MySQL และนับ Tables
 * - syncDataToMySQL: ส่ง Payload ข้อมูลทั้งหมดขึ้นไปบันทึกลงฐานข้อมูล MySQL
 * - fetchLatestDataFromMySQL: ดึงข้อมูลล่าสุดจาก MySQL กลับมายัง Client
 * - generateFullSqlDump: สร้างคำสั่ง `CREATE TABLE` และ `INSERT INTO` ครบ 8 ตาราง
 * - generatePhpBackendScripts: สร้างไฟล์ `db.php`, `api.php`, `.htaccess` สำหรับ Standalone Hosting
 * ============================================================================
 */

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
} from '../types';

export interface DbStatusResponse {
  connected: boolean;
  driver: 'mysql2' | 'local_fallback';
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  tableCount?: number;
  message: string;
  lastSync?: string;
  error?: string;
}

/**
 * Checks connection status with the backend MySQL server
 */
export async function checkDatabaseStatus(): Promise<DbStatusResponse> {
  try {
    const res = await fetch('/api/db/status', {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return {
        connected: false,
        driver: 'local_fallback',
        message: `HTTP Server Status: ${res.statusText}`,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      driver: 'local_fallback',
      message: 'Running in Local Storage mode (Backend API offline or not configured)',
      error: err.message,
    };
  }
}

/**
 * Pushes entire application dataset to MySQL database via /api/db/sync
 */
export async function syncDataToMySQL(payload: {
  branches: Branch[];
  departments: Department[];
  staffList: UserProfile[];
  assets: Asset[];
  transfers: TransferForm[];
  tickets: ITTicket[];
  weeklyProblems: WeeklyProblemSummary[];
  formConfig: FormAdjustmentConfig;
  rolePermissions: SystemRolePermissions;
}): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    return result;
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to sync to MySQL: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetches latest dataset from MySQL database
 */
export async function fetchDataFromMySQL(): Promise<{
  success: boolean;
  source?: 'mysql' | 'server_storage' | 'none';
  counts?: {
    assets: number;
    transfers: number;
    tickets: number;
    staffList: number;
    branches: number;
    departments: number;
  };
  data?: {
    branches?: Branch[];
    departments?: Department[];
    staffList?: UserProfile[];
    assets?: Asset[];
    transfers?: TransferForm[];
    tickets?: ITTicket[];
    weeklyProblems?: WeeklyProblemSummary[];
    formConfig?: FormAdjustmentConfig;
    rolePermissions?: SystemRolePermissions;
  } | null;
  message?: string;
}> {
  try {
    const res = await fetch('/api/db/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      source: 'none',
      message: err.message,
      data: null,
    };
  }
}

/**
 * Generates the complete, production-ready SQL DDL and DML dump script
 * for direct import in phpMyAdmin or MySQL CLI.
 */
export function generateFullSqlDump(data: {
  branches: Branch[];
  departments: Department[];
  staffList: UserProfile[];
  assets: Asset[];
  transfers: TransferForm[];
  tickets: ITTicket[];
  weeklyProblems: WeeklyProblemSummary[];
  formConfig: FormAdjustmentConfig;
  rolePermissions: SystemRolePermissions;
}): string {
  const dateStr = new Date().toISOString();
  
  const escapeSql = (str: any): string => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number' || typeof str === 'boolean') return `${str}`;
    return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
  };

  const escapeJson = (obj: any): string => {
    if (!obj) return 'NULL';
    return escapeSql(JSON.stringify(obj));
  };

  let sql = `-- =========================================================================
-- Xing Tai Enterprise Asset & IT Ticket Database Schema & Data Dump
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, phpMyAdmin
-- Generated on: ${dateStr}
-- Target Database: xingtai_db
-- =========================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: \`xingtai_db\`
--
CREATE DATABASE IF NOT EXISTS \`xingtai_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`xingtai_db\`;

-- --------------------------------------------------------

--
-- Table structure for table \`branches\` (สาขา)
--
CREATE TABLE IF NOT EXISTS \`branches\` (
  \`code\` varchar(20) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`address\` text NOT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`tax_id\` varchar(50) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`departments\` (แผนก)
--
CREATE TABLE IF NOT EXISTS \`departments\` (
  \`code\` varchar(50) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`name_en\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`users\` (พนักงานและบัญชีผู้ใช้งาน)
--
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` varchar(50) NOT NULL,
  \`staff_id\` varchar(50) NOT NULL UNIQUE,
  \`username\` varchar(100) DEFAULT NULL,
  \`password\` varchar(255) NOT NULL DEFAULT 'Lemony2026',
  \`is_first_login\` tinyint(1) NOT NULL DEFAULT 1,
  \`name\` varchar(255) NOT NULL,
  \`thai_name\` varchar(255) NOT NULL,
  \`nickname\` varchar(100) DEFAULT NULL,
  \`email\` varchar(255) NOT NULL,
  \`role\` enum('ADMIN','IT','ACC','MANAGER','USER') NOT NULL DEFAULT 'USER',
  \`department_code\` varchar(50) NOT NULL,
  \`department_name\` varchar(255) DEFAULT NULL,
  \`branch_code\` varchar(20) NOT NULL,
  \`branch_name\` varchar(255) DEFAULT NULL,
  \`avatar_url\` longtext DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_staff_id\` (\`staff_id\`),
  KEY \`idx_role\` (\`role\`),
  KEY \`idx_branch\` (\`branch_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`assets\` (ทะเบียนทรัพย์สิน)
--
CREATE TABLE IF NOT EXISTS \`assets\` (
  \`id\` varchar(50) NOT NULL,
  \`asset_id\` varchar(100) NOT NULL UNIQUE,
  \`item_code\` varchar(100) NOT NULL,
  \`serial_no\` varchar(100) NOT NULL,
  \`asset_name\` varchar(255) NOT NULL,
  \`category\` varchar(100) NOT NULL,
  \`brand\` varchar(100) DEFAULT NULL,
  \`model\` varchar(100) DEFAULT NULL,
  \`location\` varchar(255) NOT NULL,
  \`branch_code\` varchar(20) NOT NULL,
  \`department_code\` varchar(50) NOT NULL,
  \`owner_staff_id\` varchar(50) DEFAULT NULL,
  \`owner_staff_name\` varchar(255) DEFAULT NULL,
  \`status\` enum('ACTIVE','MAINTENANCE','TRANSFERRED','RETIRED','DAMAGED','IN_REPAIR') NOT NULL DEFAULT 'ACTIVE',
  \`acquisition_date\` date NOT NULL,
  \`cost\` decimal(12,2) NOT NULL DEFAULT 0.00,
  \`supplier\` varchar(255) DEFAULT NULL,
  \`warranty_expire_date\` date DEFAULT NULL,
  \`notes\` longtext DEFAULT NULL,
  \`image_url\` longtext DEFAULT NULL,
  \`repair_logs\` json DEFAULT NULL,
  \`custody_history\` json DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_asset_id\` (\`asset_id\`),
  KEY \`idx_item_code\` (\`item_code\`),
  KEY \`idx_serial_no\` (\`serial_no\`),
  KEY \`idx_status\` (\`status\`),
  KEY \`idx_branch_dept\` (\`branch_code\`,\`department_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`transfer_forms\` (ใบโอนย้ายทรัพย์สิน A4 มาตรฐาน 3 ลายเซ็นดิจิทัล)
--
CREATE TABLE IF NOT EXISTS \`transfer_forms\` (
  \`id\` varchar(50) NOT NULL,
  \`form_no\` varchar(50) NOT NULL UNIQUE,
  \`created_date\` date NOT NULL,
  \`originating_branch\` varchar(255) NOT NULL,
  \`originating_branch_code\` varchar(20) NOT NULL,
  \`originating_dept\` varchar(255) NOT NULL,
  \`reason_type\` enum('NEW_EMPLOYEE','RESIGNATION','BRANCH_TRANSFER','TEMPORARY_BORROW','OTHERS') NOT NULL,
  \`reason_note\` longtext DEFAULT NULL,
  \`items\` json NOT NULL,
  \`it_approved\` tinyint(1) NOT NULL DEFAULT 0,
  \`it_approved_by\` varchar(255) DEFAULT NULL,
  \`it_approved_date\` datetime DEFAULT NULL,
  \`it_signature\` longtext DEFAULT NULL,
  \`manager_approved\` tinyint(1) NOT NULL DEFAULT 0,
  \`manager_approved_by\` varchar(255) DEFAULT NULL,
  \`manager_approved_date\` datetime DEFAULT NULL,
  \`manager_signature\` longtext DEFAULT NULL,
  \`acc_approved\` tinyint(1) NOT NULL DEFAULT 0,
  \`acc_approved_by\` varchar(255) DEFAULT NULL,
  \`acc_approved_date\` datetime DEFAULT NULL,
  \`acc_signature\` longtext DEFAULT NULL,
  \`status\` enum('DRAFT','PENDING_IT','PENDING_MANAGER','PENDING_ACC','APPROVED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING_IT',
  \`delivered_by\` varchar(255) DEFAULT NULL,
  \`delivery_date\` datetime DEFAULT NULL,
  \`vehicle_plate_no\` varchar(50) DEFAULT NULL,
  \`receiver_sign_date\` datetime DEFAULT NULL,
  \`receiver_signature\` longtext DEFAULT NULL,
  \`notes\` longtext DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_form_no\` (\`form_no\`),
  KEY \`idx_status\` (\`status\`),
  KEY \`idx_created_date\` (\`created_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`it_tickets\` (ใบแจ้งซ่อม IT Helpdesk)
--
CREATE TABLE IF NOT EXISTS \`it_tickets\` (
  \`id\` varchar(50) NOT NULL,
  \`subject\` varchar(255) NOT NULL,
  \`details\` longtext NOT NULL,
  \`category\` enum('HARDWARE_MALFUNCTION','SOFTWARE_ISSUE','NETWORK_WIFI','ASSET_TRANSFER_REQUEST','NEW_EQUIPMENT','MAINTENANCE') NOT NULL,
  \`priority\` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  \`status\` enum('NEW','ASSIGNED','IN_PROGRESS','PENDING_PARTS','RESOLVED','CLOSED') NOT NULL DEFAULT 'NEW',
  \`requester_staff_id\` varchar(50) NOT NULL,
  \`requester_staff_name\` varchar(255) NOT NULL,
  \`requester_dept\` varchar(100) NOT NULL,
  \`requester_branch\` varchar(100) NOT NULL,
  \`assigned_to_technician\` varchar(50) DEFAULT NULL,
  \`assigned_technician_name\` varchar(255) DEFAULT NULL,
  \`asset_id\` varchar(100) DEFAULT NULL,
  \`asset_name\` varchar(255) DEFAULT NULL,
  \`created_at\` datetime NOT NULL,
  \`updated_at\` datetime NOT NULL,
  \`resolved_at\` datetime DEFAULT NULL,
  \`resolution_hours\` decimal(8,2) DEFAULT NULL,
  \`resolution_note\` longtext DEFAULT NULL,
  \`repair_cost\` decimal(12,2) DEFAULT NULL,
  \`repair_vendor\` varchar(255) DEFAULT NULL,
  \`repair_sent_date\` date DEFAULT NULL,
  \`repair_returned_date\` date DEFAULT NULL,
  \`history_log\` json DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_ticket_status\` (\`status\`),
  KEY \`idx_requester\` (\`requester_staff_id\`),
  KEY \`idx_assigned\` (\`assigned_to_technician\`),
  KEY \`idx_ticket_asset\` (\`asset_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`weekly_problems\` (สรุปปัญหาประจำสัปดาห์ KPI)
--
CREATE TABLE IF NOT EXISTS \`weekly_problems\` (
  \`week_number\` int(11) NOT NULL,
  \`week_label\` varchar(100) NOT NULL,
  \`date_range\` varchar(100) NOT NULL,
  \`total_incidents\` int(11) NOT NULL DEFAULT 0,
  \`top_issues\` json NOT NULL,
  \`hardware_count\` int(11) NOT NULL DEFAULT 0,
  \`software_count\` int(11) NOT NULL DEFAULT 0,
  \`network_count\` int(11) NOT NULL DEFAULT 0,
  \`resolved_rate\` decimal(5,2) NOT NULL DEFAULT 0.00,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`week_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`system_settings\` (การตั้งค่าแบบฟอร์มและสิทธิ์)
--
CREATE TABLE IF NOT EXISTS \`system_settings\` (
  \`setting_key\` varchar(100) NOT NULL,
  \`setting_value\` json NOT NULL,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- INITIAL DATA DUMP
-- =========================================================================

`;

  // 1. Branches Dump
  if (data.branches.length > 0) {
    sql += `--\n-- Dumping data for table \`branches\`\n--\n`;
    sql += `INSERT INTO \`branches\` (\`code\`, \`name\`, \`address\`, \`phone\`, \`tax_id\`) VALUES\n`;
    sql += data.branches
      .map(
        (b) =>
          `  (${escapeSql(b.code)}, ${escapeSql(b.name)}, ${escapeSql(b.address)}, ${escapeSql(b.phone)}, ${escapeSql(b.taxId)})`
      )
      .join(',\n');
    sql += `\nON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`address\`=VALUES(\`address\`), \`phone\`=VALUES(\`phone\`), \`tax_id\`=VALUES(\`tax_id\`);\n\n`;
  }

  // 2. Departments Dump
  if (data.departments.length > 0) {
    sql += `--\n-- Dumping data for table \`departments\`\n--\n`;
    sql += `INSERT INTO \`departments\` (\`code\`, \`name\`, \`name_en\`) VALUES\n`;
    sql += data.departments
      .map(
        (d) =>
          `  (${escapeSql(d.code)}, ${escapeSql(d.name)}, ${escapeSql(d.nameEn)})`
      )
      .join(',\n');
    sql += `\nON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`name_en\`=VALUES(\`name_en\`);\n\n`;
  }

  // 3. Users Dump
  if (data.staffList.length > 0) {
    sql += `--\n-- Dumping data for table \`users\`\n--\n`;
    sql += `INSERT INTO \`users\` (\`id\`, \`staff_id\`, \`username\`, \`password\`, \`is_first_login\`, \`name\`, \`thai_name\`, \`nickname\`, \`email\`, \`role\`, \`department_code\`, \`department_name\`, \`branch_code\`, \`branch_name\`, \`avatar_url\`) VALUES\n`;
    sql += data.staffList
      .map(
        (u) =>
          `  (${escapeSql(u.id)}, ${escapeSql(u.staffId)}, ${escapeSql(u.username || u.staffId.toLowerCase())}, ${escapeSql(u.password || 'Lemony2026')}, ${u.isFirstLogin ? 1 : 0}, ${escapeSql(u.name)}, ${escapeSql(u.thaiName)}, ${escapeSql(u.nickname || null)}, ${escapeSql(u.email)}, ${escapeSql(u.role)}, ${escapeSql(u.departmentCode)}, ${escapeSql(u.departmentName)}, ${escapeSql(u.branchCode)}, ${escapeSql(u.branchName)}, ${escapeSql(u.avatarUrl || null)})`
      )
      .join(',\n');
    sql += `\nON DUPLICATE KEY UPDATE \`password\`=VALUES(\`password\`), \`is_first_login\`=VALUES(\`is_first_login\`), \`role\`=VALUES(\`role\`), \`thai_name\`=VALUES(\`thai_name\`);\n\n`;
  }

  // 4. Assets Dump
  if (data.assets.length > 0) {
    sql += `--\n-- Dumping data for table \`assets\`\n--\n`;
    sql += `INSERT INTO \`assets\` (\`id\`, \`asset_id\`, \`item_code\`, \`serial_no\`, \`asset_name\`, \`category\`, \`brand\`, \`model\`, \`location\`, \`branch_code\`, \`department_code\`, \`owner_staff_id\`, \`owner_staff_name\`, \`status\`, \`acquisition_date\`, \`cost\`, \`supplier\`, \`warranty_expire_date\`, \`notes\`, \`image_url\`, \`repair_logs\`, \`custody_history\`) VALUES\n`;
    sql += data.assets
      .map(
        (a) =>
          `  (${escapeSql(a.id)}, ${escapeSql(a.assetId)}, ${escapeSql(a.itemCode)}, ${escapeSql(a.serialNo)}, ${escapeSql(a.assetName)}, ${escapeSql(a.category)}, ${escapeSql(a.brand || null)}, ${escapeSql(a.model || null)}, ${escapeSql(a.location)}, ${escapeSql(a.branchCode)}, ${escapeSql(a.departmentCode)}, ${escapeSql(a.ownerStaffId || null)}, ${escapeSql(a.ownerStaffName || null)}, ${escapeSql(a.status)}, ${escapeSql(a.acquisitionDate)}, ${a.cost || 0}, ${escapeSql(a.supplier || null)}, ${escapeSql(a.warrantyExpireDate || null)}, ${escapeSql(a.notes || null)}, ${escapeSql(a.imageUrl || null)}, ${escapeJson(a.repairLogs || [])}, ${escapeJson(a.custodyHistory || [])})`
      )
      .join(',\n');
    sql += `\nON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`), \`location\`=VALUES(\`location\`), \`owner_staff_id\`=VALUES(\`owner_staff_id\`), \`owner_staff_name\`=VALUES(\`owner_staff_name\`), \`custody_history\`=VALUES(\`custody_history\`), \`repair_logs\`=VALUES(\`repair_logs\`);\n\n`;
  }

  // 5. Transfer Forms Dump
  if (data.transfers.length > 0) {
    sql += `--\n-- Dumping data for table \`transfer_forms\`\n--\n`;
    sql += `INSERT INTO \`transfer_forms\` (\`id\`, \`form_no\`, \`created_date\`, \`originating_branch\`, \`originating_branch_code\`, \`originating_dept\`, \`reason_type\`, \`reason_note\`, \`items\`, \`it_approved\`, \`it_approved_by\`, \`it_approved_date\`, \`it_signature\`, \`manager_approved\`, \`manager_approved_by\`, \`manager_approved_date\`, \`manager_signature\`, \`acc_approved\`, \`acc_approved_by\`, \`acc_approved_date\`, \`acc_signature\`, \`status\`, \`delivered_by\`, \`delivery_date\`, \`vehicle_plate_no\`, \`receiver_sign_date\`, \`receiver_signature\`, \`notes\`) VALUES\n`;
    sql += data.transfers
      .map(
        (t) =>
          `  (${escapeSql(t.id)}, ${escapeSql(t.formNo)}, ${escapeSql(t.createdDate)}, ${escapeSql(t.originatingBranch)}, ${escapeSql(t.originatingBranchCode)}, ${escapeSql(t.originatingDept)}, ${escapeSql(t.reasonType)}, ${escapeSql(t.reasonNote || null)}, ${escapeJson(t.items)}, ${t.itApproved ? 1 : 0}, ${escapeSql(t.itApprovedBy || null)}, ${escapeSql(t.itApprovedDate || null)}, ${escapeSql(t.itSignature || null)}, ${t.managerApproved ? 1 : 0}, ${escapeSql(t.managerApprovedBy || null)}, ${escapeSql(t.managerApprovedDate || null)}, ${escapeSql(t.managerSignature || null)}, ${t.accApproved ? 1 : 0}, ${escapeSql(t.accApprovedBy || null)}, ${escapeSql(t.accApprovedDate || null)}, ${escapeSql(t.accSignature || null)}, ${escapeSql(t.status)}, ${escapeSql(t.deliveredBy || null)}, ${escapeSql(t.deliveryDate || null)}, ${escapeSql(t.vehiclePlateNo || null)}, ${escapeSql(t.receiverSignDate || null)}, ${escapeSql(t.receiverSignature || null)}, ${escapeSql(t.notes || null)})`
      )
      .join(',\n');
    sql += `\nON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`), \`it_approved\`=VALUES(\`it_approved\`), \`manager_approved\`=VALUES(\`manager_approved\`), \`acc_approved\`=VALUES(\`acc_approved\`);\n\n`;
  }

  // 6. IT Tickets Dump
  if (data.tickets.length > 0) {
    sql += `--\n-- Dumping data for table \`it_tickets\`\n--\n`;
    sql += `INSERT INTO \`it_tickets\` (\`id\`, \`subject\`, \`details\`, \`category\`, \`priority\`, \`status\`, \`requester_staff_id\`, \`requester_staff_name\`, \`requester_dept\`, \`requester_branch\`, \`assigned_to_technician\`, \`assigned_technician_name\`, \`asset_id\`, \`asset_name\`, \`created_at\`, \`updated_at\`, \`resolved_at\`, \`resolution_hours\`, \`resolution_note\`, \`repair_cost\`, \`repair_vendor\`, \`repair_sent_date\`, \`repair_returned_date\`, \`history_log\`) VALUES\n`;
    sql += data.tickets
      .map(
        (tk) =>
          `  (${escapeSql(tk.id)}, ${escapeSql(tk.subject)}, ${escapeSql(tk.details)}, ${escapeSql(tk.category)}, ${escapeSql(tk.priority)}, ${escapeSql(tk.status)}, ${escapeSql(tk.requesterStaffId)}, ${escapeSql(tk.requesterStaffName)}, ${escapeSql(tk.requesterDept)}, ${escapeSql(tk.requesterBranch)}, ${escapeSql(tk.assignedToTechnician || null)}, ${escapeSql(tk.assignedTechnicianName || null)}, ${escapeSql(tk.assetId || null)}, ${escapeSql(tk.assetName || null)}, ${escapeSql(tk.createdAt)}, ${escapeSql(tk.updatedAt)}, ${escapeSql(tk.resolvedAt || null)}, ${tk.resolutionHours || null}, ${escapeSql(tk.resolutionNote || null)}, ${tk.repairCost || null}, ${escapeSql(tk.repairVendor || null)}, ${escapeSql(tk.repairSentDate || null)}, ${escapeSql(tk.repairReturnedDate || null)}, ${escapeJson(tk.historyLog || [])})`
      )
      .join(',\n');
    sql += `\nON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`), \`assigned_to_technician\`=VALUES(\`assigned_to_technician\`), \`resolved_at\`=VALUES(\`resolved_at\`), \`resolution_note\`=VALUES(\`resolution_note\`);\n\n`;
  }

  // 7. Weekly Problems Dump
  if (data.weeklyProblems && data.weeklyProblems.length > 0) {
    sql += `--\n-- Dumping data for table \`weekly_problems\`\n--\n`;
    sql += `INSERT INTO \`weekly_problems\` (\`week_number\`, \`week_label\`, \`date_range\`, \`total_incidents\`, \`top_issues\`, \`hardware_count\`, \`software_count\`, \`network_count\`, \`resolved_rate\`) VALUES\n`;
    sql += data.weeklyProblems
      .map(
        (wp) =>
          `  (${wp.weekNumber}, ${escapeSql(wp.weekLabel)}, ${escapeSql(wp.dateRange)}, ${wp.totalIncidents}, ${escapeJson(wp.topIssues)}, ${wp.hardwareCount}, ${wp.softwareCount}, ${wp.networkCount}, ${wp.resolvedRate})`
      )
      .join(',\n');
    sql += `\nON DUPLICATE KEY UPDATE \`total_incidents\`=VALUES(\`total_incidents\`), \`top_issues\`=VALUES(\`top_issues\`), \`resolved_rate\`=VALUES(\`resolved_rate\`);\n\n`;
  }

  // 8. System Settings Dump (Form Config & Role Permissions)
  sql += `--\n-- Dumping data for table \`system_settings\`\n--\n`;
  sql += `INSERT INTO \`system_settings\` (\`setting_key\`, \`setting_value\`) VALUES\n`;
  sql += `  ('form_adjustment_config', ${escapeJson(data.formConfig)}),\n`;
  sql += `  ('role_permissions', ${escapeJson(data.rolePermissions)})\n`;
  sql += `ON DUPLICATE KEY UPDATE \`setting_value\`=VALUES(\`setting_value\`);\n\n`;

  sql += `COMMIT;\n\n/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n`;

  return sql;
}

/**
 * Generates standalone PHP code (api.php and db_config.php)
 * for hosting on standard Apache/Nginx + PHP + MySQL servers.
 */
export function generatePhpBackendScripts(): {
  dbConfigPhp: string;
  apiPhp: string;
} {
  const dbConfigPhp = `<?php
/**
 * Xing Tai Enterprise Asset & IT Ticket System
 * Database Connection Configuration (MySQL / phpMyAdmin)
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$DB_HOST = getenv('MYSQL_HOST') ?: 'localhost';
$DB_PORT = getenv('MYSQL_PORT') ?: '3306';
$DB_USER = getenv('MYSQL_USER') ?: 'root';
$DB_PASS = getenv('MYSQL_PASSWORD') ?: '';
$DB_NAME = getenv('MYSQL_DATABASE') ?: 'xingtai_db';

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}
`;

  const apiPhp = `<?php
/**
 * Xing Tai REST API Entry Point (PHP 7.4+ / PHP 8.x)
 */
require_once __DIR__ . '/db_config.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'status':
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as asset_count FROM assets");
            $count = $stmt->fetch()['asset_count'] ?? 0;
            echo json_encode([
                'connected' => true,
                'driver' => 'php_pdo_mysql',
                'database' => $DB_NAME,
                'message' => 'Connected to MySQL successfully via PHP PDO',
                'assetCount' => (int)$count
            ]);
        } catch (Exception $e) {
            echo json_encode(['connected' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'get_assets':
        $stmt = $pdo->query("SELECT * FROM assets ORDER BY id DESC");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['repairLogs'] = json_decode($r['repair_logs'] ?: '[]', true);
            $r['custodyHistory'] = json_decode($r['custody_history'] ?: '[]', true);
        }
        echo json_encode(['success' => true, 'data' => $rows]);
        break;

    case 'get_tickets':
        $stmt = $pdo->query("SELECT * FROM it_tickets ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['historyLog'] = json_decode($r['history_log'] ?: '[]', true);
        }
        echo json_encode(['success' => true, 'data' => $rows]);
        break;

    case 'get_transfers':
        $stmt = $pdo->query("SELECT * FROM transfer_forms ORDER BY id DESC");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['items'] = json_decode($r['items'] ?: '[]', true);
        }
        echo json_encode(['success' => true, 'data' => $rows]);
        break;

    case 'get_all_data':
        $branches = $pdo->query("SELECT * FROM branches")->fetchAll();
        $depts = $pdo->query("SELECT * FROM departments")->fetchAll();
        $users = $pdo->query("SELECT * FROM users")->fetchAll();
        $assets = $pdo->query("SELECT * FROM assets")->fetchAll();
        $transfers = $pdo->query("SELECT * FROM transfer_forms")->fetchAll();
        $tickets = $pdo->query("SELECT * FROM it_tickets")->fetchAll();
        $weekly = $pdo->query("SELECT * FROM weekly_problems")->fetchAll();

        echo json_encode([
            'success' => true,
            'branches' => $branches,
            'departments' => $depts,
            'staffList' => $users,
            'assets' => $assets,
            'transfers' => $transfers,
            'tickets' => $tickets,
            'weeklyProblems' => $weekly
        ]);
        break;

    default:
        echo json_encode([
            'success' => true,
            'message' => 'Xing Tai PHP MySQL API Gateway is running',
            'available_actions' => ['status', 'get_assets', 'get_tickets', 'get_transfers', 'get_all_data']
        ]);
        break;
}
`;

  return { dbConfigPhp, apiPhp };
}

export interface TableColumnDef {
  name: string;
  type: string;
  key?: 'PRI' | 'UNI' | 'MUL' | 'FK';
  nullable: boolean;
  defaultValue?: string;
  description: string;
}

export interface TableSchemaDef {
  tableName: string;
  thaiName: string;
  category: 'CORE' | 'ASSET' | 'TRANSFER' | 'HELPDESK' | 'SYSTEM';
  description: string;
  primaryKey: string;
  relations: string[];
  columns: TableColumnDef[];
}

export const DATABASE_SCHEMA_METADATA: TableSchemaDef[] = [
  {
    tableName: 'branches',
    thaiName: 'สาขาและสถานที่ตั้ง',
    category: 'CORE',
    description: 'จัดเก็บข้อมูลสาขา ที่อยู่ เลขประจำตัวผู้เสียภาษี และเบอร์ติดต่อ สำหรับออกเอกสารและระบุสถานที่ตั้งทรัพย์สิน',
    primaryKey: 'code',
    relations: ['users.branch_code -> branches.code', 'assets.branch_code -> branches.code', 'transfer_forms.originating_branch_code -> branches.code'],
    columns: [
      { name: 'code', type: 'VARCHAR(20)', key: 'PRI', nullable: false, description: 'รหัสสาขา เช่น TH100, TH200' },
      { name: 'name', type: 'VARCHAR(255)', nullable: false, description: 'ชื่อสาขาภาษาไทย/อังกฤษ เช่น สำนักงานใหญ่กรุงเทพฯ, โรงงานระยอง' },
      { name: 'address', type: 'TEXT', nullable: false, description: 'ที่อยู่เต็มของสาขาสำหรับพิมพ์ลงบนหัวกระดาษ A4' },
      { name: 'phone', type: 'VARCHAR(50)', nullable: true, description: 'หมายเลขโทรศัพท์ติดต่อประจำสาขา' },
      { name: 'tax_id', type: 'VARCHAR(50)', nullable: true, description: 'เลขประจำตัวผู้เสียภาษี 13 หลัก' },
      { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP', nullable: false, description: 'วันที่บันทึกเข้าระบบ' },
      { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE', nullable: false, description: 'วันที่แก้ไขล่าสุด' },
    ],
  },
  {
    tableName: 'departments',
    thaiName: 'แผนกภายในองค์กร',
    category: 'CORE',
    description: 'โครงสร้างแผนกภายในบริษัท ซิงไท่ เทรดดิ้ง สำหรับสังกัดพนักงาน ทรัพย์สิน และการโอนย้าย',
    primaryKey: 'code',
    relations: ['users.department_code -> departments.code', 'assets.department_code -> departments.code', 'transfer_forms.originating_dept -> departments.name'],
    columns: [
      { name: 'code', type: 'VARCHAR(50)', key: 'PRI', nullable: false, description: 'รหัสแผนก เช่น XT018-IT, XT001-ACC, XT002-HR' },
      { name: 'name', type: 'VARCHAR(255)', nullable: false, description: 'ชื่อแผนกภาษาไทย เช่น แผนกไอทีและเทคโนโลยีสารสนเทศ' },
      { name: 'name_en', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อแผนกภาษาอังกฤษ เช่น IT & Information Technology' },
      { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP', nullable: false, description: 'วันที่สร้างแผนก' },
    ],
  },
  {
    tableName: 'users',
    thaiName: 'พนักงานและบัญชีผู้ใช้งาน (RBAC)',
    category: 'CORE',
    description: 'ข้อมูลพนักงาน บัญชีผู้ใช้ สิทธิ์ 5 ระดับ (ADMIN, IT, ACC, MANAGER, USER) และรหัสพนักงาน',
    primaryKey: 'id',
    relations: ['users.branch_code -> branches.code', 'users.department_code -> departments.code', 'assets.owner_staff_id -> users.staff_id'],
    columns: [
      { name: 'id', type: 'VARCHAR(50)', key: 'PRI', nullable: false, description: 'System UUID ของพนักงาน' },
      { name: 'staff_id', type: 'VARCHAR(50)', key: 'UNI', nullable: false, description: 'รหัสพนักงาน เช่น IT-250801, ACC-240102' },
      { name: 'username', type: 'VARCHAR(100)', nullable: true, description: 'Username สำหรับเข้าสู่ระบบ' },
      { name: 'password', type: 'VARCHAR(255)', defaultValue: 'Lemony2026', nullable: false, description: 'รหัสผ่านเข้าสู่ระบบ (Default: Lemony2026)' },
      { name: 'is_first_login', type: 'TINYINT(1)', defaultValue: '1', nullable: false, description: 'สถานะแจ้งเตือนให้เปลี่ยนรหัสผ่านครั้งแรก (1=ใช่, 0=เปลี่ยนแล้ว)' },
      { name: 'name', type: 'VARCHAR(255)', nullable: false, description: 'ชื่อ-นามสกุลภาษาอังกฤษ' },
      { name: 'thai_name', type: 'VARCHAR(255)', nullable: false, description: 'ชื่อ-นามสกุลภาษาไทยทางการ สำหรับลงนามเอกสาร' },
      { name: 'nickname', type: 'VARCHAR(100)', nullable: true, description: 'ชื่อเล่น' },
      { name: 'email', type: 'VARCHAR(255)', nullable: false, description: 'อีเมลบริษัท' },
      { name: 'role', type: "ENUM('ADMIN','IT','ACC','MANAGER','USER')", defaultValue: 'USER', key: 'MUL', nullable: false, description: 'บทบาทและสิทธิ์การเข้าถึง' },
      { name: 'department_code', type: 'VARCHAR(50)', key: 'FK', nullable: false, description: 'รหัสแผนกที่สังกัด' },
      { name: 'department_name', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อแผนก' },
      { name: 'branch_code', type: 'VARCHAR(20)', key: 'FK', nullable: false, description: 'รหัสสาขาประจำ' },
      { name: 'branch_name', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อสาขา' },
      { name: 'avatar_url', type: 'LONGTEXT', nullable: true, description: 'URL หรือ Base64 รูปโปรไฟล์' },
      { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP', nullable: false, description: 'วันที่ลงทะเบียน' },
      { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE', nullable: false, description: 'วันที่อัปเดตข้อมูล' },
    ],
  },
  {
    tableName: 'assets',
    thaiName: 'ทะเบียนทรัพย์สิน (Asset Master)',
    category: 'ASSET',
    description: 'ทะเบียนทรัพย์สิน IT และอุปกรณ์สำนักงาน รหัสสินทรัพย์ Serial No สถานะ ผู้ครอบครอง และประวัติซ่อม',
    primaryKey: 'id',
    relations: ['assets.branch_code -> branches.code', 'assets.department_code -> departments.code', 'assets.owner_staff_id -> users.staff_id'],
    columns: [
      { name: 'id', type: 'VARCHAR(50)', key: 'PRI', nullable: false, description: 'System UUID' },
      { name: 'asset_id', type: 'VARCHAR(100)', key: 'UNI', nullable: false, description: 'เลขที่สินทรัพย์ทางการ เช่น 3-300-680031' },
      { name: 'item_code', type: 'VARCHAR(100)', key: 'MUL', nullable: false, description: 'รหัสพัสดุ/อุปกรณ์ เช่น XT-IT-HW-23-0105' },
      { name: 'serial_no', type: 'VARCHAR(100)', key: 'MUL', nullable: false, description: 'Hardware Serial Number' },
      { name: 'asset_name', type: 'VARCHAR(255)', nullable: false, description: 'ชื่อทรัพย์สินและสเปก เช่น คอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex' },
      { name: 'category', type: 'VARCHAR(100)', nullable: false, description: 'หมวดหมู่ เช่น Computer, Notebook, Printer, Network' },
      { name: 'brand', type: 'VARCHAR(100)', nullable: true, description: 'ยี่ห้อ เช่น Dell, HP, Lenovo, Cisco' },
      { name: 'model', type: 'VARCHAR(100)', nullable: true, description: 'รุ่น' },
      { name: 'location', type: 'VARCHAR(255)', nullable: false, description: 'สถานที่ตั้ง/จุดวางอุปกรณ์' },
      { name: 'branch_code', type: 'VARCHAR(20)', key: 'FK', nullable: false, description: 'รหัสสาขาที่ตั้ง' },
      { name: 'department_code', type: 'VARCHAR(50)', key: 'FK', nullable: false, description: 'รหัสแผนกที่ครอบครอง' },
      { name: 'owner_staff_id', type: 'VARCHAR(50)', key: 'FK', nullable: true, description: 'รหัสพนักงานผู้ถือครอง' },
      { name: 'owner_staff_name', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อพนักงานผู้ถือครอง' },
      { name: 'status', type: "ENUM('ACTIVE','MAINTENANCE','TRANSFERRED','RETIRED','DAMAGED','IN_REPAIR')", defaultValue: 'ACTIVE', key: 'MUL', nullable: false, description: 'สถานะทรัพย์สิน' },
      { name: 'acquisition_date', type: 'DATE', nullable: false, description: 'วันที่ได้มา/วันที่ตรวจรับ' },
      { name: 'cost', type: 'DECIMAL(12,2)', defaultValue: '0.00', nullable: false, description: 'มูลค่าการจัดซื้อ (บาท)' },
      { name: 'supplier', type: 'VARCHAR(255)', nullable: true, description: 'ผู้จัดจำหน่าย/คู่ค้า' },
      { name: 'warranty_expire_date', type: 'DATE', nullable: true, description: 'วันหมดอายุการรับประกัน' },
      { name: 'notes', type: 'LONGTEXT', nullable: true, description: 'หมายเหตุเพิ่มเติม' },
      { name: 'image_url', type: 'LONGTEXT', nullable: true, description: 'URL รูปภาพทรัพย์สิน' },
      { name: 'repair_logs', type: 'JSON', nullable: true, description: 'ประวัติการส่งซ่อมภายนอก/ภายใน (Array JSON)' },
      { name: 'custody_history', type: 'JSON', nullable: true, description: 'ประวัติการเปลี่ยนผู้ถือครอง (Array JSON)' },
      { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP', nullable: false, description: 'วันที่สร้างระเบียน' },
      { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE', nullable: false, description: 'วันที่อัปเดตระเบียน' },
    ],
  },
  {
    tableName: 'transfer_forms',
    thaiName: 'ใบโอนย้ายทรัพย์สิน A4 (3 ลายเซ็นดิจิทัล)',
    category: 'TRANSFER',
    description: 'เอกสารใบโอนย้ายทรัพย์สินมาตรฐานบริษัท ซิงไท่ฯ รองรับกระบวนการอนุมัติ 3 ระดับ พร้อมลายมือชื่อดิจิทัล',
    primaryKey: 'id',
    relations: ['transfer_forms.originating_branch_code -> branches.code'],
    columns: [
      { name: 'id', type: 'VARCHAR(50)', key: 'PRI', nullable: false, description: 'UUID ของใบโอน' },
      { name: 'form_no', type: 'VARCHAR(50)', key: 'UNI', nullable: false, description: 'เลขที่เอกสาร เช่น TF6908013' },
      { name: 'created_date', type: 'DATE', key: 'MUL', nullable: false, description: 'วันที่จัดทำเอกสาร' },
      { name: 'originating_branch', type: 'VARCHAR(255)', nullable: false, description: 'สาขาต้นทาง' },
      { name: 'originating_branch_code', type: 'VARCHAR(20)', key: 'FK', nullable: false, description: 'รหัสสาขาต้นทาง' },
      { name: 'originating_dept', type: 'VARCHAR(255)', nullable: false, description: 'แผนกต้นทาง' },
      { name: 'reason_type', type: "ENUM('NEW_EMPLOYEE','RESIGNATION','BRANCH_TRANSFER','TEMPORARY_BORROW','OTHERS')", nullable: false, description: 'เหตุผลการโอนย้าย' },
      { name: 'reason_note', type: 'LONGTEXT', nullable: true, description: 'รายละเอียดเหตุผลเพิ่มเติม' },
      { name: 'items', type: 'JSON', nullable: false, description: 'รายการทรัพย์สินที่โอนย้าย (Array of TransferItem)' },
      { name: 'it_approved', type: 'TINYINT(1)', defaultValue: '0', nullable: false, description: 'สถานะอนุมัติขั้นที่ 1 (ฝ่ายไอที/ผู้จัดทำ)' },
      { name: 'it_approved_by', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อ-นามสกุลและรหัสพนักงานผู้ลงนาม IT' },
      { name: 'it_approved_date', type: 'DATETIME', nullable: true, description: 'วัน-เวลาที่ IT อนุมัติ' },
      { name: 'it_signature', type: 'LONGTEXT', nullable: true, description: 'ภาพลายเซ็นดิจิทัล IT (Base64 PNG)' },
      { name: 'manager_approved', type: 'TINYINT(1)', defaultValue: '0', nullable: false, description: 'สถานะอนุมัติขั้นที่ 2 (ผู้จัดการฝ่าย)' },
      { name: 'manager_approved_by', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อ-นามสกุลและรหัสพนักงานผู้ลงนาม Manager' },
      { name: 'manager_approved_date', type: 'DATETIME', nullable: true, description: 'วัน-เวลาที่ ผู้จัดการอนุมัติ' },
      { name: 'manager_signature', type: 'LONGTEXT', nullable: true, description: 'ภาพลายเซ็นดิจิทัล Manager (Base64 PNG)' },
      { name: 'acc_approved', type: 'TINYINT(1)', defaultValue: '0', nullable: false, description: 'สถานะอนุมัติขั้นที่ 3 (ฝ่ายบัญชี)' },
      { name: 'acc_approved_by', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อ-นามสกุลและรหัสพนักงานผู้ลงนาม ACC' },
      { name: 'acc_approved_date', type: 'DATETIME', nullable: true, description: 'วัน-เวลาที่ บัญชีอนุมัติ' },
      { name: 'acc_signature', type: 'LONGTEXT', nullable: true, description: 'ภาพลายเซ็นดิจิทัล ACC (Base64 PNG)' },
      { name: 'status', type: "ENUM('DRAFT','PENDING_IT','PENDING_MANAGER','PENDING_ACC','APPROVED','REJECTED','COMPLETED')", defaultValue: 'PENDING_IT', key: 'MUL', nullable: false, description: 'สถานะเอกสารตาม Workflow' },
      { name: 'delivered_by', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อผู้ดำเนินการส่งมอบทรัพย์สิน' },
      { name: 'delivery_date', type: 'DATETIME', nullable: true, description: 'วัน-เวลาส่งมอบ' },
      { name: 'vehicle_plate_no', type: 'VARCHAR(50)', nullable: true, description: 'ทะเบียนรถขนส่ง' },
      { name: 'receiver_sign_date', type: 'DATETIME', nullable: true, description: 'วัน-เวลาที่ผู้รับมอบลงนาม' },
      { name: 'receiver_signature', type: 'LONGTEXT', nullable: true, description: 'ลายเซ็นผู้รับมอบ (Base64 PNG)' },
      { name: 'notes', type: 'LONGTEXT', nullable: true, description: 'หมายเหตุเพิ่มเติม' },
      { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP', nullable: false, description: 'เวลาบันทึก' },
      { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE', nullable: false, description: 'เวลาอัปเดต' },
    ],
  },
  {
    tableName: 'it_tickets',
    thaiName: 'ใบแจ้งซ่อม IT Helpdesk & SLA',
    category: 'HELPDESK',
    description: 'ระบบแจ้งซ่อม IT Helpdesk แจกจ่ายงานช่าง SLA เวลาแก้ไข ค่าใช้จ่าย และบันทึกประวัติการแก้ไข',
    primaryKey: 'id',
    relations: ['it_tickets.requester_staff_id -> users.staff_id', 'it_tickets.assigned_to_technician -> users.staff_id', 'it_tickets.asset_id -> assets.asset_id'],
    columns: [
      { name: 'id', type: 'VARCHAR(50)', key: 'PRI', nullable: false, description: 'Ticket ID เช่น TIK-2608-001' },
      { name: 'subject', type: 'VARCHAR(255)', nullable: false, description: 'หัวข้อปัญหาที่แจ้ง' },
      { name: 'details', type: 'LONGTEXT', nullable: false, description: 'รายละเอียดอาการเสีย' },
      { name: 'category', type: "ENUM('HARDWARE_MALFUNCTION','SOFTWARE_ISSUE','NETWORK_WIFI','ASSET_TRANSFER_REQUEST','NEW_EQUIPMENT','MAINTENANCE')", nullable: false, description: 'ประเภทปัญหา' },
      { name: 'priority', type: "ENUM('LOW','MEDIUM','HIGH','CRITICAL')", defaultValue: 'MEDIUM', nullable: false, description: 'ระดับความสำคัญ' },
      { name: 'status', type: "ENUM('NEW','ASSIGNED','IN_PROGRESS','PENDING_PARTS','RESOLVED','CLOSED')", defaultValue: 'NEW', key: 'MUL', nullable: false, description: 'สถานะการดำเนินงาน' },
      { name: 'requester_staff_id', type: 'VARCHAR(50)', key: 'FK', nullable: false, description: 'รหัสพนักงานผู้แจ้ง' },
      { name: 'requester_staff_name', type: 'VARCHAR(255)', nullable: false, description: 'ชื่อผู้แจ้ง' },
      { name: 'requester_dept', type: 'VARCHAR(100)', nullable: false, description: 'แผนกผู้แจ้ง' },
      { name: 'requester_branch', type: 'VARCHAR(100)', nullable: false, description: 'สาขาผู้แจ้ง' },
      { name: 'assigned_to_technician', type: 'VARCHAR(50)', key: 'FK', nullable: true, description: 'รหัสเจ้าหน้าที่ IT ผู้รับผิดชอบ' },
      { name: 'assigned_technician_name', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อเจ้าหน้าที่ IT' },
      { name: 'asset_id', type: 'VARCHAR(100)', key: 'FK', nullable: true, description: 'รหัสทรัพย์สินที่มีปัญหา' },
      { name: 'asset_name', type: 'VARCHAR(255)', nullable: true, description: 'ชื่อทรัพย์สินที่มีปัญหา' },
      { name: 'created_at', type: 'DATETIME', nullable: false, description: 'วัน-เวลาที่เปิด Ticket' },
      { name: 'updated_at', type: 'DATETIME', nullable: false, description: 'วัน-เวลาที่อัปเดตล่าสุด' },
      { name: 'resolved_at', type: 'DATETIME', nullable: true, description: 'วัน-เวลาที่ปิดงานสำเร็จ' },
      { name: 'resolution_hours', type: 'DECIMAL(8,2)', nullable: true, description: 'เวลาที่ใช้แก้ไขจริง (ชั่วโมง SLA)' },
      { name: 'resolution_note', type: 'LONGTEXT', nullable: true, description: 'บันทึกวิธีแก้ปัญหาของช่าง' },
      { name: 'repair_cost', type: 'DECIMAL(12,2)', nullable: true, description: 'ค่าใช้จ่ายในการซ่อม/เปลี่ยนอะไหล่' },
      { name: 'repair_vendor', type: 'VARCHAR(255)', nullable: true, description: 'ศูนย์บริการภายนอกที่ส่งซ่อม' },
      { name: 'repair_sent_date', type: 'DATE', nullable: true, description: 'วันที่ส่งไปศูนย์ภายนอก' },
      { name: 'repair_returned_date', type: 'DATE', nullable: true, description: 'วันที่รับกลับจากศูนย์' },
      { name: 'history_log', type: 'JSON', nullable: true, description: 'ประวัติ Timeline การดำเนินงาน (JSON)' },
    ],
  },
  {
    tableName: 'weekly_problems',
    thaiName: 'สรุปสถิติปัญหาประจำสัปดาห์ (KPI Analytics)',
    category: 'HELPDESK',
    description: 'ข้อมูลสถิติรายสัปดาห์สำหรับผู้บริหาร สรุปจำนวนปัญหา แยกตามหมวดหมู่ อัตราการปิดงาน และปัญหาที่พบบ่อย',
    primaryKey: 'week_number',
    relations: [],
    columns: [
      { name: 'week_number', type: 'INT(11)', key: 'PRI', nullable: false, description: 'สัปดาห์ที่ เช่น 31, 32, 33' },
      { name: 'week_label', type: 'VARCHAR(100)', nullable: false, description: 'ป้ายชื่อสัปดาห์ เช่น สัปดาห์ที่ 32 (ส.ค. 2569)' },
      { name: 'date_range', type: 'VARCHAR(100)', nullable: false, description: 'ช่วงวันที่ เช่น 4 ส.ค. - 10 ส.ค. 2569' },
      { name: 'total_incidents', type: 'INT(11)', defaultValue: '0', nullable: false, description: 'จำนวนเคสทั้งหมด' },
      { name: 'top_issues', type: 'JSON', nullable: false, description: 'รายการ 3 อันดับปัญหาที่พบบ่อยสุด' },
      { name: 'hardware_count', type: 'INT(11)', defaultValue: '0', nullable: false, description: 'เคสฮาร์ดแวร์' },
      { name: 'software_count', type: 'INT(11)', defaultValue: '0', nullable: false, description: 'เคสซอฟต์แวร์' },
      { name: 'network_count', type: 'INT(11)', defaultValue: '0', nullable: false, description: 'เคสเครือข่าย/WiFi' },
      { name: 'resolved_rate', type: 'DECIMAL(5,2)', defaultValue: '0.00', nullable: false, description: 'อัตราการปิดงานสำเร็จ (%)' },
      { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP', nullable: false, description: 'วันที่สร้างสถิติ' },
    ],
  },
  {
    tableName: 'system_settings',
    thaiName: 'การตั้งค่าระบบและสิทธิ์การใช้งาน (System Settings)',
    category: 'SYSTEM',
    description: 'บันทึกการตั้งค่าแม่แบบเอกสาร A4 และ Matrix สิทธิ์ RBAC 5 ระดับขององค์กร',
    primaryKey: 'setting_key',
    relations: [],
    columns: [
      { name: 'setting_key', type: 'VARCHAR(100)', key: 'PRI', nullable: false, description: 'คีย์การตั้งค่า เช่น form_adjustment_config, role_permissions' },
      { name: 'setting_value', type: 'JSON', nullable: false, description: 'ข้อมูลการตั้งค่าโครงสร้างในรูปแบบ JSON' },
      { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP ON UPDATE', nullable: false, description: 'วันที่อัปเดตการตั้งค่าล่าสุด' },
    ],
  },
];

