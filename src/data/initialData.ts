/**
 * ============================================================================
 * [SEED & MASTER DATA: XING TAI ENTERPRISE]
 * File: /src/data/initialData.ts
 * Description: Master corporate data, branches, departments, staff accounts,
 *              default form configs, and RBAC matrix.
 *              (Mockup transactional data removed - ready for real MySQL/Localhost)
 * 
 * [โครงสร้างข้อมูลหลัก]:
 * 1. COMPANY_INFO: ข้อมูลบริษัท ซิงไท่ เทรดดิ้ง จำกัด, เลขประจำตัวผู้เสียภาษี, ที่อยู่ 3 ภาษา
 * 2. INITIAL_BRANCHES: รหัสและข้อมูลสาขาหลัก (สำนักงานใหญ่ ซีคอนศรีนครินทร์, ระยอง, เชียงใหม่, ภูเก็ต)
 * 3. INITIAL_DEPARTMENTS: รหัสแผนก (XT018-IT, XT012-ACC, XT015-MKT, XT022-OPR, XT010-HR, XT001-MGT)
 * 4. INITIAL_STAFF: บัญชีผู้ใช้งานเริ่มต้น 5 บทบาท (ADMIN, IT, ACC, MANAGER, USER)
 * 5. INITIAL_ASSETS: ว่างเปล่า [] พร้อมรับข้อมูลจริงจาก MySQL / หน้าเว็บ
 * 6. INITIAL_TRANSFERS: ว่างเปล่า [] พร้อมรับการสร้างแบบฟอร์มโอนย้ายจริง
 * 7. INITIAL_TICKETS: ว่างเปล่า [] พร้อมรับใบแจ้งซ่อมจริง
 * 8. INITIAL_WEEKLY_PROBLEMS: ว่างเปล่า [] พร้อมรับบันทึกสรุปปัญหาจริง
 * 9. DEFAULT_ROLE_PERMISSIONS: สิทธิ์การเข้าถึงเมนูและฟีเจอร์ตามมาตรฐานความปลอดภัย
 * 10. DEFAULT_FORM_ADJUSTMENT: การกำหนดขนาดฟอนต์ ระยะขอบ และ 9 กล่องลายเซ็นของแบบฟอร์ม A4
 * ============================================================================
 */

