/**
 * ============================================================================
 * [TYPES & DATA SCHEMA DICTIONARY]
 * File: /src/types.ts
 * Description: TypeScript Interfaces & System Types for Xing Tai Trading (Thailand)
 * 
 * [โครงสร้าง Type หลัก]:
 * 1. UserRole & SystemRolePermissions: RBAC 5-Role Matrix (ADMIN, IT, ACC, MANAGER, USER)
 * 2. UserProfile: ข้อมูลพนักงานและข้อมูลการล็อกอิน
 * 3. Asset & AssetRepairLog & AssetCustodyHistory: ทะเบียนทรัพย์สิน, บันทึกการส่งซ่อม, ประวัติผู้ครอบครอง
 * 4. TransferForm & TransferItem: ใบโอนย้ายทรัพย์สิน A4 และระบบ 3 ลายเซ็นดิจิทัล
 * 5. FormAdjustmentConfig: โครงสร้างการตั้งค่าแบบฟอร์ม A4 และ 9 กล่องลายเซ็น
 * 6. ITTicket & WeeklyProblemSummary: ใบแจ้งซ่อม Helpdesk, SLA Tracker และ KPI รายสัปดาห์
 * ============================================================================
 */

export type UserRole = 'ADMIN' | 'IT' | 'ACC' | 'MANAGER' | 'USER';

export interface RolePermissionConfig {
  canViewDashboard: boolean;
  canViewAssets: boolean;
  canCreateEditAsset: boolean;
  canDeleteAsset: boolean;
  canPrintQr: boolean;
  canViewTransfers: boolean;
  canCreateTransfer: boolean;
  canEditTransfer: boolean;
  canDeleteTransfer: boolean;
  canApproveIT: boolean;
  canApproveManager: boolean;
  canApproveACC: boolean;
  canViewTickets: boolean;
  canCreateTicket: boolean;
  canAssignTechnician: boolean;
  canResolveTicket: boolean;
  canViewAssetReports: boolean;
  canViewITReports: boolean;
  canManageBackend: boolean;
  canManageRoles: boolean;
}

export type SystemRolePermissions = Record<UserRole, RolePermissionConfig>;

export interface UserProfile {
  id: string;
  name: string;
  thaiName: string;
  nickname?: string;
  email: string;
  username?: string;
  password?: string;
  isFirstLogin?: boolean;
  role: UserRole;
  departmentCode: string;
  departmentName: string;
  branchCode: string;
  branchName: string;
  avatarUrl?: string;
  staffId: string;
}

export interface Branch {
  code: string;
  name: string;
  address: string;
  phone: string;
  taxId: string;
}

export interface Department {
  code: string;
  name: string;
  nameEn: string;
}

export type AssetStatus = 'ACTIVE' | 'MAINTENANCE' | 'TRANSFERRED' | 'RETIRED' | 'DAMAGED' | 'IN_REPAIR';

export interface AssetRepairLog {
  id: string;
  ticketId?: string;
  sentDate: string;
  vendorName: string;
  issueDescription: string;
  repairCost: number;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: 'SENT_TO_REPAIR' | 'IN_PROGRESS' | 'RETURNED' | 'CANNOT_REPAIR';
  technicianInCharge: string;
  replacedParts?: string;
  notes?: string;
}

export interface AssetCustodyHistory {
  id: string;
  transferFormNo?: string;
  date: string;
  fromStaffId?: string;
  fromStaffName?: string;
  fromDeptCode?: string;
  toStaffId: string;
  toStaffName: string;
  toDeptCode: string;
  location: string;
  reason: string;
  approvedBy?: string;
}

export interface Asset {
  id: string; // Unique system ID
  assetId: string; // Official Asset ID e.g. 3-300-680031
  itemCode: string; // Item code / Serial e.g. XT-IT-HW-23-0105
  serialNo: string; // Hardware Serial No e.g. 01602537007234
  assetName: string; // Full Thai / English name & specs
  category: string;
  brand?: string;
  model?: string;
  location: string;
  branchCode: string;
  departmentCode: string;
  ownerStaffId?: string;
  ownerStaffName?: string;
  status: AssetStatus;
  acquisitionDate: string;
  cost: number;
  supplier?: string;
  warrantyExpireDate?: string;
  notes?: string;
  imageUrl?: string;
  repairLogs: AssetRepairLog[];
  custodyHistory: AssetCustodyHistory[];
}

