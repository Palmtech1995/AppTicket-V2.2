/**
 * ============================================================================
 * [SERVICE: GOOGLE SHEETS & WORKSPACE INTEGRATION]
 * File: /src/services/googleSheetsService.ts
 * Description: Client-side Firebase OAuth authentication and Google Sheets API
 *              synchronization for Assets, IT Tickets, and Transfer Handover data.
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Asset, ITTicket, TransferForm } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize auth listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google using popup and capture access token for Google Sheets API
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google OAuth access token');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errCode = error?.code || '';
    const errMsg = error?.message || '';

    // Gracefully handle user cancellation or closing popup window
    if (
      errCode === 'auth/popup-closed-by-user' ||
      errCode === 'auth/cancelled-popup-request' ||
      errMsg.includes('popup-closed-by-user') ||
      errMsg.includes('cancelled-popup-request')
    ) {
      console.warn('Google Sign-In popup was closed or cancelled by user.');
      return null;
    }

    if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
      throw new Error('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป (Popup Blocked) กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้แล้วลองใหม่อีกครั้ง');
    }

    console.error('Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Helper to create a structured Google Spreadsheet with multiple tabs
 */
export async function createGoogleSpreadsheet(
  title: string,
  token: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: 'Asset_Inventory', tabColor: { red: 0.05, green: 0.6, blue: 0.8 } } },
      { properties: { title: 'IT_Tickets', tabColor: { red: 0.9, green: 0.5, blue: 0.1 } } },
      { properties: { title: 'Transfer_Handover', tabColor: { red: 0.2, green: 0.7, blue: 0.4 } } },
      { properties: { title: 'Summary_Report', tabColor: { red: 0.5, green: 0.2, blue: 0.8 } } },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

/**
 * Format and populate all tabs in the Google Spreadsheet
 */