import {
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

export const COMPANY_INFO = {
  nameTh: 'บริษัท ซิงไท่ เทรดดิ้ง จำกัด',
  nameEn: 'XING TAI TRADING (THAILAND) CO., LTD.',
  chineseName: '兴泰贸易 (泰国) 有限公司',
  taxId: '0105552097968',
  addressBkk: '942, 944, 946 ถนนศรีนครินทร์ แขวงพัฒนาการ เขตสวนหลวง กรุงเทพมหานคร 10250',
  addressEnBkk: '942, 944, 946 Srinakarin Road, Phatthanakan, Suan Luang, Bangkok 10250',
  addressRayong: '99/19 MOO 5 CHERNGNOEN SUB-DISTRICT, MUANG RAYONG DISTRICT, RAYONG 21000',
  phone: '02-2100942',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    code: 'TH100',
    name: 'สำนักงานใหญ่ ซีคอนสแควร์ ศรีนครินทร์ (Bangkok HQ)',
    address: '942, 944, 946 ถนนศรีนครินทร์ แขวงพัฒนาการ เขตสวนหลวง กรุงเทพฯ 10250',
    phone: '02-2100942',
    taxId: '0105552097968',
  },
  {
    code: 'RY001',
    name: 'สาขาระยอง (Rayong Logistic Hub)',
    address: '99/19 หมู่ 5 ต.เชิงเนิน อ.เมืองระยอง จ.ระยอง 21000',
    phone: '038-892100',
    taxId: '0105552097968',
  },
  {
    code: 'CNX002',
    name: 'สาขาเชียงใหม่ (Chiang Mai Branch)',
    address: '128/4 ถ.ซุปเปอร์ไฮเวย์ ต.ช้างเผือก อ.เมือง จ.เชียงใหม่ 50300',
    phone: '053-219400',
    taxId: '0105552097968',
  },
  {
    code: 'HKT003',
    name: 'สาขาภูเก็ต (Phuket Branch)',
    address: '55/12 ถ.เทพกระษัตรี ต.รัษฎา อ.เมือง จ.ภูเก็ต 83000',
    phone: '076-354120',
    taxId: '0105552097968',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { code: 'XT018-IT', name: 'ฝ่ายเทคโนโลยีสารสนเทศ (IT)', nameEn: 'Information Technology' },
  { code: 'XT012-ACC', name: 'ฝ่ายบัญชีและการเงิน (ACC)', nameEn: 'Accounting & Finance' },
  { code: 'XT015-MKT', name: 'ฝ่ายการตลาดและจัดจำหน่าย (MKT)', nameEn: 'Marketing & Distribution' },
  { code: 'XT022-OPR', name: 'ฝ่ายคลังสินค้าและโลจิสติกส์ (OPR)', nameEn: 'Logistics & Warehouse' },
  { code: 'XT010-HR', name: 'ฝ่ายทรัพยากรบุคคล (HR)', nameEn: 'Human Resources' },
  { code: 'XT001-MGT', name: 'ผู้บริหารระดับสูง (MGT)', nameEn: 'Executive Management' },
];

export const DEFAULT_ROLE_PERMISSIONS: SystemRolePermissions = {
  ADMIN: {
    canViewDashboard: true,
    canViewAssets: true,
    canCreateEditAsset: true,
    canDeleteAsset: true,
    canPrintQr: true,
    canViewTransfers: true,
    canCreateTransfer: true,
    canEditTransfer: true,
    canDeleteTransfer: true,
    canApproveIT: true,
    canApproveManager: true,
    canApproveACC: true,
    canViewTickets: true,
    canCreateTicket: true,
    canAssignTechnician: true,
    canResolveTicket: true,
    canViewAssetReports: true,
    canViewITReports: true,
    canManageBackend: true,
    canManageRoles: true,
  },
  IT: {
    canViewDashboard: true,
    canViewAssets: true,
    canCreateEditAsset: true,
    canDeleteAsset: false,
    canPrintQr: true,
    canViewTransfers: true,
    canCreateTransfer: true,
    canEditTransfer: true,
    canDeleteTransfer: false,
    canApproveIT: true,
    canApproveManager: false,
    canApproveACC: false,
    canViewTickets: true,
    canCreateTicket: true,
    canAssignTechnician: true,
    canResolveTicket: true,
    canViewAssetReports: true,
    canViewITReports: true,
    canManageBackend: false,
    canManageRoles: false,
  },
  MANAGER: {
    canViewDashboard: true,
    canViewAssets: true,
    canCreateEditAsset: false,
    canDeleteAsset: false,
    canPrintQr: true,
    canViewTransfers: true,
    canCreateTransfer: true,
    canEditTransfer: false,
    canDeleteTransfer: false,
    canApproveIT: false,
    canApproveManager: true,
    canApproveACC: false,
    canViewTickets: true,
    canCreateTicket: true,
    canAssignTechnician: false,
    canResolveTicket: false,
    canViewAssetReports: true,
    canViewITReports: true,
    canManageBackend: false,
    canManageRoles: false,
  },
  ACC: {
    canViewDashboard: true,
    canViewAssets: true,
    canCreateEditAsset: true,
    canDeleteAsset: false,
    canPrintQr: true,
    canViewTransfers: true,
    canCreateTransfer: true,
    canEditTransfer: true,
    canDeleteTransfer: false,
    canApproveIT: false,
    canApproveManager: false,
    canApproveACC: true,
    canViewTickets: true,
    canCreateTicket: true,
    canAssignTechnician: false,
    canResolveTicket: false,
    canViewAssetReports: true,
    canViewITReports: true,
    canManageBackend: false,
    canManageRoles: false,
  },
  USER: {
    canViewDashboard: false,
    canViewAssets: false,
    canCreateEditAsset: false,
    canDeleteAsset: false,
    canPrintQr: false,
    canViewTransfers: false,
    canCreateTransfer: false,
    canEditTransfer: false,
    canDeleteTransfer: false,
    canApproveIT: false,
    canApproveManager: false,
    canApproveACC: false,
    canViewTickets: true,
    canCreateTicket: true,
    canAssignTechnician: false,
    canResolveTicket: false,
    canViewAssetReports: false,
    canViewITReports: false,
    canManageBackend: false,
    canManageRoles: false,
  },
};

export const INITIAL_STAFF: UserProfile[] = [
  {
    id: 'u-admin',
    staffId: 'ADM-001',
    name: 'System Administrator',
    thaiName: 'ผู้ดูแลระบบสูงสุด',
    nickname: 'Admin',
    email: 'admin@xingtai.co.th',
    username: 'admin',
    password: 'Lemony2026',
    isFirstLogin: true,
    role: 'ADMIN',
    departmentCode: 'XT018-IT',
    departmentName: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    branchCode: 'TH100',
    branchName: 'สำนักงานใหญ่ ศรีนครินทร์',
  },
  {
    id: 'u-it-lead',
    staffId: 'IT-200101',
    name: 'J. Chen',
    thaiName: 'นายเจิน ชิน (เจสัน)',
    nickname: 'Jason',
    email: 'j.chen@xingtai.co.th',
    username: 'jchen',
    password: 'Lemony2026',
    isFirstLogin: true,
    role: 'IT',
    departmentCode: 'XT018-IT',
    departmentName: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    branchCode: 'TH100',
    branchName: 'สำนักงานใหญ่ ศรีนครินทร์',
  },
  {
    id: 'u-acc-mgr',
    staffId: 'ACC-150201',
    name: 'Wanna Sitthichok',
    thaiName: 'น.ส. วรรณา สิทธิโชค',
    nickname: 'วรรณ',
    email: 'wanna.s@xingtai.co.th',
    username: 'wanna.s',
    password: 'Lemony2026',
    isFirstLogin: true,
    role: 'ACC',
    departmentCode: 'XT012-ACC',
    departmentName: 'ฝ่ายบัญชีและการเงิน',
    branchCode: 'TH100',
    branchName: 'สำนักงานใหญ่ ศรีนครินทร์',
  },
  {
    id: 'u-mgr-1',
    staffId: 'MGR-180402',
    name: 'Thanawat Suwan',
    thaiName: 'นายธนวัฒน์ สุวรรณรัตน์',
    nickname: 'วัฒน์',
    email: 'thanawat.s@xingtai.co.th',
    username: 'thanawat.s',
    password: 'Lemony2026',
    isFirstLogin: true,
    role: 'MANAGER',
    departmentCode: 'XT015-MKT',
    departmentName: 'ฝ่ายการตลาดและจัดจำหน่าย',
    branchCode: 'TH100',
    branchName: 'สำนักงานใหญ่ ศรีนครินทร์',
  },
  {
    id: 'u-user-1',
    staffId: 'MKT-220405',
    name: 'Kanyapat Deesamer',
    thaiName: 'น.ส. กัญญาภัทร ดีเสมอ',
    nickname: 'นุช',
    email: 'kanyapat.d@xingtai.co.th',
    username: 'kanyapat.d',
    password: 'Lemony2026',
    isFirstLogin: true,
    role: 'USER',
    departmentCode: 'XT015-MKT',
    departmentName: 'ฝ่ายการตลาดและจัดจำหน่าย',
    branchCode: 'TH100',
    branchName: 'สำนักงานใหญ่ ศรีนครินทร์',
  },
];

// Empty for real database
export const INITIAL_TECHNICIANS: TechnicianMetric[] = [];

// Empty for real database
export const INITIAL_ASSETS: Asset[] = [];

// Empty for real database
export const INITIAL_TRANSFERS: TransferForm[] = [];

// Empty for real database
export const INITIAL_TICKETS: ITTicket[] = [];

// Empty for real database
export const INITIAL_WEEKLY_PROBLEMS: WeeklyProblemSummary[] = [];

export const DEFAULT_FORM_ADJUSTMENT: FormAdjustmentConfig = {
  // 1. Company & Header Customization
  companyNameTh: 'บริษัท ซิงไท่ เทรดดิ้ง จำกัด',
  companyNameEn: 'XING TAI TRADING (THAILAND) CO., LTD.',
  companyChineseName: '兴泰贸易 (泰国) 有限公司',
  companyTaxId: '0105552097968',
  phone: '02-2100942',
  addressBkk: '942, 944, 946 ถนนศรีนครินทร์ แขวงพัฒนาการ เขตสวนหลวง กรุงเทพมหานคร 10250',
  addressRayong: '99/19 MOO 5 CHERNGNOEN SUB-DISTRICT, MUANG RAYONG DISTRICT, RAYONG 21000',
  logoText: 'XING TAI',
  showLogo: true,
  showBranchAddress: true,

  // 2. Document Titles
  formTitleTh: 'ใบขอโอนย้ายทรัพย์สินอุปกรณ์คอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
  formTitleEn: 'IT & COMPUTER ASSET TRANSFER REQUISITION FORM',
  formNoPrefix: 'TF',

  // 3. Layout, Margins & Zoom Scaling (A4 Fit)
  paperOrientation: 'LANDSCAPE',
  pageScale: 98,
  pagePaddingPreset: 'normal',
  fontSizePreset: 'normal',
  tableRowDensity: 'normal',
  tableMinRows: 3,

  // 4. Table Columns & Visibility
  showItemCode: true,
  showSerialNo: true,
  showTransferorStaffId: true,
  showReceiverStaffId: true,
  showReceiverLocation: true,

  colTitleNo: 'ลำดับ (No.)',
  colTitleAssetId: 'รหัสทรัพย์สิน (Asset ID)',
  colTitleItemCode: 'Item Code / S/N',
  colTitleAssetName: 'รายการทรัพย์สินและรายละเอียด (Asset Description)',
  colTitleQty: 'จำนวน (Qty)',
  colTitleTransferorDept: 'แผนกต้นทาง (Origin Dept)',
  colTitleTransferorName: 'ผู้ส่งมอบ (Transferor)',
  colTitleReceiverDept: 'แผนกปลายทาง (Dest Dept)',
  colTitleReceiverName: 'ผู้รับมอบ (Receiver)',
  colTitleDestination: 'สถานที่ปลายทาง (Destination)',

  // 5. Signature Boxes (9 Boxes / 3-Step Approval Customization)
  signatureMode: '9_BOXES',
  signatureBoxHeight: 80,
  signBoxOrder: ['box1', 'box2', 'box3', 'box4', 'box5', 'box6', 'box7', 'box8', 'box9'],

  signBox1Title: '1. ผู้ส่งมอบ / ผู้จัดทำ (Transferor)',
  signBox1Subtitle: 'Asset Custodian Handover',
  signBox2Title: '2. ฝ่ายไอที / ตรวจสภาพ (IT Specialist)',
  signBox2Subtitle: 'IT Technical Inspection (Step 1)',
  signBox3Title: '3. ผจก.ฝ่ายต้นทาง (Originating Mgr)',
  signBox3Subtitle: 'Department Endorsement (Step 2)',
  signBox4Title: '4. ผู้รับมอบทรัพย์สิน (Receiver)',
  signBox4Subtitle: 'Physical Custody Receipt',
  signBox5Title: '5. ผจก.ฝ่ายปลายทาง (Receiver Mgr)',
  signBox5Subtitle: 'Receiving Dept Acknowledgment',
  signBox6Title: '6. ฝ่ายบัญชี/การเงิน (ACC Final)',
  signBox6Subtitle: 'Asset Register & ACC Approval (Step 3)',
  signBox7Title: '7. ฝ่ายสโตร์/คลังพัสดุ (Store Keeper)',
  signBox7Subtitle: 'Warehouse Outflow Check',
  signBox8Title: '8. เจ้าหน้าที่ รปภ. (Security Gate)',
  signBox8Subtitle: 'Vehicle & Exit Gate Pass Check',
  signBox9Title: '9. ผู้มีอำนาจลงนาม (Executive/Audit)',
  signBox9Subtitle: 'Governance & Compliance Verification',

  step1Title: '2. ฝ่ายไอที / ตรวจสอบ (IT Specialist)',
  step1Subtitle: 'IT Technical Verification',
  step2Title: '3. ผู้จัดการฝ่าย (Manager Approval)',
  step2Subtitle: 'Department Endorsement',
  step3Title: '6. ฝ่ายบัญชีและการเงิน (ACC Approval)',
  step3Subtitle: 'Asset Register & ACC Final',

  // 6. Remarks, Dispatch & Security Watermark
  importantRemarkText: 'การนำทรัพย์สินบริษัทฯออก จะต้องกรอกรายละเอียดให้ครบทุกช่อง และมีลายเซ็นผู้เกี่ยวข้องทุกคนถึงจะสามารถนำออกได้',
  showVehicleDispatch: true,
  showWatermark: false,
  watermarkText: 'XING TAI TRADING - OFFICIAL ASSET TRANSFER',
  footerNote: 'บริษัท ซิงไท่ เทรดดิ้ง จำกัด • Xing Tai Trading (Thailand) Co., Ltd.',
};