export type TransferReason = 'NEW_EMPLOYEE' | 'RESIGNATION' | 'BRANCH_TRANSFER' | 'TEMPORARY_BORROW' | 'OTHERS';

export interface TransferItem {
  no: number;
  assetSystemId: string;
  assetId: string;
  itemCode: string;
  serialNo: string;
  assetName: string;
  qty: number;
  transferorDeptCode: string;
  transferorStaffId: string;
  transferorStaffName: string;
  receiverDeptCode: string;
  receiverStaffId: string;
  receiverStaffName: string;
  receiverLocation: string;
}

export interface TransferSignature {
  roleTitle: string;
  thaiRoleTitle: string;
  chineseRoleTitle?: string;
  signerName?: string;
  signerStaffId?: string;
  signedDate?: string;
  signatureData?: string; // base64 or timestamp confirmation
  isApproved: boolean;
}

export interface TransferForm {
  id: string;
  formNo: string; // e.g. TF6908013
  createdDate: string;
  originatingBranch: string;
  originatingBranchCode: string;
  originatingDept: string;
  reasonType: TransferReason;
  reasonNote?: string;
  items: TransferItem[];
  
  // 3-step primary approval statuses (Step 1: IT, Step 2: Manager, Step 3: ACC)
  itApproved: boolean; // Step 1: Preparer / IT Specialist
  itApprovedBy?: string;
  itApprovedDate?: string;
  itSignature?: string;

  managerApproved: boolean; // Step 2: Department Manager
  managerApprovedBy?: string;
  managerApprovedDate?: string;
  managerSignature?: string;

  accApproved: boolean; // Step 3: Accounting Controller & Manager
  accApprovedBy?: string;
  accApprovedDate?: string;
  accSignature?: string;

  status: 'DRAFT' | 'PENDING_IT' | 'PENDING_MANAGER' | 'PENDING_ACC' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  
  // Logistics & Delivery Details
  deliveredBy?: string;
  deliveryDate?: string;
  vehiclePlateNo?: string;
  receiverSignDate?: string;
  receiverSignature?: string;
  
  notes?: string;
}

export interface FormAdjustmentConfig {
  // 1. Company & Header Customization
  companyNameTh: string;
  companyNameEn: string;
  companyChineseName: string;
  companyTaxId: string;
  phone: string;
  addressBkk: string;
  addressRayong: string;
  logoText: string;
  showLogo: boolean;
  showBranchAddress: boolean;
  
  // 2. Document Titles
  formTitleTh: string;
  formTitleEn: string;
  formNoPrefix: string;

  // 3. Layout, Margins & Zoom Scaling (A4 Fit)
  paperOrientation: 'LANDSCAPE' | 'PORTRAIT';
  pageScale: number; // 75% to 115%
  pagePaddingPreset: 'compact' | 'normal' | 'relaxed';
  fontSizePreset: 'compact' | 'normal' | 'large';
  tableRowDensity: 'tight' | 'normal' | 'spacious';
  tableMinRows: number; // e.g. 3, 4, 5

  // 4. Table Columns & Visibility
  showItemCode: boolean;
  showSerialNo: boolean;
  showTransferorStaffId: boolean;
  showReceiverStaffId: boolean;
  showReceiverLocation: boolean;
  
  colTitleNo: string;
  colTitleAssetId: string;
  colTitleItemCode: string;
  colTitleAssetName: string;
  colTitleQty: string;
  colTitleTransferorDept: string;
  colTitleTransferorName: string;
  colTitleReceiverDept: string;
  colTitleReceiverName: string;
  colTitleDestination: string;

  // 5. Signature Boxes (9 Boxes / 3-Step Approval Customization)
  signatureMode: '9_BOXES' | '3_BOXES';
  signatureBoxHeight: number; // in px (e.g. 75 - 120)
  signBoxOrder: string[]; // ['box1', 'box2', 'box3', 'box4', 'box5', 'box6', 'box7', 'box8', 'box9']
  
