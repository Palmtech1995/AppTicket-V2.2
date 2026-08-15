/**
 * ============================================================================
 * [MODULE: EXCEL, PDF & QR EXPORT UTILITIES]
 * File: /src/utils/exportUtils.ts
 * Description: Client-side export engines for generating high-definition QR codes,
 *              formatted Excel (.xlsx) workbooks, and A4 PDF documents.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. generateQRCodeDataUrl: สร้าง QR Code คุณภาพสูง (Error Correction 'H')
 * 2. exportAssetsToExcel: ส่งออกรายการทรัพย์สินเป็น Excel พร้อมหัวคอลัมน์ 2 ภาษา
 * 3. exportTransferFormToExcel: ส่งออกใบโอนย้ายทรัพย์สิน A4 เป็น Excel
 * 4. exportTicketsToExcel: ส่งออกประวัติงานซ่อม Helpdesk และ SLA
 * 5. exportKPIReportToExcel: ส่งออกผลประเมิน KPI ช่างไอทีประจำเดือน
 * ============================================================================
 */

import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { Asset, ITTicket, TransferForm } from '../types';

/**
 * Generate QR Code data URL from any string (Asset ID, link, or JSON)
 */
export const generateQRCodeDataUrl = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 280,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR code generation failed', err);
    return '';
  }
};

/**
 * Export Assets to Excel (.xlsx)
 */
