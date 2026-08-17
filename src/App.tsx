/**
 * ============================================================================
 * [MODULE: CORE APPLICATION CONTROLLER]
 * File: /src/App.tsx
 * Description: Master State Management, Role-Based Access Control (RBAC),
 *              and Modal Lifecycle Orchestrator for Xing Tai Trading (Thailand)
 * 
 * [โครงสร้างและตรรกะการทำงานหลัก]:
 * 1. Master State & Persistence:
 *    - ควบคุม State กลางของ Assets, Transfers, Tickets, Staff, Branches, Departments, FormConfig, RBAC Matrix
 *    - มี Effect คอย Sync ข้อมูลลง LocalStorage และพร้อมส่งต่อให้ MySQL Database
 * 2. Role-Based Access Control (RBAC):
 *    - 5 Roles: ADMIN (ผู้ดูแลสูงสุด), IT (เจ้าหน้าที่ไอที), ACC (ฝ่ายบัญชี), MANAGER (ผู้จัดการ), USER (พนักงาน)
 *    - สลับ Tab อัตโนมัติตามสิทธิ์ (เช่น USER จะเปิดมาที่ Tickets เสมอ)
 * 3. Authentication & Security Workflow:
 *    - ตรวจสอบ `isDefaultPassword` หากยังไม่เปลี่ยนจะเด้ง ForceChangePasswordModal
 *    - รองรับ Quick Role Demo Switching และ Password Reset
 * 4. Transfer Workflow & Approval Matrix (ใบโอนย้าย A4):
 *    - Step 1: IT Specialist สร้างและอนุมัติ (itApproved)
 *    - Step 2: Department Manager อนุมัติการย้าย (managerApproved)
 *    - Step 3: Accounting Controller รับทราบและตัดบัญชี (accApproved)
 *    - เมื่ออนุมัติครบ 3 ฝ่าย -> สถานะเปลี่ยนเป็น COMPLETED และอัปเดต Location/Custody ของ Asset อัตโนมัติ
 * 5. IT Helpdesk & Ticket SLA State Transitions:
 *    - OPEN -> ASSIGNED (มอบหมายช่าง) -> IN_PROGRESS -> RESOLVED / CLOSED
 *    - เมื่อมีการส่งซ่อมภายนอก จะบันทึกเข้า AssetRepairLog และอัปเดต Bin Card ของทรัพย์สินทันที
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { CommandCenter } from './components/Dashboard/CommandCenter';
import { AssetInventory } from './components/Assets/AssetInventory';
import { AssetBincardModal } from './components/Assets/AssetBincardModal';
import { AssetFormModal } from './components/Assets/AssetFormModal';
import { QRScannerModal } from './components/Assets/QRScannerModal';
import { QRLabelPrintModal } from './components/Assets/QRLabelPrintModal';
import { TransferList } from './components/Transfers/TransferList';
import { TransferFormA4Modal } from './components/Transfers/TransferFormA4Modal';
import { NewTransferModal } from './components/Transfers/NewTransferModal';
import { TicketList } from './components/Tickets/TicketList';
import { TicketDetailModal } from './components/Tickets/TicketDetailModal';
import { NewTicketModal } from './components/Tickets/NewTicketModal';
import { ExecutiveReport } from './components/Reports/ExecutiveReport';
import { BackendManager } from './components/Admin/BackendManager';
import { LoginScreen } from './components/Auth/LoginScreen';
import { ForceChangePasswordModal } from './components/Auth/ForceChangePasswordModal';
import { ChangePasswordModal } from './components/Auth/ChangePasswordModal';
import { GoogleSheetsSyncModal } from './components/Common/GoogleSheetsSyncModal';

import {
  Asset,
  AssetCustodyHistory,
  AssetRepairLog,
  Branch,
  Department,
  FormAdjustmentConfig,
  ITTicket,
  RolePermissionConfig,
  SystemRolePermissions,
  TechnicianMetric,
  TransferForm,
  UserProfile,
  WeeklyProblemSummary,
} from './types';
import {
  getCurrentUserId,
  getStoredAssets,
  getStoredBranches,
  getStoredDepartments,
  getStoredFormConfig,
  getStoredIsLoggedIn,
  getStoredRolePermissions,
  getStoredStaff,
  getStoredTechnicians,
  getStoredTickets,
  getStoredTransfers,
  getStoredWeeklyProblems,
  resetAllDataToDefault,
  saveAssets,
  saveBranches,
  saveDepartments,
  saveFormConfig,
  saveIsLoggedIn,
  saveRolePermissions,
  saveStaff,
  saveTechnicians,
  saveTickets,
  saveTransfers,
  saveWeeklyProblems,
  setCurrentUserId,
} from './utils/storage';
import { DEFAULT_ROLE_PERMISSIONS } from './data/initialData';
import { fetchDataFromMySQL, syncDataToMySQL } from './services/mysqlService';

export function App() {
  // Master state
  const [assets, setAssets] = useState<Asset[]>(getStoredAssets);
  const [transfers, setTransfers] = useState<TransferForm[]>(getStoredTransfers);
  const [tickets, setTickets] = useState<ITTicket[]>(getStoredTickets);
  const [staffList, setStaffList] = useState<UserProfile[]>(getStoredStaff);
  const [branches, setBranches] = useState<Branch[]>(getStoredBranches);
  const [departments, setDepartments] = useState<Department[]>(getStoredDepartments);
  const [technicians, setTechnicians] = useState<TechnicianMetric[]>(getStoredTechnicians);
  const [formConfig, setFormConfig] = useState<FormAdjustmentConfig>(getStoredFormConfig);
  const [rolePermissions, setRolePermissions] = useState<SystemRolePermissions>(getStoredRolePermissions);
  const [weeklyProblems, setWeeklyProblems] = useState<WeeklyProblemSummary[]>(getStoredWeeklyProblems);

  // Database Synchronization State
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('synced');

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getStoredIsLoggedIn);
  const [currentUserId, setUserIdState] = useState<string>(getCurrentUserId);
  const currentUser = staffList.find((s) => s.id === currentUserId) || staffList[0];

  // Force Change Password (on first login or default password)
  const [showForceChangePw, setShowForceChangePw] = useState(false);
  const [showChangePwModal, setShowChangePwModal] = useState(false);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    return currentUser?.role === 'USER' ? 'tickets' : 'dashboard';
  });

  // Mobile sidebar drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Global search
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Modals state
  const [selectedBincardAsset, setSelectedBincardAsset] = useState<Asset | null>(null);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isQrLabelModalOpen, setIsQrLabelModalOpen] = useState(false);
  const [qrLabelAssets, setQrLabelAssets] = useState<Asset[]>([]);

  const [selectedTransferDoc, setSelectedTransferDoc] = useState<TransferForm | null>(null);
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferForm | null>(null);
  const [transferInitialAsset, setTransferInitialAsset] = useState<Asset | null>(null);

  const [selectedTicketDetail, setSelectedTicketDetail] = useState<ITTicket | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketInitialAsset, setNewTicketInitialAsset] = useState<Asset | null>(null);

  // Google Sheets Sync Modal state
  const [isGoogleSheetsSyncOpen, setIsGoogleSheetsSyncOpen] = useState(false);

  // Database Notification Toast state
  const [dbToast, setDbToast] = useState<{
    show: boolean;
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
    source?: string;
  } | null>(null);

  // Master Data Pull from Database (MySQL / Server Store)
  const handleFetchDataFromDatabase = async (showNotification = true): Promise<boolean> => {
    try {
      setDbSyncStatus('syncing');
      const res = await fetchDataFromMySQL();
      if (res && res.success && res.data) {
        const d = res.data;
        if (Array.isArray(d.assets)) {
          setAssets(d.assets);
          saveAssets(d.assets);
        }
        if (Array.isArray(d.transfers)) {
          setTransfers(d.transfers);
          saveTransfers(d.transfers);
        }
        if (Array.isArray(d.tickets)) {
          setTickets(d.tickets);
          saveTickets(d.tickets);
        }
        if (Array.isArray(d.staffList) && d.staffList.length > 0) {
          setStaffList(d.staffList);
          saveStaff(d.staffList);
        }
        if (Array.isArray(d.branches) && d.branches.length > 0) {
          setBranches(d.branches);
          saveBranches(d.branches);
        }
        if (Array.isArray(d.departments) && d.departments.length > 0) {
          setDepartments(d.departments);
          saveDepartments(d.departments);
        }
        if (Array.isArray(d.weeklyProblems)) {
          setWeeklyProblems(d.weeklyProblems);
          saveWeeklyProblems(d.weeklyProblems);
        }
        if (d.formConfig) {
          setFormConfig(d.formConfig);
          saveFormConfig(d.formConfig);
        }
        if (d.rolePermissions) {
          setRolePermissions(d.rolePermissions);
          saveRolePermissions(d.rolePermissions);
        }
        setDbSyncStatus('synced');

        if (showNotification) {
          const sourceName = res.source === 'mysql' ? 'MySQL Database' : 'Server Database';
          const assetCount = d.assets?.length ?? 0;
          const ticketCount = d.tickets?.length ?? 0;
          const transferCount = d.transfers?.length ?? 0;
          setDbToast({
            show: true,
            type: 'success',
            title: `ดึงข้อมูลจาก ${sourceName} สำเร็จ`,
            message: `โหลดทรัพย์สิน ${assetCount} รายการ, ใบแจ้งซ่อม ${ticketCount} รายการ, ใบโอนย้าย ${transferCount} รายการ`,
            source: res.source,
          });
          setTimeout(() => setDbToast(null), 4500);
        }
        return true;
      } else {
        if (showNotification) {
          setDbToast({
            show: true,
            type: 'info',
            title: 'เชื่อมต่อฐานข้อมูลเรียบร้อย',
            message: res?.message || 'ข้อมูลปัจจุบันตรงกับฐานข้อมูลเซิร์ฟเวอร์แล้ว',
          });
          setTimeout(() => setDbToast(null), 3500);
        }
        setDbSyncStatus('synced');
        return false;
      }
    } catch (err: any) {
      console.error('Fetch DB error:', err);
      setDbSyncStatus('error');
      if (showNotification) {
        setDbToast({
          show: true,
          type: 'error',
          title: 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้',
          message: err.message || 'โปรดตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์ MySQL',
        });
        setTimeout(() => setDbToast(null), 4500);
      }
      return false;
    }
  };

  // 1. Initial Load: Fetch master state from Database on startup
  useEffect(() => {
    let isMounted = true;
    async function loadDatabaseOnStartup() {
      try {
        setDbSyncStatus('syncing');
        const res = await fetchDataFromMySQL();
        if (res && res.success && res.data && isMounted) {
          const d = res.data;
          if (Array.isArray(d.assets)) setAssets(d.assets);
          if (Array.isArray(d.transfers)) setTransfers(d.transfers);
          if (Array.isArray(d.tickets)) setTickets(d.tickets);
          if (Array.isArray(d.staffList) && d.staffList.length > 0) setStaffList(d.staffList);
          if (Array.isArray(d.branches) && d.branches.length > 0) setBranches(d.branches);
          if (Array.isArray(d.departments) && d.departments.length > 0) setDepartments(d.departments);
          if (Array.isArray(d.weeklyProblems)) setWeeklyProblems(d.weeklyProblems);
          if (d.formConfig) setFormConfig(d.formConfig);
          if (d.rolePermissions) setRolePermissions(d.rolePermissions);
          setDbSyncStatus('synced');
        } else if (isMounted) {
          // If server database is empty, seed it with current clean initial state
          syncDataToMySQL({
            branches,
            departments,
            staffList,
            assets,
            transfers,
            tickets,
            weeklyProblems,
            formConfig,
            rolePermissions,
          }).then((s) => {
            if (isMounted) setDbSyncStatus(s.success ? 'synced' : 'idle');
          });
        }
      } catch (err) {
        console.warn('Initial DB fetch error:', err);
        if (isMounted) setDbSyncStatus('idle');
      }
    }
    loadDatabaseOnStartup();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic derivation of technician metrics from Database staffList (Role: IT & ADMIN) and tickets
  useEffect(() => {
    if (staffList.length > 0) {
      const itStaff = staffList.filter((s) => s.role === 'IT' || s.role === 'ADMIN');
      if (itStaff.length > 0) {
        const derivedTechs: TechnicianMetric[] = itStaff.map((st) => {
          const userTickets = tickets.filter(
            (t) =>
              t.assignedToTechnician === st.id ||
              t.assignedToTechnician === st.staffId ||
              t.assignedToTechnician === `tech-${st.id}` ||
              (t.assignedTechnicianName && (t.assignedTechnicianName === st.name || t.assignedTechnicianName === st.thaiName))
          );
          const activeCount = userTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
          const resolvedCount = userTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
          const resolvedWithHours = userTickets.filter((t) => (t.status === 'RESOLVED' || t.status === 'CLOSED') && t.resolutionHours);
          const avgHours = resolvedWithHours.length > 0
            ? Number((resolvedWithHours.reduce((acc, curr) => acc + (curr.resolutionHours || 0), 0) / resolvedWithHours.length).toFixed(1))
            : 2.5;

          const existing = technicians.find((t) => t.id === st.id || t.id === `tech-${st.id}` || t.staffId === st.staffId);

          return {
            id: st.id,
            staffId: st.staffId,
            name: st.thaiName || st.name,
            shortCode: st.nickname ? st.nickname.substring(0, 3).toUpperCase() : (st.thaiName || st.name).substring(0, 2).toUpperCase(),
            roleTitle: st.role === 'ADMIN' ? 'System Administrator / IT Lead' : 'IT Support Specialist',
            title: st.role === 'ADMIN' ? 'System Admin' : 'IT Support',
            efficiency: existing?.efficiency || 95,
            activeTickets: activeCount,
            resolved3Months: resolvedCount,
            avgResolutionHours: avgHours,
            slaOnTimeRate: existing?.slaOnTimeRate || 98,
            grade: existing?.grade || 'A',
            totalCostManaged: userTickets.reduce((acc, curr) => acc + (curr.repairCost || 0), 0),
          };
        });

        setTechnicians(derivedTechs);
        saveTechnicians(derivedTechs);
      }
    }
  }, [staffList, tickets]);

  // 2. Continuous Background Database Sync (Debounced 800ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setDbSyncStatus('syncing');
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
        if (res && res.success) {
          setDbSyncStatus('synced');
        } else {
          setDbSyncStatus('error');
        }
      } catch (err) {
        console.error('Auto Database sync error:', err);
        setDbSyncStatus('error');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    assets,
    transfers,
    tickets,
    staffList,
    branches,
    departments,
    weeklyProblems,
    formConfig,
    rolePermissions,
  ]);

  // Force Manual Database Sync Handler
  const handleForceSyncDb = async () => {
    setDbSyncStatus('syncing');
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
      if (res && res.success) {
        setDbSyncStatus('synced');
      } else {
        setDbSyncStatus('error');
      }
    } catch (err) {
      setDbSyncStatus('error');
    }
  };

  // Persistence effects for LocalStorage Cache
  useEffect(() => {
    saveAssets(assets);
  }, [assets]);

  useEffect(() => {
    saveTransfers(transfers);
  }, [transfers]);

  useEffect(() => {
    saveTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    saveStaff(staffList);
  }, [staffList]);

  useEffect(() => {
    saveBranches(branches);
  }, [branches]);

  useEffect(() => {
    saveDepartments(departments);
  }, [departments]);

  useEffect(() => {
    saveTechnicians(technicians);
  }, [technicians]);

  useEffect(() => {
    saveRolePermissions(rolePermissions);
  }, [rolePermissions]);

  useEffect(() => {
    saveWeeklyProblems(weeklyProblems);
  }, [weeklyProblems]);

  useEffect(() => {
    saveIsLoggedIn(isLoggedIn);
  }, [isLoggedIn]);

  // Handle Login success
  const handleLoginSuccess = (user: UserProfile) => {
    setUserIdState(user.id);
    setCurrentUserId(user.id);
    setIsLoggedIn(true);

    // If first login or still having default password, prompt force change password
    if (user.isFirstLogin || user.password === 'Lemony2026') {
      setShowForceChangePw(true);
    }

    if (user.role === 'USER') {
      setCurrentTab('tickets');
    } else {
      setCurrentTab('dashboard');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowForceChangePw(false);
  };

  // =========================================================================
  // AUTHENTICATION & SECURITY STATE HANDLERS
  // =========================================================================
  /**
   * บันทึกรหัสผ่านใหม่ของผู้ใช้งานปัจจุบัน
   * จะปลดล็อกสถานะ isFirstLogin เพื่อไม่ให้ถามซ้ำ
   */
  const handleSaveNewPassword = (newPassword: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === currentUser.id
          ? { ...s, password: newPassword, isFirstLogin: false }
          : s
      )
    );
    setShowForceChangePw(false);
    setShowChangePwModal(false);
  };

  /**
   * สลับโปรไฟล์ผู้ใช้งานจาก Dropdown ใน Navbar (สำหรับทดสอบ Demo และ Role Testing)
   */
  const handleSelectUser = (user: UserProfile) => {
    setUserIdState(user.id);
    setCurrentUserId(user.id);
    if (user.role === 'USER' && (currentTab === 'admin' || currentTab === 'reports')) {
      setCurrentTab('tickets');
    }
  };

  // ดึงค่าสิทธิ์ Permission Matrix ของบทบาทปัจจุบัน
  const currentPerms: RolePermissionConfig =
    rolePermissions[currentUser.role] || DEFAULT_ROLE_PERMISSIONS[currentUser.role] || DEFAULT_ROLE_PERMISSIONS.USER;

  /**
   * บันทึกการปรับแต่งฟอร์ม A4 และตำแหน่งกล่องลายเซ็น 9 กล่อง
   */
  const handleSaveFormConfig = (newConfig: FormAdjustmentConfig) => {
    setFormConfig(newConfig);
    saveFormConfig(newConfig);
  };

  /**
   * รีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นขององค์กร (Xing Tai Seed Data)
   */
  const handleResetData = () => {
    resetAllDataToDefault();
    setAssets(getStoredAssets());
    setTransfers(getStoredTransfers());
    setTickets(getStoredTickets());
    setStaffList(getStoredStaff());
    setBranches(getStoredBranches());
    setDepartments(getStoredDepartments());
    setTechnicians(getStoredTechnicians());
    setFormConfig(getStoredFormConfig());
    setRolePermissions(getStoredRolePermissions());
    setWeeklyProblems(getStoredWeeklyProblems());
  };

  // =========================================================================
  // ASSET MANAGEMENT & REPAIR LOG HANDLERS
  // =========================================================================
  /**
   * บันทึกหรือสร้างข้อมูลทรัพย์สินใหม่ พร้อมสร้างประวัติ Initial Custody อัตโนมัติ
   */
  const handleSaveAsset = (assetData: Partial<Asset>) => {
    if (editingAsset) {
      // Edit
      setAssets((prev) =>
        prev.map((a) => (a.id === editingAsset.id ? ({ ...a, ...assetData } as Asset) : a))
      );
    } else {
      // Create new
      const newAsset: Asset = {
        id: assetData.id || `ast-${Date.now()}`,
        assetId: assetData.assetId || `3-300-${Math.floor(680000 + Math.random() * 9999)}`,
        itemCode:
          assetData.itemCode ||
          `XT-IT-HW-${new Date().getFullYear().toString().slice(-2)}-${String(assets.length + 1).padStart(4, '0')}`,
        serialNo: assetData.serialNo || '-',
        assetName: assetData.assetName || 'อุปกรณ์ใหม่',
        category: assetData.category || 'Laptop / Notebook',
        brand: assetData.brand || '-',
        model: assetData.model || '-',
        location: assetData.location || 'สำนักงานใหญ่',
        branchCode: assetData.branchCode || currentUser.branchCode || 'TH100',
        departmentCode: assetData.departmentCode || currentUser.departmentCode || 'XT018-IT',
        ownerStaffId: assetData.ownerStaffId || currentUser.staffId,
        ownerStaffName: assetData.ownerStaffName || currentUser.thaiName || currentUser.name,
        status: assetData.status || 'ACTIVE',
        acquisitionDate: assetData.acquisitionDate || new Date().toISOString().split('T')[0],
        cost: assetData.cost || 0,
        supplier: assetData.supplier || '-',
        warrantyExpireDate: assetData.warrantyExpireDate || '2027-12-31',
        notes: assetData.notes || '',
        repairLogs: [],
        custodyHistory: [
          {
            id: `cst-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            toStaffId: assetData.ownerStaffId || currentUser.staffId,
            toStaffName: assetData.ownerStaffName || currentUser.thaiName || currentUser.name,
            toDeptCode: assetData.departmentCode || currentUser.departmentCode || 'XT018-IT',
            location: assetData.location || 'สำนักงานใหญ่',
            reason: 'บันทึกเข้าระบบครั้งแรก (Initial Custody)',
          },
        ],
      };
      setAssets((prev) => [newAsset, ...prev]);
    }
    setIsAssetFormOpen(false);
    setEditingAsset(null);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAssetFormOpen(true);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลทรัพย์สินนี้ใช่หรือไม่?')) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      if (selectedBincardAsset?.id === id) {
        setSelectedBincardAsset(null);
      }
    }
  };

  const handleAddRepairLog = (assetId: string, log: Omit<AssetRepairLog, 'id'>) => {
    const newLog: AssetRepairLog = {
      ...log,
      id: `rep-${Date.now()}`,
    };
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId) {
          const updatedLogs = [...(a.repairLogs || []), newLog];
          return {
            ...a,
            repairLogs: updatedLogs,
            status:
              log.status === 'SENT_TO_REPAIR' || log.status === 'IN_PROGRESS'
                ? 'IN_REPAIR'
                : a.status,
          };
        }
        return a;
      })
    );
  };

  // Dynamic Add Branch/Department/Staff helpers for dropdowns
  const handleAddNewAsset = (newAsset: Asset) => {
    setAssets((prev) => [newAsset, ...prev]);
  };

  const handleAddNewStaff = (newStaff: UserProfile) => {
    setStaffList((prev) => [...prev, newStaff]);
  };

  const handleAddNewDepartment = (newDept: Department) => {
    setDepartments((prev) => [...prev, newDept]);
  };

  const handleAddNewBranch = (newBranch: Branch) => {
    setBranches((prev) => [...prev, newBranch]);
  };

  // ================= TRANSFER HANDLERS =================
  const handleSaveTransfer = (transfer: TransferForm) => {
    if (editingTransfer) {
      setTransfers((prev) =>
        prev.map((t) => (t.id === editingTransfer.id ? transfer : t))
      );
    } else {
      setTransfers((prev) => [transfer, ...prev]);
    }
    setIsNewTransferOpen(false);
    setEditingTransfer(null);
    setTransferInitialAsset(null);
  };

  const handleEditTransfer = (transfer: TransferForm) => {
    setEditingTransfer(transfer);
    setIsNewTransferOpen(true);
  };

  const handleDeleteTransfer = (id: string) => {
    if (confirm('คุณต้องการยกเลิกและลบใบโอนย้ายนี้หรือไม่?')) {
      setTransfers((prev) => prev.filter((t) => t.id !== id));
      if (selectedTransferDoc?.id === id) {
        setSelectedTransferDoc(null);
      }
    }
  };

  // =========================================================================
  // TRANSFER APPROVAL ENGINE (3-STEP DIGITAL SIGNATURES)
  // =========================================================================
  // Helper to format clean display signer name and User-ID
  const getCleanSignerName = (signerName?: string, signature?: string, role = 'IT') => {
    if (signerName && !signerName.startsWith('data:image/') && !signerName.startsWith('http')) {
      return signerName;
    }
    if (currentUser) {
      const uName = currentUser.thaiName || currentUser.name;
      const uStaff = currentUser.staffId ? ` (${currentUser.staffId})` : '';
      return `${uName}${uStaff}`;
    }
    if (signature && !signature.startsWith('data:image/') && !signature.startsWith('http')) {
      return signature;
    }
    return `${role} Specialist`;
  };

  /**
   * ขั้นตอนที่ 1: ฝ่ายไอที / ผู้จัดทำ (IT Specialist / Prepared By)
   * เปลี่ยนสถานะจาก PENDING_IT -> PENDING_MANAGER
   */
  const handleApproveIT = (transferId: string, signature: string, signerName?: string) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const approvedByName = getCleanSignerName(signerName, signature, 'IT');
    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id === transferId) {
          return {
            ...t,
            itApproved: true,
            itApprovedBy: approvedByName,
            itApprovedDate: nowStr,
            itSignature: signature,
            status: 'PENDING_MANAGER' as const,
          };
        }
        return t;
      })
    );
  };

  /**
   * ขั้นตอนที่ 2: ผู้จัดการแผนกต้นทาง (Transferor Department Manager)
   * เปลี่ยนสถานะจาก PENDING_MANAGER -> PENDING_ACC
   */
  const handleApproveManager = (transferId: string, signature: string, signerName?: string) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const approvedByName = getCleanSignerName(signerName, signature, 'MANAGER');
    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id === transferId) {
          return {
            ...t,
            managerApproved: true,
            managerApprovedBy: approvedByName,
            managerApprovedDate: nowStr,
            managerSignature: signature,
            status: 'PENDING_ACC' as const,
          };
        }
        return t;
      })
    );
  };

  /**
   * ขั้นตอนที่ 3: ฝ่ายบัญชีและการเงิน (Accounting Controller)
   * เปลี่ยนสถานะเป็น APPROVED (พร้อมส่งมอบและกดเสร็จสิ้น)
   */
  const handleApproveACC = (transferId: string, signature: string, signerName?: string) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const approvedByName = getCleanSignerName(signerName, signature, 'ACC');
    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id === transferId) {
          return {
            ...t,
            accApproved: true,
            accApprovedBy: approvedByName,
            accApprovedDate: nowStr,
            accSignature: signature,
            status: 'APPROVED' as const,
          };
        }
        return t;
      })
    );
  };

  /**
   * Finalize Transfer (เสร็จสิ้นการโอนย้ายทรัพย์สิน):
   * 1. ปรับสถานะใบโอนเป็น COMPLETED
   * 2. อัปเดต Location, DepartmentCode, OwnerStaffId บน Asset Master ทันที
   * 3. เพิ่มรายการใน CustodyHistory (Bin Card) ของทรัพย์สินแต่ละรายการ
   */
  const handleFinalizeTransfer = (transfer: TransferForm) => {
    // 1. Update status to COMPLETED
    setTransfers((prev) =>
      prev.map((t) => (t.id === transfer.id ? { ...t, status: 'COMPLETED' as const } : t))
    );

    // 2. Update Asset locations & owners and Custody History
    setAssets((prev) =>
      prev.map((a) => {
        const item = transfer.items.find((i) => i.assetId === a.assetId);
        if (item) {
          const custody: AssetCustodyHistory = {
            id: `cst-${Date.now()}-${a.id}`,
            transferFormNo: transfer.formNo,
            date: new Date().toISOString().split('T')[0],
            fromStaffId: item.transferorStaffId,
            fromStaffName: item.transferorStaffName,
            fromDeptCode: item.transferorDeptCode,
            toStaffId: item.receiverStaffId,
            toStaffName: item.receiverStaffName,
            toDeptCode: item.receiverDeptCode,
            location: item.receiverLocation || a.location,
            reason: transfer.reasonType,
            approvedBy: transfer.accApprovedBy || currentUser.thaiName || currentUser.name,
          };

          return {
            ...a,
            branchCode: transfer.originatingBranchCode || a.branchCode,
            departmentCode: item.receiverDeptCode || a.departmentCode,
            ownerStaffId: item.receiverStaffId || a.ownerStaffId,
            ownerStaffName: item.receiverStaffName || a.ownerStaffName,
            location: item.receiverLocation || a.location,
            custodyHistory: [...(a.custodyHistory || []), custody],
          };
        }
        return a;
      })
    );

    if (selectedTransferDoc?.id === transfer.id) {
      setSelectedTransferDoc((prev) => (prev ? { ...prev, status: 'COMPLETED' as const } : null));
    }
  };

  // =========================================================================
  // IT HELPDESK & TICKET LIFECYCLE HANDLERS
  // =========================================================================
  /**
   * เปิด Ticket ใบแจ้งซ่อมใหม่ พร้อมผูกข้อมูลผู้แจ้ง, แผนก, สาขา และอุปกรณ์ที่เกี่ยวข้อง
   */
  const handleSaveTicket = (ticketData: Partial<ITTicket>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newTicket: ITTicket = {
      id: ticketData.id || `#XT-${Math.floor(8000 + Math.random() * 1999)}`,
      subject: ticketData.subject || 'แจ้งซ่อมอุปกรณ์ IT',
      details: ticketData.details || '-',
      category: ticketData.category || 'HARDWARE_MALFUNCTION',
      priority: ticketData.priority || 'MEDIUM',
      status: ticketData.status || 'NEW',
      requesterStaffId: ticketData.requesterStaffId || currentUser.staffId,
      requesterStaffName: ticketData.requesterStaffName || currentUser.thaiName || currentUser.name,
      requesterDept: ticketData.requesterDept || currentUser.departmentCode || 'XT018-IT',
      requesterBranch: ticketData.requesterBranch || currentUser.branchCode || 'TH100',
      assetId: ticketData.assetId,
      assetName: ticketData.assetName,
      createdAt: ticketData.createdAt || nowStr,
      updatedAt: ticketData.updatedAt || nowStr,
      historyLog: ticketData.historyLog || [
        {
          timestamp: nowStr,
          action: 'Ticket submitted via Helpdesk Portal',
          byUser: currentUser.thaiName || currentUser.name,
        },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setIsNewTicketOpen(false);
    setNewTicketInitialAsset(null);
  };

  /**
   * อัปเดตข้อมูล Ticket (มอบหมายช่าง, เปลี่ยนสถานะ, ตอบกลับ, บันทึกการส่งซ่อม)
   */
  const handleUpdateTicket = (updatedTicket: ITTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    if (selectedTicketDetail?.id === updatedTicket.id) {
      setSelectedTicketDetail(updatedTicket);
    }
  };

  // ตัวนับสถานะสำหรับแสดง Badge Notification ในแถบเมนู
  const pendingTransfersCount = transfers.filter((t) => t.status.startsWith('PENDING')).length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

  // กรองค้นหาทรัพย์สินแบบ Global Quick Filter
  const filteredAssets = assets.filter((a) => {
    if (!globalSearch.trim()) return true;
    const q = globalSearch.toLowerCase();
    return (
      a.assetId.toLowerCase().includes(q) ||
      a.itemCode.toLowerCase().includes(q) ||
      (a.serialNo && a.serialNo.toLowerCase().includes(q)) ||
      a.assetName.toLowerCase().includes(q) ||
      (a.brand && a.brand.toLowerCase().includes(q)) ||
      (a.model && a.model.toLowerCase().includes(q)) ||
      (a.ownerStaffName && a.ownerStaffName.toLowerCase().includes(q))
    );
  });

  // If user is not logged in, render LoginScreen
  if (!isLoggedIn) {
    return (
      <LoginScreen
        staffList={staffList}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#090a0f] text-zinc-100 font-sans antialiased overflow-hidden">
      {/* 1. Sidebar Navigation with Dynamic Role Access */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={currentUser.role}
        rolePermissions={rolePermissions}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
        pendingTransfersCount={pendingTransfersCount}
        openTicketsCount={openTicketsCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. Top Header / Navbar */}
        <Navbar
          currentUser={currentUser}
          allStaff={staffList}
          onSelectUser={handleSelectUser}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
          onSearchGlobal={setGlobalSearch}
          searchQuery={globalSearch}
          onOpenChangePassword={() => setShowChangePwModal(true)}
          onOpenGoogleSheetsSync={() => setIsGoogleSheetsSyncOpen(true)}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          dbSyncStatus={dbSyncStatus}
          onForceSyncDb={handleForceSyncDb}
          onFetchFromDb={() => handleFetchDataFromDatabase(true)}
        />

        {/* 3. Main Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 bg-[#0c0e14]">
          <div className="max-w-[1600px] mx-auto">
            {/* Tab: Dashboard */}
            {currentTab === 'dashboard' && (
              <CommandCenter
                assets={assets}
                tickets={tickets}
                transfers={transfers}
                technicians={technicians}
                onSelectTicket={(ticket) => setSelectedTicketDetail(ticket)}
                onNavigateToTransfers={() => setCurrentTab('transfers')}
                onNavigateToAssets={() => setCurrentTab('assets')}
                onNavigateToTickets={() => setCurrentTab('tickets')}
              />
            )}

            {/* Tab: Assets */}
            {currentTab === 'assets' && (
              <AssetInventory
                assets={filteredAssets}
                branches={branches}
                departments={departments}
                staffList={staffList}
                currentUser={currentUser}
                onOpenAddModal={() => {
                  setEditingAsset(null);
                  setIsAssetFormOpen(true);
                }}
                onOpenEditModal={handleEditAsset}
                onDeleteAsset={handleDeleteAsset}
                onOpenBincard={(asset) => setSelectedBincardAsset(asset)}
                onOpenQrScanner={() => setIsQrScannerOpen(true)}
                onOpenQrLabelModal={(selectedAssets) => {
                  setQrLabelAssets(selectedAssets);
                  setIsQrLabelModalOpen(true);
                }}
                onInitiateTransfer={(asset) => {
                  setTransferInitialAsset(asset);
                  setIsNewTransferOpen(true);
                }}
                onOpenGoogleSheets={() => setIsGoogleSheetsSyncOpen(true)}
                globalSearchQuery={globalSearch}
              />
            )}

            {/* Tab: Transfers */}
            {currentTab === 'transfers' && (
              <TransferList
                transfers={transfers}
                currentUser={currentUser}
                onOpenTransferDoc={(transfer) => setSelectedTransferDoc(transfer)}
                onOpenNewTransferModal={() => {
                  setEditingTransfer(null);
                  setTransferInitialAsset(null);
                  setIsNewTransferOpen(true);
                }}
                onEditTransfer={handleEditTransfer}
                onDeleteTransfer={handleDeleteTransfer}
              />
            )}

            {/* Tab: IT Tickets */}
            {currentTab === 'tickets' && (
              <TicketList
                tickets={tickets}
                technicians={technicians}
                currentUser={currentUser}
                onOpenTicketDetail={(ticket) => setSelectedTicketDetail(ticket)}
                onOpenNewTicketModal={() => {
                  setNewTicketInitialAsset(null);
                  setIsNewTicketOpen(true);
                }}
              />
            )}

            {/* Tab: Executive & IT Analytics (Separated Asset and Ticket reports) */}
            {currentTab === 'reports' && (
              <ExecutiveReport
                tickets={tickets}
                assets={assets}
                transfers={transfers}
                technicians={technicians}
                branches={branches}
                departments={departments}
                weeklyProblems={weeklyProblems}
              />
            )}

            {/* Tab: Admin Master Data, Branches, Departments & Role Permissions */}
            {currentTab === 'admin' && (
              <BackendManager
                branches={branches}
                departments={departments}
                staffList={staffList}
                formConfig={formConfig}
                rolePermissions={rolePermissions}
                assets={assets}
                transfers={transfers}
                tickets={tickets}
                weeklyProblems={weeklyProblems}
                onSaveStaff={setStaffList}
                onSaveBranches={setBranches}
                onSaveDepartments={setDepartments}
                onSaveFormConfig={handleSaveFormConfig}
                onSaveRolePermissions={setRolePermissions}
                onResetToDefault={handleResetData}
                onOpenGoogleSheets={() => setIsGoogleSheetsSyncOpen(true)}
                onRefreshData={() => handleFetchDataFromDatabase(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* ================= MODALS ================= */}

      {/* Google Sheets Live Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsSyncOpen}
        onClose={() => setIsGoogleSheetsSyncOpen(false)}
        assets={assets}
        tickets={tickets}
        transfers={transfers}
      />

      {/* Force Change Password on First Login */}
      {showForceChangePw && (
        <ForceChangePasswordModal
          currentUser={currentUser}
          onSavePassword={handleSaveNewPassword}
        />
      )}

      {/* Voluntary Change Password Modal */}
      {showChangePwModal && (
        <ChangePasswordModal
          currentUser={currentUser}
          isOpen={showChangePwModal}
          onClose={() => setShowChangePwModal(false)}
          onSavePassword={handleSaveNewPassword}
        />
      )}

      {/* 1. Asset Bincard Modal */}
      <AssetBincardModal
        asset={selectedBincardAsset}
        onClose={() => setSelectedBincardAsset(null)}
        onAddRepairLog={handleAddRepairLog}
        tickets={tickets}
      />

      {/* 2. Asset Form Modal (Add / Edit) */}
      <AssetFormModal
        isOpen={isAssetFormOpen}
        onClose={() => {
          setIsAssetFormOpen(false);
          setEditingAsset(null);
        }}
        onSave={handleSaveAsset}
        initialAsset={editingAsset}
        branches={branches}
        departments={departments}
        staffList={staffList}
      />

      {/* 3. QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        assets={assets}
        onSelectAsset={(asset) => setSelectedBincardAsset(asset)}
        onOpenBincard={(asset) => setSelectedBincardAsset(asset)}
        onInitiateTransfer={(asset) => {
          setTransferInitialAsset(asset);
          setIsNewTransferOpen(true);
        }}
        onCreateTicketForAsset={(asset) => {
          setNewTicketInitialAsset(asset);
          setIsNewTicketOpen(true);
        }}
      />

      {/* 4. QR Label Print Modal */}
      <QRLabelPrintModal
        isOpen={isQrLabelModalOpen}
        onClose={() => setIsQrLabelModalOpen(false)}
        assets={qrLabelAssets.length > 0 ? qrLabelAssets : assets}
      />

      {/* 5. Transfer Form A4 Landscape Modal (With 3-Step Approval & Pre-Print Layout Customizer) */}
      <TransferFormA4Modal
        transfer={selectedTransferDoc}
        currentUser={currentUser}
        formConfig={formConfig}
        onUpdateFormConfig={handleSaveFormConfig}
        onClose={() => setSelectedTransferDoc(null)}
        onApproveManager={handleApproveManager}
        onApproveIT={handleApproveIT}
        onApproveACC={handleApproveACC}
        onFinalizeTransfer={handleFinalizeTransfer}
        onEditTransfer={(transfer) => {
          setSelectedTransferDoc(null);
          handleEditTransfer(transfer);
        }}
        onDeleteTransfer={handleDeleteTransfer}
      />

      {/* 6. New / Edit Transfer Form Wizard */}
      <NewTransferModal
        isOpen={isNewTransferOpen}
        onClose={() => {
          setIsNewTransferOpen(false);
          setTransferInitialAsset(null);
          setEditingTransfer(null);
        }}
        onSave={handleSaveTransfer}
        assets={assets}
        branches={branches}
        departments={departments}
        staffList={staffList}
        initialSelectedAsset={transferInitialAsset}
        editingTransfer={editingTransfer}
        onAddNewAsset={handleAddNewAsset}
        onAddNewStaff={handleAddNewStaff}
        onAddNewDepartment={handleAddNewDepartment}
        onAddNewBranch={handleAddNewBranch}
      />

      {/* 7. Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicketDetail}
        currentUser={currentUser}
        technicians={technicians}
        staffList={staffList}
        assets={assets}
        onClose={() => setSelectedTicketDetail(null)}
        onUpdateTicket={handleUpdateTicket}
        onOpenAssetBincard={(asset) => setSelectedBincardAsset(asset)}
      />

      {/* 8. New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => {
          setIsNewTicketOpen(false);
          setNewTicketInitialAsset(null);
        }}
        onSubmit={handleSaveTicket}
        currentUser={currentUser}
        assets={assets}
        initialAsset={newTicketInitialAsset}
      />

      {/* 9. Floating Database Feedback Notification Toast */}
      {dbToast && dbToast.show && (
        <div
          id="db-sync-toast"
          className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div
            className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 ${
              dbToast.type === 'success'
                ? 'bg-[#0f241a]/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50'
                : dbToast.type === 'error'
                ? 'bg-[#291113]/95 border-rose-500/60 text-rose-100 shadow-rose-950/50'
                : 'bg-[#101b33]/95 border-blue-500/60 text-blue-100 shadow-blue-950/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                dbToast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : dbToast.type === 'error'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {dbToast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : dbToast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Database className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold font-mono tracking-wide">{dbToast.title}</div>
                <button
                  onClick={() => setDbToast(null)}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer p-0.5"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">{dbToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
