/**
 * ============================================================================
 * [MODULE: 9-BOX SIGNATURE CONFIGURATION ENGINE]
 * File: /src/utils/signatureBoxes.ts
 * Description: Definitions, role mappings, and ordering mechanics for the 9
 *              signature boxes in the A4 Transfer Document.
 * 
 * [กล่องลายเซ็น 9 กล่อง]:
 * 1. box1: ผู้ส่งมอบ / ผู้จัดทำ (Transferor)
 * 2. box2: ฝ่ายไอที / ผู้จัดทำเอกสาร (Step 1: IT Specialist Approval)
 * 3. box3: ผจก.ฝ่ายต้นทาง (Step 2: Transferor Dept Manager Approval)
 * 4. box4: ฝ่ายบัญชีและการเงิน (Step 3: Accounting Controller Approval)
 * 5. box5: ผู้รับมอบอุปกรณ์ (Receiver)
 * 6. box6: ผจก.ฝ่ายปลายทาง (Receiver Dept Manager)
 * 7. box7: เจ้าหน้าที่รักษาความปลอดภัย (Security / Gate Pass)
 * 8. box8: ผู้มีอำนาจลงนาม / กรรมการผู้จัดการ (Managing Director)
 * 9. box9: เจ้าหน้าที่ตรวจสอบทรัพย์สิน (Asset Auditor)
 * ============================================================================
 */

import { FormAdjustmentConfig, TransferForm } from '../types';

export interface SignatureBoxDef {
  id: string; // 'box1' through 'box9'
  code: string;
  defaultTitleKey: keyof FormAdjustmentConfig;
  defaultSubtitleKey: keyof FormAdjustmentConfig;
  defaultTitle: string;
  defaultSubtitle: string;
  isDigitalApproval: boolean;
  stepNumber?: number;
  stepRole?: 'IT' | 'MANAGER' | 'ACC';
}

export const SIGNATURE_BOX_DEFINITIONS: Record<string, SignatureBoxDef> = {
  box1: {
    id: 'box1',
    code: 'TRANSFEROR',
    defaultTitleKey: 'signBox1Title',
    defaultSubtitleKey: 'signBox1Subtitle',
    defaultTitle: '1. ผู้ส่งมอบ / ผู้จัดทำ (Transferor)',
    defaultSubtitle: 'ผู้จัดทำรายการโอนย้าย',
    isDigitalApproval: false,
  },
  box2: {
    id: 'box2',
    code: 'IT_APPROVAL',
    defaultTitleKey: 'signBox2Title',
    defaultSubtitleKey: 'signBox2Subtitle',
    defaultTitle: '2. ฝ่ายไอที / ตรวจสอบ (IT Specialist)',
    defaultSubtitle: 'ตรวจสอบทางเทคนิค (IT Technical Verification)',
    isDigitalApproval: true,
    stepNumber: 1,
    stepRole: 'IT',
  },
  box3: {
    id: 'box3',
    code: 'MGR_APPROVAL',
    defaultTitleKey: 'signBox3Title',
    defaultSubtitleKey: 'signBox3Subtitle',
    defaultTitle: '3. ผจก.ฝ่ายต้นทาง (Transferor Mgr)',
    defaultSubtitle: 'อนุมัติการโอนย้าย (Department Endorsement)',
    isDigitalApproval: true,
    stepNumber: 2,
    stepRole: 'MANAGER',
  },
  box4: {
    id: 'box4',
    code: 'RECEIVER',
    defaultTitleKey: 'signBox4Title',
    defaultSubtitleKey: 'signBox4Subtitle',
    defaultTitle: '4. ผู้รับมอบ (Receiver)',
    defaultSubtitle: 'ผู้รับมอบทรัพย์สินปลายทาง',
    isDigitalApproval: false,
  },
  box5: {
    id: 'box5',
    code: 'RECEIVER_MGR',
    defaultTitleKey: 'signBox5Title',
    defaultSubtitleKey: 'signBox5Subtitle',
    defaultTitle: '5. ผจก.ฝ่ายปลายทาง (Receiver Mgr)',
    defaultSubtitle: 'รับทราบการรับเข้าทรัพย์สิน',
    isDigitalApproval: false,
  },
  box6: {
    id: 'box6',
    code: 'ACC_APPROVAL',
    defaultTitleKey: 'signBox6Title',
    defaultSubtitleKey: 'signBox6Subtitle',
    defaultTitle: '6. ฝ่ายบัญชี/การเงิน (ACC Final)',
    defaultSubtitle: 'ตรวจสอบและบันทึกบัญชี (Asset Accounting Approval)',
    isDigitalApproval: true,
    stepNumber: 3,
    stepRole: 'ACC',
  },
  box7: {
    id: 'box7',
    code: 'STORE_KEEPER',
    defaultTitleKey: 'signBox7Title',
    defaultSubtitleKey: 'signBox7Subtitle',
    defaultTitle: '7. สโตร์/คลังพัสดุ (Store Keeper)',
    defaultSubtitle: 'ตัดจ่าย/รับเข้าพัสดุ',
    isDigitalApproval: false,
  },
  box8: {
    id: 'box8',
    code: 'SECURITY_GATE',
    defaultTitleKey: 'signBox8Title',
    defaultSubtitleKey: 'signBox8Subtitle',
    defaultTitle: '8. รปภ./ประตูทางออก (Security Gate)',
    defaultSubtitle: 'ตรวจสอบของและยานพาหนะ',
    isDigitalApproval: false,
  },
  box9: {
    id: 'box9',
    code: 'EXECUTIVE_AUDIT',
    defaultTitleKey: 'signBox9Title',
    defaultSubtitleKey: 'signBox9Subtitle',
    defaultTitle: '9. ผู้บริหาร/ผู้ตรวจสอบ (Executive/Audit)',
    defaultSubtitle: 'ผู้มีอำนาจกำกับดูแลสูงสุด',
    isDigitalApproval: false,
  },
};

export const DEFAULT_BOX_ORDER = ['box1', 'box2', 'box3', 'box4', 'box5', 'box6', 'box7', 'box8', 'box9'];

export const getNormalizedBoxOrder = (order?: string[]): string[] => {
  if (!order || !Array.isArray(order) || order.length === 0) {
    return [...DEFAULT_BOX_ORDER];
  }
  const validBoxes = order.filter((id) => SIGNATURE_BOX_DEFINITIONS[id]);
  const missingBoxes = DEFAULT_BOX_ORDER.filter((id) => !validBoxes.includes(id));
  return [...validBoxes, ...missingBoxes];
};
