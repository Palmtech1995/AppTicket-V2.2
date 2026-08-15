/**
 * ============================================================================
 * [MODULE: BACKEND SERVER & MYSQL API GATEWAY]
 * File: /server.ts
 * Description: Express 4 Server & MySQL Connection Pool for Xing Tai Enterprise
 * 
 * [ส่วนที่แก้ไขและพัฒนา]:
 * 1. Express + Vite Middleware: รองรับการรัน Dev Mode และ Production Build
 * 2. MySQL Connection Pool: เชื่อมต่อ MySQL ด้วย mysql2/promise (Lazy Initialization)
 * 3. Schema Auto-Verification: ตรวจสอบและสร้าง 8 ตารางหลักอัตโนมัติ (branches, users, assets, etc.)
 * 4. API Endpoints:
 *    - GET  /api/health      : ตรวจสอบสถานะเซิร์ฟเวอร์
 *    - GET  /api/db/status   : เช็คสถานะการเชื่อมต่อ MySQL/phpMyAdmin
 *    - POST /api/db/sync     : ซิงค์ข้อมูลทั้งหมดจากหน้าเว็บลงฐานข้อมูล MySQL
 *    - GET  /api/db/data     : ดึงข้อมูลล่าสุดจาก MySQL กลับมายังหน้าเว็บ
 * ============================================================================
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

// Server-side persistent storage directory & file
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readServerDatabase(): any {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err: any) {
    console.error('Error reading server database file:', err.message);
  }
  return null;
}

function writeServerDatabase(data: any): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err: any) {
    console.error('Error writing server database file:', err.message);
    return false;
  }
}

// MySQL Connection Pool (Lazy initialization)
let pool: mysql.Pool | null = null;
let isDbConnected = false;
let lastDbError: string | null = null;

function getMySQLPool(): mysql.Pool | null {
  if (pool) return pool;

  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'xingtai_db';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

  if (!host || !user) {
    lastDbError = 'MYSQL_HOST or MYSQL_USER environment variables not configured.';
    return null;
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });
    return pool;
  } catch (err: any) {
    lastDbError = err.message;
    return null;
  }
}

async function testConnection(): Promise<{ connected: boolean; message: string; error?: string }> {
  const p = getMySQLPool();
  if (!p) {
    return {
      connected: false,
      message: 'Running in Local Storage Cache mode (MySQL env not set)',
      error: lastDbError || undefined,
    };
  }

  try {
    const connection = await p.getConnection();
    await connection.ping();
    connection.release();
    isDbConnected = true;
    lastDbError = null;
    return {
      connected: true,
      message: `Connected successfully to MySQL database "${process.env.MYSQL_DATABASE || 'xingtai_db'}" on ${process.env.MYSQL_HOST}`,
    };
  } catch (err: any) {
    isDbConnected = false;
    lastDbError = err.message;
    return {
      connected: false,
      message: 'Failed to connect to MySQL database',
      error: err.message,
    };
  }
}

async function ensureTableColumns(connection: mysql.PoolConnection, tableName: string, requiredColumns: Record<string, string>) {
  try {
    const [rows]: any = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const existingCols = new Set(rows.map((r: any) => r.Field.toLowerCase()));

    for (const [colName, colDef] of Object.entries(requiredColumns)) {
      if (!existingCols.has(colName.toLowerCase())) {
        console.log(`🔧 Auto-migrating table \`${tableName}\`: adding missing column \`${colName}\`...`);
        try {
          await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${colDef}`);
        } catch (alterErr: any) {
          console.warn(`Could not add column ${colName} to ${tableName}:`, alterErr.message);
        }
      }
    }
  } catch (err: any) {
    console.warn(`Notice inspecting table ${tableName}:`, err.message);
  }
}

async function initDatabaseTables() {
  const p = getMySQLPool();
  if (!p) return;

  try {
    const connection = await p.getConnection();
    
    // 1. Branches Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS branches (
        code VARCHAR(20) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(50),
        tax_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'branches', {
      code: 'VARCHAR(20) NOT NULL',
      name: 'VARCHAR(255) NOT NULL',
      address: 'TEXT NOT NULL',
      phone: 'VARCHAR(50)',
      tax_id: 'VARCHAR(50)',
    });

    // 2. Departments Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        code VARCHAR(50) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'departments', {
      code: 'VARCHAR(50) NOT NULL',
      name: 'VARCHAR(255) NOT NULL',
      name_en: 'VARCHAR(255)',
    });

    // 3. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        staff_id VARCHAR(50) NOT NULL UNIQUE,
        username VARCHAR(100),
        password VARCHAR(255) NOT NULL DEFAULT 'Lemony2026',
        is_first_login TINYINT(1) NOT NULL DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        thai_name VARCHAR(255) NOT NULL,
        nickname VARCHAR(100),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'USER',
        department_code VARCHAR(50) NOT NULL,
        department_name VARCHAR(255),
        branch_code VARCHAR(20) NOT NULL,
        branch_name VARCHAR(255),
        avatar_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'users', {
      id: 'VARCHAR(50) NOT NULL',
      staff_id: 'VARCHAR(50) NOT NULL',
      username: 'VARCHAR(100)',
      password: "VARCHAR(255) NOT NULL DEFAULT 'Lemony2026'",
      is_first_login: 'TINYINT(1) NOT NULL DEFAULT 1',
      name: 'VARCHAR(255) NOT NULL',
      thai_name: 'VARCHAR(255) NOT NULL',
      nickname: 'VARCHAR(100)',
      email: 'VARCHAR(255) NOT NULL',
      role: "VARCHAR(20) NOT NULL DEFAULT 'USER'",
      department_code: 'VARCHAR(50) NOT NULL',
      department_name: 'VARCHAR(255)',
      branch_code: 'VARCHAR(20) NOT NULL',
      branch_name: 'VARCHAR(255)',
      avatar_url: 'LONGTEXT',
    });

    // 4. Assets Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        asset_id VARCHAR(100) NOT NULL UNIQUE,
        item_code VARCHAR(100) NOT NULL,
        serial_no VARCHAR(100) NOT NULL,
        asset_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        location VARCHAR(255) NOT NULL,
        branch_code VARCHAR(20) NOT NULL,
        department_code VARCHAR(50) NOT NULL,
        owner_staff_id VARCHAR(50),
        owner_staff_name VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        acquisition_date DATE NOT NULL,
        cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        supplier VARCHAR(255),
        warranty_expire_date DATE,
        notes LONGTEXT,
        image_url LONGTEXT,
        repair_logs JSON,
        custody_history JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'assets', {
      id: 'VARCHAR(50) NOT NULL',
      asset_id: 'VARCHAR(100) NOT NULL',
      item_code: 'VARCHAR(100) NOT NULL',
      serial_no: 'VARCHAR(100) NOT NULL',
      asset_name: 'VARCHAR(255) NOT NULL',
      category: 'VARCHAR(100) NOT NULL',
      brand: 'VARCHAR(100)',
      model: 'VARCHAR(100)',
      location: 'VARCHAR(255) NOT NULL',
      branch_code: 'VARCHAR(20) NOT NULL',
      department_code: 'VARCHAR(50) NOT NULL',
      owner_staff_id: 'VARCHAR(50)',
      owner_staff_name: 'VARCHAR(255)',
      status: "VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'",
      acquisition_date: 'DATE NOT NULL',
      cost: 'DECIMAL(12,2) NOT NULL DEFAULT 0.00',
      supplier: 'VARCHAR(255)',
      warranty_expire_date: 'DATE',
      notes: 'LONGTEXT',
      image_url: 'LONGTEXT',
      repair_logs: 'JSON',
      custody_history: 'JSON',
    });

    // 5. Transfer Forms Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transfer_forms (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        form_no VARCHAR(50) NOT NULL UNIQUE,
        created_date DATE NOT NULL,
        originating_branch VARCHAR(255) NOT NULL,
        originating_branch_code VARCHAR(20) NOT NULL,
        originating_dept VARCHAR(255) NOT NULL,
        reason_type VARCHAR(50) NOT NULL,
        reason_note LONGTEXT,
        items JSON NOT NULL,
        it_approved TINYINT(1) NOT NULL DEFAULT 0,
        it_approved_by VARCHAR(255),
        it_approved_date DATETIME,
        it_signature LONGTEXT,
        manager_approved TINYINT(1) NOT NULL DEFAULT 0,
        manager_approved_by VARCHAR(255),
        manager_approved_date DATETIME,
        manager_signature LONGTEXT,
        acc_approved TINYINT(1) NOT NULL DEFAULT 0,
        acc_approved_by VARCHAR(255),
        acc_approved_date DATETIME,
        acc_signature LONGTEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING_IT',
        delivered_by VARCHAR(255),
        delivery_date DATETIME,
        vehicle_plate_no VARCHAR(50),
        receiver_sign_date DATETIME,
        receiver_signature LONGTEXT,
        notes LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'transfer_forms', {
      id: 'VARCHAR(50) NOT NULL',
      form_no: 'VARCHAR(50) NOT NULL',
      created_date: 'DATE NOT NULL',
      originating_branch: 'VARCHAR(255) NOT NULL',
      originating_branch_code: 'VARCHAR(20) NOT NULL',
      originating_dept: 'VARCHAR(255) NOT NULL',
      reason_type: 'VARCHAR(50) NOT NULL',
      reason_note: 'LONGTEXT',
      items: 'JSON NOT NULL',
      it_approved: 'TINYINT(1) NOT NULL DEFAULT 0',
      it_approved_by: 'VARCHAR(255)',
      it_approved_date: 'DATETIME',
      it_signature: 'LONGTEXT',
      manager_approved: 'TINYINT(1) NOT NULL DEFAULT 0',
      manager_approved_by: 'VARCHAR(255)',
      manager_approved_date: 'DATETIME',
      manager_signature: 'LONGTEXT',
      acc_approved: 'TINYINT(1) NOT NULL DEFAULT 0',
      acc_approved_by: 'VARCHAR(255)',
      acc_approved_date: 'DATETIME',
      acc_signature: 'LONGTEXT',
      status: "VARCHAR(50) NOT NULL DEFAULT 'PENDING_IT'",
      delivered_by: 'VARCHAR(255)',
      delivery_date: 'DATETIME',
      vehicle_plate_no: 'VARCHAR(50)',
      receiver_sign_date: 'DATETIME',
      receiver_signature: 'LONGTEXT',
      notes: 'LONGTEXT',
    });

    // 6. IT Tickets Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS it_tickets (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        details LONGTEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
        status VARCHAR(50) NOT NULL DEFAULT 'NEW',
        requester_staff_id VARCHAR(50) NOT NULL,
        requester_staff_name VARCHAR(255) NOT NULL,
        requester_dept VARCHAR(100) NOT NULL,
        requester_branch VARCHAR(100) NOT NULL,
        assigned_to_technician VARCHAR(50),
        assigned_technician_name VARCHAR(255),
        asset_id VARCHAR(100),
        asset_name VARCHAR(255),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        resolved_at DATETIME,
        resolution_hours DECIMAL(8,2),
        resolution_note LONGTEXT,
        repair_cost DECIMAL(12,2),
        repair_vendor VARCHAR(255),
        repair_sent_date DATE,
        repair_returned_date DATE,
        history_log JSON
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'it_tickets', {
      id: 'VARCHAR(50) NOT NULL',
      subject: 'VARCHAR(255) NOT NULL',
      details: 'LONGTEXT NOT NULL',
      category: 'VARCHAR(50) NOT NULL',
      priority: "VARCHAR(50) NOT NULL DEFAULT 'MEDIUM'",
      status: "VARCHAR(50) NOT NULL DEFAULT 'NEW'",
      requester_staff_id: 'VARCHAR(50) NOT NULL',
      requester_staff_name: 'VARCHAR(255) NOT NULL',
      requester_dept: 'VARCHAR(100) NOT NULL',
      requester_branch: 'VARCHAR(100) NOT NULL',
      assigned_to_technician: 'VARCHAR(50)',
      assigned_technician_name: 'VARCHAR(255)',
      asset_id: 'VARCHAR(100)',
      asset_name: 'VARCHAR(255)',
      created_at: 'DATETIME NOT NULL',
      updated_at: 'DATETIME NOT NULL',
      resolved_at: 'DATETIME',
      resolution_hours: 'DECIMAL(8,2)',
      resolution_note: 'LONGTEXT',
      repair_cost: 'DECIMAL(12,2)',
      repair_vendor: 'VARCHAR(255)',
      repair_sent_date: 'DATE',
      repair_returned_date: 'DATE',
      history_log: 'JSON',
    });

    // 7. Weekly Problems Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS weekly_problems (
        week_number INT(11) NOT NULL PRIMARY KEY,
        week_label VARCHAR(100) NOT NULL,
        date_range VARCHAR(100) NOT NULL,
        total_incidents INT(11) NOT NULL DEFAULT 0,
        top_issues JSON NOT NULL,
        hardware_count INT(11) NOT NULL DEFAULT 0,
        software_count INT(11) NOT NULL DEFAULT 0,
        network_count INT(11) NOT NULL DEFAULT 0,
        resolved_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'weekly_problems', {
      week_number: 'INT(11) NOT NULL',
      week_label: 'VARCHAR(100) NOT NULL',
      date_range: 'VARCHAR(100) NOT NULL',
      total_incidents: 'INT(11) NOT NULL DEFAULT 0',
      top_issues: 'JSON NOT NULL',
      hardware_count: 'INT(11) NOT NULL DEFAULT 0',
      software_count: 'INT(11) NOT NULL DEFAULT 0',
      network_count: 'INT(11) NOT NULL DEFAULT 0',
      resolved_rate: 'DECIMAL(5,2) NOT NULL DEFAULT 0.00',
    });

    // 8. System Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
        setting_value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await ensureTableColumns(connection, 'system_settings', {
      setting_key: 'VARCHAR(100) NOT NULL',
      setting_value: 'JSON NOT NULL',
    });

    connection.release();
    console.log('✅ MySQL schema checked, repaired & verified successfully.');
  } catch (err: any) {
    console.error('⚠️ MySQL table init notice:', err.message);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ---------------------------------------------------------
  // API ROUTES (FIRST)
  // ---------------------------------------------------------

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. MySQL / Database Status
  app.get('/api/db/status', async (req, res) => {
    const status = await testConnection();
    const serverDb = readServerDatabase();
    
    let tableCounts: Record<string, number> = {};
    if (serverDb) {
      tableCounts = {
        branches: serverDb.branches?.length || 0,
        departments: serverDb.departments?.length || 0,
        users: serverDb.staffList?.length || 0,
        assets: serverDb.assets?.length || 0,
        transfers: serverDb.transfers?.length || 0,
        tickets: serverDb.tickets?.length || 0,
        weekly_problems: serverDb.weeklyProblems?.length || 0,
      };
    }

    res.json({
      connected: status.connected,
      driver: status.connected ? 'mysql2' : 'server_storage',
      host: process.env.MYSQL_HOST || 'localhost (Server Persistent DB)',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      database: process.env.MYSQL_DATABASE || 'xingtai_db',
      user: process.env.MYSQL_USER || 'root',
      hasServerStorage: fs.existsSync(DATA_FILE),
      tableCounts,
      message: status.connected 
        ? `Connected to MySQL: ${process.env.MYSQL_DATABASE || 'xingtai_db'}`
        : 'Active Database: Server Persistent Storage (Auto-syncs with MySQL upon connection)',
      error: status.error,
      lastCheck: new Date().toISOString(),
    });
  });

  // 3. Test Connection
  app.post('/api/db/test', async (req, res) => {
    const status = await testConnection();
    res.json(status);
  });

  // 4. Push sync from Client to Database (File DB + MySQL)
  app.post('/api/db/sync', async (req, res) => {
    try {
      const payload = req.body;
      const {
        branches,
        departments,
        staffList,
        assets,
        transfers,
        tickets,
        weeklyProblems,
        technicians,
        formConfig,
        rolePermissions,
      } = payload;

      // 1. ALWAYS persist to server filesystem database
      const dbPayload = {
        branches: branches || [],
        departments: departments || [],
        staffList: staffList || [],
        assets: assets || [],
        transfers: transfers || [],
        tickets: tickets || [],
        weeklyProblems: weeklyProblems || [],
        technicians: technicians || [],
        formConfig: formConfig || null,
        rolePermissions: rolePermissions || null,
        lastUpdated: new Date().toISOString(),
      };
      writeServerDatabase(dbPayload);

      // 2. If MySQL is configured, also upsert to MySQL tables
      const p = getMySQLPool();
      let mysqlSaved = false;
      let mysqlError: string | null = null;

      if (p) {
        try {
          await initDatabaseTables();
          const conn = await p.getConnection();
          await conn.beginTransaction();

          // Upsert Branches
          if (Array.isArray(branches) && branches.length > 0) {
            for (const b of branches) {
              await conn.query(
                `INSERT INTO branches (code, name, address, phone, tax_id) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), phone=VALUES(phone), tax_id=VALUES(tax_id)`,
                [b.code, b.name, b.address, b.phone || '', b.taxId || '']
              );
            }
          }

          // Upsert Departments
          if (Array.isArray(departments) && departments.length > 0) {
            for (const d of departments) {
              await conn.query(
                `INSERT INTO departments (code, name, name_en) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE name=VALUES(name), name_en=VALUES(name_en)`,
                [d.code, d.name, d.nameEn || '']
              );
            }
          }

          // Upsert Users/Staff
          if (Array.isArray(staffList) && staffList.length > 0) {
            for (const u of staffList) {
              await conn.query(
                `INSERT INTO users (id, staff_id, username, password, is_first_login, name, thai_name, nickname, email, role, department_code, department_name, branch_code, branch_name, avatar_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE password=VALUES(password), is_first_login=VALUES(is_first_login), role=VALUES(role), thai_name=VALUES(thai_name), email=VALUES(email)`,
                [
                  u.id,
                  u.staffId,
                  u.username || u.staffId.toLowerCase(),
                  u.password || 'Lemony2026',
                  u.isFirstLogin ? 1 : 0,
                  u.name,
                  u.thaiName || u.name,
                  u.nickname || '',
                  u.email,
                  u.role,
                  u.departmentCode,
                  u.departmentName,
                  u.branchCode,
                  u.branchName,
                  u.avatarUrl || '',
                ]
              );
            }
          }

          // Upsert Assets
          if (Array.isArray(assets) && assets.length > 0) {
            for (const a of assets) {
              await conn.query(
                `INSERT INTO assets (id, asset_id, item_code, serial_no, asset_name, category, brand, model, location, branch_code, department_code, owner_staff_id, owner_staff_name, status, acquisition_date, cost, supplier, warranty_expire_date, notes, image_url, repair_logs, custody_history) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE status=VALUES(status), location=VALUES(location), owner_staff_id=VALUES(owner_staff_id), owner_staff_name=VALUES(owner_staff_name), repair_logs=VALUES(repair_logs), custody_history=VALUES(custody_history), cost=VALUES(cost), notes=VALUES(notes)`,
                [
                  a.id,
                  a.assetId,
                  a.itemCode,
                  a.serialNo,
                  a.assetName,
                  a.category,
                  a.brand || '',
                  a.model || '',
                  a.location,
                  a.branchCode,
                  a.departmentCode,
                  a.ownerStaffId || '',
                  a.ownerStaffName || '',
                  a.status,
                  a.acquisitionDate,
                  a.cost || 0,
                  a.supplier || '',
                  a.warrantyExpireDate || null,
                  a.notes || '',
                  a.imageUrl || '',
                  JSON.stringify(a.repairLogs || []),
                  JSON.stringify(a.custodyHistory || []),
                ]
              );
            }
          }

          // Upsert Transfers
          if (Array.isArray(transfers) && transfers.length > 0) {
            for (const t of transfers) {
              await conn.query(
                `INSERT INTO transfer_forms (id, form_no, created_date, originating_branch, originating_branch_code, originating_dept, reason_type, reason_note, items, it_approved, it_approved_by, it_approved_date, it_signature, manager_approved, manager_approved_by, manager_approved_date, manager_signature, acc_approved, acc_approved_by, acc_approved_date, acc_signature, status, delivered_by, delivery_date, vehicle_plate_no, receiver_sign_date, receiver_signature, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE status=VALUES(status), it_approved=VALUES(it_approved), manager_approved=VALUES(manager_approved), acc_approved=VALUES(acc_approved), receiver_signature=VALUES(receiver_signature), it_signature=VALUES(it_signature), manager_signature=VALUES(manager_signature), acc_signature=VALUES(acc_signature)`,
                [
                  t.id,
                  t.formNo,
                  t.createdDate,
                  t.originatingBranch,
                  t.originatingBranchCode,
                  t.originatingDept,
                  t.reasonType,
                  t.reasonNote || '',
                  JSON.stringify(t.items || []),
                  t.itApproved ? 1 : 0,
                  t.itApprovedBy || '',
                  t.itApprovedDate || null,
                  t.itSignature || '',
                  t.managerApproved ? 1 : 0,
                  t.managerApprovedBy || '',
                  t.managerApprovedDate || null,
                  t.managerSignature || '',
                  t.accApproved ? 1 : 0,
                  t.accApprovedBy || '',
                  t.accApprovedDate || null,
                  t.accSignature || '',
                  t.status,
                  t.deliveredBy || '',
                  t.deliveryDate || null,
                  t.vehiclePlateNo || '',
                  t.receiverSignDate || null,
                  t.receiverSignature || '',
                  t.notes || '',
                ]
              );
            }
          }

          // Upsert Tickets
          if (Array.isArray(tickets) && tickets.length > 0) {
            for (const tk of tickets) {
              await conn.query(
                `INSERT INTO it_tickets (id, subject, details, category, priority, status, requester_staff_id, requester_staff_name, requester_dept, requester_branch, assigned_to_technician, assigned_technician_name, asset_id, asset_name, created_at, updated_at, resolved_at, resolution_hours, resolution_note, repair_cost, repair_vendor, repair_sent_date, repair_returned_date, history_log) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE status=VALUES(status), assigned_to_technician=VALUES(assigned_to_technician), assigned_technician_name=VALUES(assigned_technician_name), resolved_at=VALUES(resolved_at), resolution_hours=VALUES(resolution_hours), resolution_note=VALUES(resolution_note), repair_cost=VALUES(repair_cost), updated_at=VALUES(updated_at), history_log=VALUES(history_log)`,
                [
                  tk.id,
                  tk.subject,
                  tk.details,
                  tk.category,
                  tk.priority,
                  tk.status,
                  tk.requesterStaffId,
                  tk.requesterStaffName,
                  tk.requesterDept,
                  tk.requesterBranch,
                  tk.assignedToTechnician || '',
                  tk.assignedTechnicianName || '',
                  tk.assetId || '',
                  tk.assetName || '',
                  tk.createdAt,
                  tk.updatedAt,
                  tk.resolvedAt || null,
                  tk.resolutionHours || null,
                  tk.resolutionNote || '',
                  tk.repairCost || null,
                  tk.repairVendor || '',
                  tk.repairSentDate || null,
                  tk.repairReturnedDate || null,
                  JSON.stringify(tk.historyLog || []),
                ]
              );
            }
          }

          if (formConfig) {
            await conn.query(
              `INSERT INTO system_settings (setting_key, setting_value) VALUES ('form_adjustment_config', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
              [JSON.stringify(formConfig)]
            );
          }
          if (rolePermissions) {
            await conn.query(
              `INSERT INTO system_settings (setting_key, setting_value) VALUES ('role_permissions', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
              [JSON.stringify(rolePermissions)]
            );
          }

          await conn.commit();
          conn.release();
          mysqlSaved = true;
        } catch (dbErr: any) {
          console.warn('MySQL push warning (saved to server database):', dbErr.message);
          mysqlError = dbErr.message;
        }
      }

      res.json({
        success: true,
        driver: mysqlSaved ? 'mysql2' : 'server_storage',
        message: mysqlSaved 
          ? 'บันทึกข้อมูลลงฐานข้อมูล MySQL และเซิร์ฟเวอร์เรียบร้อยแล้ว (MySQL Synced)' 
          : 'บันทึกข้อมูลลงฐานข้อมูลเซิร์ฟเวอร์เรียบร้อยแล้ว (Server Storage Synced)',
        mysqlSaved,
        mysqlError,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Database sync error:', err);
      res.status(500).json({
        success: false,
        message: `Database sync error: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 5. Pull all data from Database (MySQL or Server DB)
  app.get('/api/db/data', async (req, res) => {
    const p = getMySQLPool();
    
    // Attempt MySQL query first if connected
    if (p && isDbConnected) {
      try {
        const [branches]: any = await p.query('SELECT * FROM branches');
        const [departments]: any = await p.query('SELECT * FROM departments');
        const [users]: any = await p.query('SELECT * FROM users');
        const [assets]: any = await p.query('SELECT * FROM assets');
        const [transfers]: any = await p.query('SELECT * FROM transfer_forms');
        const [tickets]: any = await p.query('SELECT * FROM it_tickets');
        const [weeklyProblems]: any = await p.query('SELECT * FROM weekly_problems');

        const formattedData = {
          branches: branches.map((b: any) => ({
            code: b.code,
            name: b.name,
            address: b.address,
            phone: b.phone || '',
            taxId: b.tax_id || '',
          })),
          departments: departments.map((d: any) => ({
            code: d.code,
            name: d.name,
            nameEn: d.name_en || '',
          })),
          staffList: users.map((u: any) => ({
            id: u.id,
            staffId: u.staff_id,
            username: u.username,
            password: u.password,
            isFirstLogin: Boolean(u.is_first_login),
            name: u.name,
            thaiName: u.thai_name || u.name,
            nickname: u.nickname || '',
            email: u.email,
            role: u.role,
            departmentCode: u.department_code,
            departmentName: u.department_name,
            branchCode: u.branch_code,
            branchName: u.branch_name,
            avatarUrl: u.avatar_url || '',
          })),
          assets: assets.map((a: any) => ({
            id: a.id,
            assetId: a.asset_id,
            itemCode: a.item_code,
            serialNo: a.serial_no,
            assetName: a.asset_name,
            category: a.category,
            brand: a.brand || '',
            model: a.model || '',
            location: a.location,
            branchCode: a.branch_code,
            departmentCode: a.department_code,
            ownerStaffId: a.owner_staff_id || '',
            ownerStaffName: a.owner_staff_name || '',
            status: a.status,
            acquisitionDate: a.acquisition_date,
            cost: Number(a.cost) || 0,
            supplier: a.supplier || '',
            warrantyExpireDate: a.warranty_expire_date || null,
            notes: a.notes || '',
            imageUrl: a.image_url || '',
            repairLogs: typeof a.repair_logs === 'string' ? JSON.parse(a.repair_logs) : a.repair_logs || [],
            custodyHistory: typeof a.custody_history === 'string' ? JSON.parse(a.custody_history) : a.custody_history || [],
          })),
          transfers: transfers.map((t: any) => ({
            id: t.id,
            formNo: t.form_no,
            createdDate: t.created_date,
            originatingBranch: t.originating_branch,
            originatingBranchCode: t.originating_branch_code,
            originatingDept: t.originating_dept,
            reasonType: t.reason_type,
            reasonNote: t.reason_note || '',
            items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items || [],
            itApproved: Boolean(t.it_approved),
            itApprovedBy: t.it_approved_by || '',
            itApprovedDate: t.it_approved_date || null,
            itSignature: t.it_signature || '',
            managerApproved: Boolean(t.manager_approved),
            managerApprovedBy: t.manager_approved_by || '',
            managerApprovedDate: t.manager_approved_date || null,
            managerSignature: t.manager_signature || '',
            accApproved: Boolean(t.acc_approved),
            accApprovedBy: t.acc_approved_by || '',
            accApprovedDate: t.acc_approved_date || null,
            accSignature: t.acc_signature || '',
            status: t.status,
            deliveredBy: t.delivered_by || '',
            deliveryDate: t.delivery_date || null,
            vehiclePlateNo: t.vehicle_plate_no || '',
            receiverSignDate: t.receiver_sign_date || null,
            receiverSignature: t.receiver_signature || '',
            notes: t.notes || '',
          })),
          tickets: tickets.map((tk: any) => ({
            id: tk.id,
            subject: tk.subject,
            details: tk.details,
            category: tk.category,
            priority: tk.priority,
            status: tk.status,
            requesterStaffId: tk.requester_staff_id,
            requesterStaffName: tk.requester_staff_name,
            requesterDept: tk.requester_dept,
            requesterBranch: tk.requester_branch,
            assignedToTechnician: tk.assigned_to_technician || '',
            assignedTechnicianName: tk.assigned_technician_name || '',
            assetId: tk.asset_id || '',
            assetName: tk.asset_name || '',
            createdAt: tk.created_at,
            updatedAt: tk.updated_at,
            resolvedAt: tk.resolved_at || null,
            resolutionHours: tk.resolution_hours ? Number(tk.resolution_hours) : null,
            resolutionNote: tk.resolution_note || '',
            repairCost: tk.repair_cost ? Number(tk.repair_cost) : null,
            repairVendor: tk.repair_vendor || '',
            repairSentDate: tk.repair_sent_date || null,
            repairReturnedDate: tk.repair_returned_date || null,
            historyLog: typeof tk.history_log === 'string' ? JSON.parse(tk.history_log) : tk.history_log || [],
          })),
          weeklyProblems,
        };

        // Cache into server database
        writeServerDatabase(formattedData);

        return res.json({
          success: true,
          source: 'mysql',
          data: formattedData,
        });
      } catch (err: any) {
        console.warn('MySQL data fetch fallback to server database:', err.message);
      }
    }

    // Fallback to server-side filesystem database
    const serverData = readServerDatabase();
    if (serverData) {
      return res.json({
        success: true,
        source: 'server_storage',
        data: serverData,
      });
    }

    // If nothing saved on server yet
    res.json({
      success: true,
      source: 'none',
      data: null,
    });
  });

  // ---------------------------------------------------------
  // VITE MIDDLEWARE / STATIC SERVING
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? true : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Xing Tai Enterprise Server running on http://${HOST}:${PORT}`);
    // Non-blocking initial DB verification
    initDatabaseTables().catch(() => {});
  });
}

startServer();