  // 9 Signature Boxes Definitions
  signBox1Title: string; // 1. ผู้ส่งมอบ / ผู้จัดทำ (Transferor)
  signBox1Subtitle: string;
  signBox2Title: string; // 2. ฝ่ายไอทีตรวจสอบ (IT Specialist - Digital Step 1)
  signBox2Subtitle: string;
  signBox3Title: string; // 3. ผู้จัดการฝ่ายต้นทาง (Transferor Dept Manager - Digital Step 2)
  signBox3Subtitle: string;
  signBox4Title: string; // 4. ผู้รับมอบทรัพย์สิน (Receiver)
  signBox4Subtitle: string;
  signBox5Title: string; // 5. ผู้จัดการฝ่ายปลายทาง (Receiver Dept Manager)
  signBox5Subtitle: string;
  signBox6Title: string; // 6. ฝ่ายบัญชีและการเงิน (ACC Accounting - Digital Step 3)
  signBox6Subtitle: string;
  signBox7Title: string; // 7. ฝ่ายคลังสินค้า / สโตร์พัสดุ (Warehouse / Store)
  signBox7Subtitle: string;
  signBox8Title: string; // 8. รปภ. / ตรวจสอบยานพาหนะ (Security & Gate Inspector)
  signBox8Subtitle: string;
  signBox9Title: string; // 9. ผู้มีอำนาจลงนาม / ผู้บริหาร (Executive / Internal Audit)
  signBox9Subtitle: string;

  // Legacy aliases
  step1Title: string;
  step1Subtitle: string;
  step2Title: string;
  step2Subtitle: string;
  step3Title: string;
  step3Subtitle: string;

  // 6. Remarks, Dispatch & Security Watermark
  importantRemarkText: string;
  showVehicleDispatch: boolean;
  showWatermark: boolean;
  watermarkText: string;
  footerNote: string;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_PARTS' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'HARDWARE_MALFUNCTION' | 'SOFTWARE_ISSUE' | 'NETWORK_WIFI' | 'ASSET_TRANSFER_REQUEST' | 'NEW_EQUIPMENT' | 'MAINTENANCE';

export interface ITTicket {
  id: string; // e.g. #XT-8492
  subject: string;
  details: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  requesterStaffId: string;
  requesterStaffName: string;
  requesterDept: string;
  requesterBranch: string;
  
  assignedToTechnician?: string;
  assignedTechnicianName?: string;
  
  assetId?: string; // Linked asset ID
  assetName?: string;
  
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  
  resolutionHours?: number;
  resolutionNote?: string;
  
  repairCost?: number;
  repairVendor?: string;
  repairSentDate?: string;
  repairReturnedDate?: string;
  
  historyLog: {
    timestamp: string;
    action: string;
    byUser: string;
  }[];
}

export interface TechnicianMetric {
  id: string;
  name: string;
  shortCode: string;
  efficiency: number; // percentage
  activeTickets: number;
  resolved3Months: number;
  avgResolutionHours: number;
  avatar?: string;
  staffId?: string;
  roleTitle?: string;
  title?: string;
  specialty?: string;
  grade?: 'A+' | 'A' | 'B' | 'C';
  slaOnTimeRate?: number;
  totalCostManaged?: number;
  rating?: number;
  avgResolutionTimeHours?: number;
}

export interface WeeklyProblemSummary {
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  totalIncidents: number;
  topIssues: {
    category: string;
    issueName: string;
    count: number;
    percentage: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    rootCause: string;
    preventiveAction: string;
  }[];
  hardwareCount: number;
  softwareCount: number;
  networkCount: number;
  resolvedRate: number;
}

export interface AppNotification {
  id: string;
  type: 'NEW_TICKET' | 'TICKET_STATUS' | 'TICKET_ASSIGNED' | 'TRANSFER_APPROVAL' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  ticketId?: string;
  transferId?: string;
  priority?: TicketPriority;
  requesterName?: string;
  department?: string;
}