export async function syncAllDataToSpreadsheet(
  spreadsheetId: string,
  token: string,
  assets: Asset[],
  tickets: ITTicket[],
  transfers: TransferForm[]
): Promise<boolean> {
  // 1. Prepare Asset Rows
  const assetHeader = [
    'รหัสทรัพย์สิน (Asset ID)',
    'รหัสสินค้า (Item Code)',
    'ชื่อรายการทรัพย์สิน (Asset Name)',
    'หมวดหมู่ (Category)',
    'แบรนด์ (Brand)',
    'รุ่น (Model)',
    'Serial Number',
    'สาขา (Branch)',
    'แผนก (Department)',
    'สถานที่ตั้ง (Location)',
    'ผู้ครอบครอง (Owner)',
    'สถานะ (Status)',
    'วันที่ได้มา (Acquisition Date)',
    'มูลค่า (Cost THB)',
    'ผู้จำหน่าย (Supplier)',
    'วันหมดประกัน (Warranty Expire)',
    'หมายเหตุ (Notes)',
  ];

  const assetRows = assets.map((a) => [
    a.assetId,
    a.itemCode,
    a.assetName,
    a.category,
    a.brand || '-',
    a.model || '-',
    a.serialNo || '-',
    a.branchCode,
    a.departmentCode,
    a.location,
    a.ownerStaffName || '-',
    a.status,
    a.acquisitionDate,
    a.cost,
    a.supplier || '-',
    a.warrantyExpireDate || '-',
    a.notes || '',
  ]);

  // 2. Prepare IT Ticket Rows
  const ticketHeader = [
    'เลขที่ Ticket',
    'หัวข้อปัญหา (Subject)',
    'หมวดหมู่ (Category)',
    'ความสำคัญ (Priority)',
    'สถานะ (Status)',
    'ผู้แจ้ง (Requester)',
    'แผนก (Department)',
    'สาขา (Branch)',
    'ช่างผู้รับผิดชอบ (Assigned Tech)',
    'รหัสทรัพย์สินที่เกี่ยวข้อง',
    'วันที่แจ้ง (Created At)',
    'วันที่แก้ไขเสร็จ (Resolved At)',
    'ชั่วโมงแก้ไข (Hours)',
    'ค่าใช้จ่ายซ่อม (THB)',
    'ร้านซ่อมภายนอก (Vendor)',
    'รายละเอียดปัญหา (Details)',
    'บันทึกการแก้ไข (Resolution Note)',
  ];

  const ticketRows = tickets.map((t) => [
    t.id,
    t.subject,
    t.category,
    t.priority,
    t.status,
    t.requesterStaffName,
    t.requesterDept,
    t.requesterBranch,
    t.assignedTechnicianName || 'Unassigned',
    t.assetId || '-',
    t.createdAt,
    t.resolvedAt || '-',
    t.resolutionHours || 0,
    t.repairCost || 0,
    t.repairVendor || '-',
    t.details,
    t.resolutionNote || '-',
  ]);

  // 3. Prepare Transfer Rows
  const transferHeader = [
    'เลขที่เอกสารโอนย้าย (Form No)',
    'วันที่สร้าง (Created Date)',
    'สาขาต้นทาง (Originating Branch)',
    'แผนกต้นทาง (Originating Dept)',
    'เหตุผลการโอนย้าย (Reason)',
    'สถานะ (Status)',
    'จำนวนรายการ (Item Count)',
    'อนุมัติ IT',
    'ผู้อนุมัติ IT',
    'อนุมัติ Manager',
    'ผู้อนุมัติ Manager',
    'รับทราบ Accounting',
    'ผู้รับทราบ Accounting',
    'ผู้ส่งมอบ (Delivered By)',
    'ทะเบียนรถขนส่ง (Vehicle Plate)',
    'หมายเหตุ (Notes)',
  ];

  const transferRows = transfers.map((tr) => [
    tr.formNo,
    tr.createdDate,
    tr.originatingBranch,
    tr.originatingDept,
    tr.reasonType,
    tr.status,
    tr.items?.length || 0,
    tr.itApproved ? 'YES' : 'NO',
    tr.itApprovedBy || '-',
    tr.managerApproved ? 'YES' : 'NO',
    tr.managerApprovedBy || '-',
    tr.accApproved ? 'YES' : 'NO',
    tr.accApprovedBy || '-',
    tr.deliveredBy || '-',
    tr.vehiclePlateNo || '-',
    tr.notes || '',
  ]);

  // 4. Prepare Summary Rows
  const totalAssetCost = assets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  const activeAssets = assets.filter((a) => a.status === 'ACTIVE').length;
  const inRepairAssets = assets.filter((a) => a.status === 'IN_REPAIR' || a.status === 'MAINTENANCE').length;
  const totalRepairCost = tickets.reduce((sum, t) => sum + (Number(t.repairCost) || 0), 0);
  const openTickets = tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;

  const summaryRows = [
    ['รายงานสรุปภาพรวมระบบสินทรัพย์และไอที Xing Tai Trading (Thailand)'],
    ['วันที่สร้างข้อมูลซิงค์:', new Date().toLocaleString('th-TH')],
    [''],
    ['ดัชนีชี้วัด (KPI Metrics)', 'จำนวน / มูลค่า'],
    ['จำนวนสินทรัพย์ทั้งหมด (Total Assets)', assets.length],
    ['สินทรัพย์พร้อมใช้งาน (Active Assets)', activeAssets],
    ['สินทรัพย์อยู่ระหว่างส่งซ่อม (In Repair)', inRepairAssets],
    ['มูลค่าสินทรัพย์รวมทั้งหมด (Total Asset Value)', `${totalAssetCost.toLocaleString()} บาท`],
    ['จำนวนใบแจ้งซ่อมทั้งหมด (Total Tickets)', tickets.length],
    ['ใบแจ้งซ่อมที่รอดำเนินการ (Pending Tickets)', openTickets],
    ['ค่าใช้จ่ายซ่อมแซมสะสม (Total Repair Cost)', `${totalRepairCost.toLocaleString()} บาท`],
    ['จำนวนใบโอนย้ายทรัพย์สิน (Total Transfers)', transfers.length],
  ];

  // Batch update values
  const dataPayload = [
    {
      range: 'Asset_Inventory!A1',
      values: [assetHeader, ...assetRows],
    },
    {
      range: 'IT_Tickets!A1',
      values: [ticketHeader, ...ticketRows],
    },
    {
      range: 'Transfer_Handover!A1',
      values: [transferHeader, ...transferRows],
    },
    {
      range: 'Summary_Report!A1',
      values: summaryRows,
    },
  ];

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload,
      }),
    }
  );

  if (!updateResponse.ok) {
    const err = await updateResponse.json();
    throw new Error(err.error?.message || 'Failed to update Google Spreadsheet values');
  }

  return true;
}

/**
 * Read Asset rows from an existing Google Spreadsheet
 */
export async function readSpreadsheetAssets(
  spreadsheetId: string,
  token: string,
  range: string = 'Asset_Inventory!A2:Q'
): Promise<any[]> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to read Google Spreadsheet data');
  }

  const data = await response.json();
  return data.values || [];
}