export const exportAssetsToExcel = (assets: Asset[], filename = 'XingTai_Asset_Inventory.xlsx') => {
  const data = assets.map((a, idx) => ({
    'ลำดับ (No.)': idx + 1,
    'รหัสทรัพย์สิน (Asset ID)': a.assetId,
    'รหัสสินค้า (Item Code)': a.itemCode,
    'Serial Number': a.serialNo,
    'ชื่อทรัพย์สิน / รายละเอียด (Asset Name)': a.assetName,
    'หมวดหมู่ (Category)': a.category,
    'ยี่ห้อ (Brand)': a.brand || '-',
    'รุ่น (Model)': a.model || '-',
    'สถานที่ตั้ง (Location)': a.location,
    'สาขา (Branch Code)': a.branchCode,
    'แผนก (Dept Code)': a.departmentCode,
    'ผู้ถือครองปัจจุบัน (Owner)': a.ownerStaffName || 'ส่วนกลาง/ว่าง',
    'สถานะ (Status)': a.status,
    'วันที่จัดซื้อ (Acquisition Date)': a.acquisitionDate,
    'ราคาต้นทุน (Cost THB)': a.cost,
    'ผู้จำหน่าย (Supplier)': a.supplier || '-',
    'วันหมดประกัน (Warranty Expire)': a.warrantyExpireDate || '-',
    'ประวัติการซ่อม (Repair Count)': a.repairLogs?.length || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ทรัพย์สินทั้งหมด_Sheet1');
  XLSX.writeFile(workbook, filename);
};

/**
 * Export Transfer Form to Excel (.xlsx)
 */
export const exportTransferFormToExcel = (transfer: TransferForm, filename?: string) => {
  const fileName = filename || `Transfer_Form_${transfer.formNo}.xlsx`;
  
  const headerInfo = [
    ['บริษัท ซิงไท่ เทรดดิ้ง จำกัด / XING TAI TRADING (THAILAND) CO., LTD.'],
    ['ใบโอนย้ายทรัพย์สิน / ใบส่งมอบ (Asset Transfer / Delivery Form)'],
    ['เลขที่เอกสาร (Form No):', transfer.formNo, 'วันที่ (Date):', transfer.createdDate],
    ['ต้นทาง (Originating From):', transfer.originatingDept, 'เหตุผล (Reason):', transfer.reasonType, transfer.reasonNote || ''],
    ['สถานะการอนุมัติ:', transfer.status],
    ['1. IT / Preparer Approved (Step 1):', transfer.itApproved ? `Approved by ${transfer.itApprovedBy || ''}` : 'Pending'],
    ['2. Manager Approved (Step 2):', transfer.managerApproved ? `Approved by ${transfer.managerApprovedBy || ''}` : 'Pending'],
    ['3. ACC Approved (Step 3):', transfer.accApproved ? `Approved by ${transfer.accApprovedBy || ''}` : 'Pending'],
    [],
  ];

  const itemHeaders = [
    'ลำดับ (No.)',
    'รหัสทรัพย์สิน (Asset ID)',
    'Item Code / S/N',
    'ชื่อทรัพย์สิน / รายละเอียด (Asset Name)',
    'จำนวน (Qty)',
    'แผนกผู้โอน (Transferor Dept)',
    'รหัสผู้โอน (Transferor ID)',
    'ชื่อผู้ส่งมอบ (Transferor Name)',
    'แผนกผู้รับ (Receiver Dept)',
    'รหัสผู้รับ (Receiver ID)',
    'ชื่อผู้รับมอบ (Receiver Name)',
    'สถานที่ปลายทาง (Location)',
  ];

  const itemRows = transfer.items.map((item) => [
    item.no,
    item.assetId,
    `${item.itemCode} / ${item.serialNo}`,
    item.assetName,
    item.qty,
    item.transferorDeptCode,
    item.transferorStaffId,
    item.transferorStaffName,
    item.receiverDeptCode,
    item.receiverStaffId,
    item.receiverStaffName,
    item.receiverLocation,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([...headerInfo, itemHeaders, ...itemRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Transfer_${transfer.formNo}`);
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export IT Tickets to Excel
 */
export const exportTicketsToExcel = (tickets: ITTicket[], filename = 'XingTai_IT_Tickets_Report.xlsx') => {
  const data = tickets.map((t) => ({
    'Ticket ID': t.id,
    'หัวข้อแจ้งซ่อม (Subject)': t.subject,
    'รายละเอียด (Details)': t.details,
    'หมวดหมู่ (Category)': t.category,
    'ความสำคัญ (Priority)': t.priority,
    'สถานะ (Status)': t.status,
    'ผู้แจ้ง (Requester)': t.requesterStaffName,
    'แผนกผู้แจ้ง (Dept)': t.requesterDept,
    'ช่างผู้รับผิดชอบ (Technician)': t.assignedTechnicianName || 'ยังไม่กำหนด',
    'รหัสทรัพย์สินที่เกี่ยวข้อง (Asset ID)': t.assetId || '-',
    'ชื่ออุปกรณ์ (Asset Name)': t.assetName || '-',
    'เวลาที่ใช้ซ่อม (ชั่วโมง)': t.resolutionHours || 0,
    'ค่าใช้จ่ายในการซ่อม (THB)': t.repairCost || 0,
    'ศูนย์บริการ/ร้านที่ส่งซ่อม (Vendor)': t.repairVendor || '-',
    'วันที่ส่งซ่อม': t.repairSentDate || '-',
    'วันที่ส่งคืน': t.repairReturnedDate || '-',
    'วันที่แจ้งเรื่อง (Created At)': t.createdAt,
    'วันที่แก้ไขเสร็จ (Resolved At)': t.resolvedAt || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IT_Tickets_Report');
  XLSX.writeFile(workbook, filename);
};

/**
 * Export Technician KPI Assessment & Weekly Problem Summaries to Excel
 */
export const exportKPIReportToExcel = (
  kpiData: any[],
  weeklyData: any[],
  filename = 'XingTai_IT_KPI_Assessment_Report.xlsx'
) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: KPI Summary per technician
  const kpiSheetData = kpiData.map((k, idx) => ({
    'ลำดับ': idx + 1,
    'รหัสช่าง': k.id,
    'ชื่อ-นามสกุล': k.name,
    'ตำแหน่ง': k.title,
    'ความเชี่ยวชาญ': k.specialty,
    'จำนวนงานทั้งหมด': k.assignedCount,
    'งานที่ปิดเสร็จสิ้น': k.resolvedCount,
    'อัตราการปิดงาน (%)': `${k.resRate}%`,
    'ความตรงต่อเวลา SLA (%)': `${k.slaRate}%`,
    'เวลาแก้ไขเฉลี่ย (ชั่วโมง)': k.avgResolutionTimeHours,
    'คะแนนความพึงพอใจ (CSAT)': k.rating,
    'งบประมาณค่าซ่อมที่ดูแล (THB)': k.techCost,
    'คะแนนรวม KPI (เต็ม 100)': k.kpiTotalScore,
    'ระดับการประเมิน (Grade)': k.kpiGrade,
  }));
  const kpiWorksheet = XLSX.utils.json_to_sheet(kpiSheetData);
  XLSX.utils.book_append_sheet(workbook, kpiWorksheet, 'สรุปผลงาน_KPI_รายคน');

  // Sheet 2: Weekly Problems Summary
  const weeklyFlatData: any[] = [];
  weeklyData.forEach((w) => {
    w.topIssues.forEach((issue: any) => {
      weeklyFlatData.push({
        'สัปดาห์ที่': `Week ${w.weekNumber}`,
        'ช่วงวันที่': w.dateRange,
        'หมวดหมู่อุปกรณ์/ระบบ': issue.category,
        'ปัญหาที่ตรวจพบ': issue.issueName,
        'จำนวนครั้งที่เกิด': issue.count,
        'สัดส่วนปัญหา (%)': `${issue.percentage}%`,
        'ระดับความรุนแรง (Severity)': issue.severity,
        'สาเหตุของปัญหา (Root Cause)': issue.rootCause,
        'แนวทางแก้ไขและป้องกัน (Preventive Action)': issue.preventiveAction,
      });
    });
  });
  const weeklyWorksheet = XLSX.utils.json_to_sheet(weeklyFlatData);
  XLSX.utils.book_append_sheet(workbook, weeklyWorksheet, 'สรุปปัญหาประจำสัปดาห์');

  XLSX.writeFile(workbook, filename);
};

/**
 * Export HTML element to PDF in Landscape A4 (Single page fit)
 */
export const exportElementToPdf = async (elementId: string, filename = 'document.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  try {
    const imgData = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    // A4 Landscape: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 297;
    const pdfHeight = 210;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(filename);
  } catch (err) {
    console.error('PDF Generation failed', err);
  }
};
