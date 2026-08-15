/**
 * ============================================================================
 * [PERSISTENCE ADAPTER: LOCAL STORAGE & CLIENT CACHE]
 * File: /src/utils/storage.ts
 * Description: Robust client-side LocalStorage cache manager with automatic
 *              initialization, error recovery, and schema synchronization.
 * 
 * [ฟังก์ชันหลัก]:
 * - getStoredAssets / saveAssets: อ่านและบันทึกข้อมูลทะเบียนทรัพย์สิน
 * - getStoredTransfers / saveTransfers: บันทึกประวัติใบโอนย้าย A4 และลายเซ็น
 * - getStoredTickets / saveTickets: บันทึกใบแจ้งซ่อมและประวัติ Helpdesk
 * - getStoredStaff / saveStaff: บันทึกรายชื่อพนักงานและรหัสผ่าน
 * - resetAllDataToDefault: รีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นขององค์กร
 * ============================================================================
 */

import {
  AppNotification,
  Asset,
  Branch,
  Department,
  FormAdjustmentConfig,
  ITTicket,
  SystemRolePermissions,
  TechnicianMetric,
  TransferForm,
  UserProfile,
  WeeklyProblemSummary,
} from '../types';
import {
  DEFAULT_FORM_ADJUSTMENT,
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_ASSETS,
  INITIAL_BRANCHES,
  INITIAL_DEPARTMENTS,
  INITIAL_STAFF,
  INITIAL_TECHNICIANS,
  INITIAL_TICKETS,
  INITIAL_TRANSFERS,
  INITIAL_WEEKLY_PROBLEMS,
} from '../data/initialData';

const STORAGE_KEYS = {
  ASSETS: 'xt_assets_v2',
  TRANSFERS: 'xt_transfers_v2',
  TICKETS: 'xt_tickets_v2',
  STAFF: 'xt_staff_v2',
  BRANCHES: 'xt_branches_v2',
  DEPARTMENTS: 'xt_departments_v2',
  TECHNICIANS: 'xt_technicians_v2',
  CURRENT_USER_ID: 'xt_current_user_id_v2',
  FORM_CONFIG: 'xt_form_config_v2',
  ROLE_PERMISSIONS: 'xt_role_permissions_v2',
  WEEKLY_PROBLEMS: 'xt_weekly_problems_v2',
  IS_LOGGED_IN: 'xt_is_logged_in_v2',
  NOTIFICATIONS: 'xt_notifications_v2',
};

export const getStoredAssets = (): Asset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
      return INITIAL_ASSETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse assets from storage', e);
    return INITIAL_ASSETS;
  }
};

export const saveAssets = (assets: Asset[]): void => {
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
};

export const getStoredTransfers = (): TransferForm[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(INITIAL_TRANSFERS));
      return INITIAL_TRANSFERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse transfers from storage', e);
    return INITIAL_TRANSFERS;
  }
};

export const saveTransfers = (transfers: TransferForm[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
};

export const getStoredTickets = (): ITTicket[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse tickets from storage', e);
    return INITIAL_TICKETS;
  }
};

export const saveTickets = (tickets: ITTicket[]): void => {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
};

export const getStoredStaff = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_STAFF;
  }
};

export const saveStaff = (staff: UserProfile[]): void => {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
};

export const getStoredBranches = (): Branch[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
      return INITIAL_BRANCHES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_BRANCHES;
  }
};

export const getStoredDepartments = (): Department[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
      return INITIAL_DEPARTMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_DEPARTMENTS;
  }
};

export const saveBranches = (branches: Branch[]): void => {
  localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
};

export const saveDepartments = (departments: Department[]): void => {
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
};

export const getStoredTechnicians = (): TechnicianMetric[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(INITIAL_TECHNICIANS));
      return INITIAL_TECHNICIANS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_TECHNICIANS;
  }
};

export const saveTechnicians = (techs: TechnicianMetric[]): void => {
  localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(techs));
};

export const getCurrentUserId = (): string => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'u-admin';
};

export const setCurrentUserId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
};

export const getStoredFormConfig = (): FormAdjustmentConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORM_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FORM_CONFIG, JSON.stringify(DEFAULT_FORM_ADJUSTMENT));
      return DEFAULT_FORM_ADJUSTMENT;
    }
    const parsed = JSON.parse(raw);
    const signBoxOrder =
      Array.isArray(parsed.signBoxOrder) && parsed.signBoxOrder.length === 9
        ? parsed.signBoxOrder
        : DEFAULT_FORM_ADJUSTMENT.signBoxOrder;

    return {
      ...DEFAULT_FORM_ADJUSTMENT,
      ...parsed,
      signBoxOrder,
    };
  } catch (e) {
    return DEFAULT_FORM_ADJUSTMENT;
  }
};

export const saveFormConfig = (config: FormAdjustmentConfig): void => {
  localStorage.setItem(STORAGE_KEYS.FORM_CONFIG, JSON.stringify(config));
};

export const getStoredRolePermissions = (): SystemRolePermissions => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
      return DEFAULT_ROLE_PERMISSIONS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...parsed,
    };
  } catch (e) {
    return DEFAULT_ROLE_PERMISSIONS;
  }
};

export const saveRolePermissions = (perms: SystemRolePermissions): void => {
  localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(perms));
};

export const getStoredWeeklyProblems = (): WeeklyProblemSummary[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_PROBLEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_PROBLEMS, JSON.stringify(INITIAL_WEEKLY_PROBLEMS));
      return INITIAL_WEEKLY_PROBLEMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_WEEKLY_PROBLEMS;
  }
};

export const saveWeeklyProblems = (data: WeeklyProblemSummary[]): void => {
  localStorage.setItem(STORAGE_KEYS.WEEKLY_PROBLEMS, JSON.stringify(data));
};

export const getStoredAuthStatus = (): boolean => {
  const status = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
  return status === 'true';
};

export const saveAuthStatus = (isLoggedIn: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(isLoggedIn));
};

export const getStoredIsLoggedIn = getStoredAuthStatus;
export const saveIsLoggedIn = saveAuthStatus;

export const getStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      const initialNotifs: AppNotification[] = [
        {
          id: 'notif-init-1',
          type: 'NEW_TICKET',
          title: 'ยินดีต้อนรับสู่ระบบแจ้งเตือน IT Helpdesk',
          message: 'ระบบจะส่งเสียงและแจ้งเตือนทันทีเมื่อมีผู้ส่ง Ticket แจ้งซ่อมใหม่',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          priority: 'MEDIUM',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifs));
      return initialNotifs;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveNotifications = (notifications: AppNotification[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const resetAllDataToDefault = (): void => {
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
  localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(INITIAL_TRANSFERS));
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
  localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(INITIAL_TECHNICIANS));
  localStorage.setItem(STORAGE_KEYS.FORM_CONFIG, JSON.stringify(DEFAULT_FORM_ADJUSTMENT));
  localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  localStorage.setItem(STORAGE_KEYS.WEEKLY_PROBLEMS, JSON.stringify(INITIAL_WEEKLY_PROBLEMS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'u-admin');
  localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
};

