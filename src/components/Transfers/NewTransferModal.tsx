/**
 * ============================================================================
 * [MODULE: NEW TRANSFER TICKET BUILDER]
 * File: /src/components/Transfers/NewTransferModal.tsx
 * Description: Multi-item asset transfer wizard with automatic item population,
 *              branch/department selection, and inline master data creation helpers.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Multi-Item Grid: เพิ่มหลายรายการอุปกรณ์ในใบโอนย้ายใบเดียว
 * 2. Auto-Fill Asset Details: ดึงข้อมูล Serial No, ผู้ถือครองเดิม และสังกัดอัตโนมัติ
 * 3. Inline Master Data Creators: ป๊อปอัปเพิ่มพนักงาน, สาขา หรือแผนกใหม่ได้ทันทีจากฟอร์ม
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Boxes,
  ArrowRight,
  FileCheck,
  User,
  Building,
  Edit3,
  UserPlus,
  FolderPlus,
  Building2,
  Laptop,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Asset, Branch, Department, TransferForm, TransferItem, UserProfile } from '../../types';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transfer: TransferForm) => void;
  assets: Asset[];
  branches: Branch[];
  departments: Department[];
  staffList: UserProfile[];
  initialSelectedAsset?: Asset | null;
  editingTransfer?: TransferForm | null;
  onAddNewAsset?: (asset: Asset) => void;
  onAddNewStaff?: (staff: UserProfile) => void;
  onAddNewDepartment?: (dept: Department) => void;
  onAddNewBranch?: (branch: Branch) => void;
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assets,
  branches,
  departments,
  staffList,
  initialSelectedAsset,
  editingTransfer,
  onAddNewAsset,
  onAddNewStaff,
  onAddNewDepartment,
  onAddNewBranch,
}) => {
  const [formNo, setFormNo] = useState(`TF${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(100 + Math.random() * 900))}`);
  const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0]);
  const [originatingBranchCode, setOriginatingBranchCode] = useState('TH100');
  const [reasonType, setReasonType] = useState<TransferForm['reasonType']>('RESIGNATION');
  const [reasonNote, setReasonNote] = useState('พนักงานลาออก / 员工离职');
  const [deliveredBy, setDeliveredBy] = useState('นายคเชนทร์ ทรัพย์เจริญ');
  const [vehiclePlateNo, setVehiclePlateNo] = useState('9กข-4421 กทม.');

  // Quick Add Sub-modals state
  const [quickAssetModalOpen, setQuickAssetModalOpen] = useState(false);
  const [quickAssetTargetIndex, setQuickAssetTargetIndex] = useState<number>(0);

  const [quickStaffModalOpen, setQuickStaffModalOpen] = useState(false);
  const [quickStaffTarget, setQuickStaffTarget] = useState<{ index: number; field: 'transferor' | 'receiver' }>({
    index: 0,
    field: 'receiver',
  });

  const [quickDeptModalOpen, setQuickDeptModalOpen] = useState(false);
  const [quickDeptTargetIndex, setQuickDeptTargetIndex] = useState<number>(0);

  const [quickBranchModalOpen, setQuickBranchModalOpen] = useState(false);

  // Quick Add Asset Form State
  const [qaAssetId, setQaAssetId] = useState('');
  const [qaItemCode, setQaItemCode] = useState('');
  const [qaSerialNo, setQaSerialNo] = useState('');
  const [qaAssetName, setQaAssetName] = useState('');
  const [qaCategory, setQaCategory] = useState('คอมพิวเตอร์ & ไอที');
  const [qaBrand, setQaBrand] = useState('Dell');
  const [qaModel, setQaModel] = useState('');
  const [qaCost, setQaCost] = useState(25000);
  const [qaBranchCode, setQaBranchCode] = useState('TH100');
  const [qaDepartmentCode, setQaDepartmentCode] = useState('XT018-IT');
  const [qaOwnerStaffId, setQaOwnerStaffId] = useState('IT-250801');
  const [qaLocation, setQaLocation] = useState('สำนักงานใหญ่ ศรีนครินทร์ ชั้น 3');

  // Quick Add Staff Form State
  const [qsStaffId, setQsStaffId] = useState('');
  const [qsThaiName, setQsThaiName] = useState('');
  const [qsName, setQsName] = useState('');
  const [qsNickname, setQsNickname] = useState('');
  const [qsDeptCode, setQsDeptCode] = useState('XT018-IT');
  const [qsBranchCode, setQsBranchCode] = useState('TH100');
  const [qsRole, setQsRole] = useState<UserProfile['role']>('USER');
  const [qsEmail, setQsEmail] = useState('');

  // Quick Add Department Form State
  const [qdCode, setQdCode] = useState('');
  const [qdName, setQdName] = useState('');
  const [qdNameEn, setQdNameEn] = useState('');

  // Quick Add Branch Form State
  const [qbCode, setQbCode] = useState('');
  const [qbName, setQbName] = useState('');
  const [qbAddress, setQbAddress] = useState('');
  const [qbPhone, setQbPhone] = useState('02-0000000');

  // Items to transfer
  const [items, setItems] = useState<Array<{
    assetSystemId: string;
    assetId: string;
    itemCode: string;
    serialNo: string;
    assetName: string;
    qty: number;
    transferorStaffId: string;
    receiverStaffId: string;
    receiverDeptCode: string;
    receiverLocation: string;
  }>>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransfer) {
      setFormNo(editingTransfer.formNo);
      setCreatedDate(editingTransfer.createdDate);
      setOriginatingBranchCode(editingTransfer.originatingBranchCode);
      setReasonType(editingTransfer.reasonType);
      setReasonNote(editingTransfer.reasonNote);
      setDeliveredBy(editingTransfer.deliveredBy || '');
      setVehiclePlateNo(editingTransfer.vehiclePlateNo || '');
      setItems(
        editingTransfer.items.map((i) => ({
          assetSystemId: i.assetSystemId,
          assetId: i.assetId,
          itemCode: i.itemCode,
          serialNo: i.serialNo,
          assetName: i.assetName,
          qty: i.qty,
          transferorStaffId: i.transferorStaffId,
          receiverStaffId: i.receiverStaffId,
          receiverDeptCode: i.receiverDeptCode,
          receiverLocation: i.receiverLocation,
        }))
      );
    } else {
      setFormNo(`TF${new Date().getFullYear() % 100}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(100 + Math.random() * 900))}`);
      setCreatedDate(new Date().toISOString().split('T')[0]);
      setOriginatingBranchCode('TH100');
      setReasonType('RESIGNATION');
      setReasonNote('พนักงานลาออก / 员工离职');
      setDeliveredBy('นายคเชนทร์ ทรัพย์เจริญ');
      setVehiclePlateNo('9กข-4421 กทม.');

      if (initialSelectedAsset) {
        setItems([{
          assetSystemId: initialSelectedAsset.id,
          assetId: initialSelectedAsset.assetId,
          itemCode: initialSelectedAsset.itemCode,
          serialNo: initialSelectedAsset.serialNo || '',
          assetName: initialSelectedAsset.assetName,
          qty: 1,
          transferorStaffId: initialSelectedAsset.ownerStaffId || 'IT-250801',
          receiverStaffId: 'IT-260802',
          receiverDeptCode: 'XT018-IT',
          receiverLocation: 'ซีคอนสแควร์ ชั้น 4 โซน B',
        }]);
      } else {
        const defaultAst = assets[0];
        setItems(defaultAst ? [{
          assetSystemId: defaultAst.id,
          assetId: defaultAst.assetId,
          itemCode: defaultAst.itemCode,
          serialNo: defaultAst.serialNo || '',
          assetName: defaultAst.assetName,
          qty: 1,
          transferorStaffId: defaultAst.ownerStaffId || 'IT-250801',
          receiverStaffId: 'IT-260802',
          receiverDeptCode: 'XT018-IT',
          receiverLocation: 'สำนักงานใหญ่ ศรีนครินทร์ ชั้น 3',
        }] : []);
      }
    }
  }, [isOpen, editingTransfer, initialSelectedAsset, assets]);

  if (!isOpen) return null;

  const handleOpenQuickAsset = (itemIndex: number) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setQaAssetId(`3-300-${randomNum}`);
    setQaItemCode(`XT-IT-HW-26-${Math.floor(1000 + Math.random() * 9000)}`);
    setQaSerialNo(`SN-${Date.now().toString().slice(-6)}`);
    setQaAssetName('');
    setQaCategory('คอมพิวเตอร์ & ไอที');
    setQaBrand('Dell');
    setQaModel('Latitude 5440');
    setQaCost(28500);
    setQaBranchCode(originatingBranchCode || 'TH100');
    setQaDepartmentCode('XT018-IT');
    setQaOwnerStaffId(staffList[0]?.staffId || 'IT-250801');
    setQaLocation('สำนักงานใหญ่ ศรีนครินทร์ ชั้น 3');
    setQuickAssetTargetIndex(itemIndex);
    setQuickAssetModalOpen(true);
  };

  const handleSaveQuickAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaAssetName.trim()) {
      alert('กรุณาระบุชื่อทรัพย์สิน');
      return;
    }

    const ownerStaff = staffList.find((s) => s.staffId === qaOwnerStaffId);
    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      assetId: qaAssetId || `3-300-${Math.floor(100000 + Math.random() * 900000)}`,
      itemCode: qaItemCode || `XT-HW-${Date.now()}`,
      serialNo: qaSerialNo || '-',
      assetName: qaAssetName,
      category: qaCategory,
      brand: qaBrand,
      model: qaModel,
      cost: Number(qaCost) || 0,
      location: qaLocation || 'สำนักงานใหญ่',
      branchCode: qaBranchCode,
      departmentCode: qaDepartmentCode,
      ownerStaffId: qaOwnerStaffId,
      ownerStaffName: ownerStaff ? ownerStaff.thaiName || ownerStaff.name : 'ส่วนกลาง/ว่าง',
      status: 'ACTIVE',
      acquisitionDate: new Date().toISOString().split('T')[0],
      repairLogs: [],
      custodyHistory: [
        {
          id: `cst-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          toStaffId: qaOwnerStaffId,
          toStaffName: ownerStaff ? ownerStaff.thaiName || ownerStaff.name : 'พนักงาน',
          toDeptCode: qaDepartmentCode,
          location: qaLocation,
          reason: 'ขึ้นทะเบียนทรัพย์สินใหม่',
        },
      ],
    };

    if (onAddNewAsset) {
      onAddNewAsset(newAsset);
    }

    // Auto-select this newly created asset for current row
    setItems((prev) => {
      const next = [...prev];
      if (next[quickAssetTargetIndex]) {
        next[quickAssetTargetIndex] = {
          ...next[quickAssetTargetIndex],
          assetSystemId: newAsset.id,
          assetId: newAsset.assetId,
          itemCode: newAsset.itemCode,
          serialNo: newAsset.serialNo,
          assetName: newAsset.assetName,
          transferorStaffId: newAsset.ownerStaffId || 'IT-250801',
        };
      }
      return next;
    });

    setQuickAssetModalOpen(false);
  };

  const handleOpenQuickStaff = (itemIndex: number, field: 'transferor' | 'receiver') => {
    const randomStaffNo = Math.floor(1000 + Math.random() * 9000);
    setQsStaffId(`XT-26${randomStaffNo}`);
    setQsThaiName('');
    setQsName('');
    setQsNickname('');
    setQsDeptCode('XT018-IT');
    setQsBranchCode(originatingBranchCode || 'TH100');
    setQsRole('USER');
    setQsEmail(`staff${randomStaffNo}@xingtai.co.th`);
    setQuickStaffTarget({ index: itemIndex, field });
    setQuickStaffModalOpen(true);
  };

  const handleSaveQuickStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qsThaiName.trim() && !qsName.trim()) {
      alert('กรุณาระบุชื่อพนักงาน');
      return;
    }

    const dept = departments.find((d) => d.code === qsDeptCode);
    const branch = branches.find((b) => b.code === qsBranchCode);

    const newStaff: UserProfile = {
      id: `u-${Date.now()}`,
      staffId: qsStaffId || `XT-${Date.now()}`,
      thaiName: qsThaiName || qsName,
      name: qsName || qsThaiName,
      nickname: qsNickname,
      departmentCode: qsDeptCode,
      departmentName: dept?.name || 'ฝ่ายเทคโนโลยีสารสนเทศ',
      branchCode: qsBranchCode,
      branchName: branch?.name || 'สำนักงานใหญ่ ศรีนครินทร์',
      role: qsRole,
      email: qsEmail || `${qsStaffId}@xingtai.co.th`,
    };

    if (onAddNewStaff) {
      onAddNewStaff(newStaff);
    }

    // Auto-select this newly created staff
    setItems((prev) => {
      const next = [...prev];
      if (next[quickStaffTarget.index]) {
        if (quickStaffTarget.field === 'transferor') {
          next[quickStaffTarget.index].transferorStaffId = newStaff.staffId;
        } else {
          next[quickStaffTarget.index].receiverStaffId = newStaff.staffId;
          next[quickStaffTarget.index].receiverDeptCode = newStaff.departmentCode;
        }
      }
      return next;
    });

    setQuickStaffModalOpen(false);
  };

  const handleOpenQuickDept = (itemIndex: number) => {
    setQdCode(`XT0${departments.length + 10}-DEPT`);
    setQdName('');
    setQdNameEn('');
    setQuickDeptTargetIndex(itemIndex);
    setQuickDeptModalOpen(true);
  };

  const handleSaveQuickDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qdCode.trim() || !qdName.trim()) {
      alert('กรุณาระบุรหัสแผนกและชื่อแผนก');
      return;
    }

    const newDept: Department = {
      code: qdCode.trim().toUpperCase(),
      name: qdName.trim(),
      nameEn: qdNameEn.trim() || qdName.trim(),
    };

    if (onAddNewDepartment) {
      onAddNewDepartment(newDept);
    }

    setItems((prev) => {
      const next = [...prev];
      if (next[quickDeptTargetIndex]) {
        next[quickDeptTargetIndex].receiverDeptCode = newDept.code;
      }
      return next;
    });

    setQuickDeptModalOpen(false);
  };

  const handleOpenQuickBranch = () => {
    setQbCode(`BR${branches.length + 100}`);
    setQbName('');
    setQbAddress('กรุงเทพมหานคร');
    setQbPhone('02-2100942');
    setQuickBranchModalOpen(true);
  };

  const handleSaveQuickBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qbCode.trim() || !qbName.trim()) {
      alert('กรุณาระบุรหัสสาขาและชื่อสาขา');
      return;
    }

    const newBranch: Branch = {
      code: qbCode.trim().toUpperCase(),
      name: qbName.trim(),
      address: qbAddress.trim() || 'ประเทศไทย',
      phone: qbPhone.trim(),
      taxId: '0105552097968',
    };

    if (onAddNewBranch) {
      onAddNewBranch(newBranch);
    }

    setOriginatingBranchCode(newBranch.code);
    setQuickBranchModalOpen(false);
  };

  const handleAddItem = () => {
    const defaultAst = assets.find((a) => !items.some((i) => i.assetSystemId === a.id)) || assets[0];
    if (!defaultAst) {
      handleOpenQuickAsset(items.length);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        assetSystemId: defaultAst.id,
        assetId: defaultAst.assetId,
        itemCode: defaultAst.itemCode,
        serialNo: defaultAst.serialNo || '',
        assetName: defaultAst.assetName,
        qty: 1,
        transferorStaffId: defaultAst.ownerStaffId || 'IT-250801',
        receiverStaffId: 'IT-260802',
        receiverDeptCode: 'XT018-IT',
        receiverLocation: 'สำนักงานใหญ่ ศรีนครินทร์ ชั้น 3',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectAssetForItem = (index: number, assetIdVal: string) => {
    if (assetIdVal === '__NEW_ASSET__') {
      handleOpenQuickAsset(index);
      return;
    }

    const found = assets.find((a) => a.id === assetIdVal || a.assetId === assetIdVal);
    if (!found) return;

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        assetSystemId: found.id,
        assetId: found.assetId,
        itemCode: found.itemCode,
        serialNo: found.serialNo || '',
        assetName: found.assetName,
        transferorStaffId: found.ownerStaffId || 'IT-250801',
      };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการเพื่อทำใบส่งมอบ');
      return;
    }

    const branchObj = branches.find((b) => b.code === originatingBranchCode);

    const formattedItems: TransferItem[] = items.map((item, idx) => {
      const tStaff = staffList.find((s) => s.staffId === item.transferorStaffId);
      const rStaff = staffList.find((s) => s.staffId === item.receiverStaffId);

      return {
        no: idx + 1,
        assetSystemId: item.assetSystemId,
        assetId: item.assetId,
        itemCode: item.itemCode,
        serialNo: item.serialNo,
        assetName: item.assetName,
        qty: item.qty,
        transferorDeptCode: tStaff?.departmentCode || 'XT018-IT',
        transferorStaffId: item.transferorStaffId,
        transferorStaffName: tStaff ? tStaff.thaiName || tStaff.name : 'ผู้ส่งมอบ',
        receiverDeptCode: item.receiverDeptCode,
        receiverStaffId: item.receiverStaffId,
        receiverStaffName: rStaff ? rStaff.thaiName || rStaff.name : 'ผู้รับมอบ',
        receiverLocation: item.receiverLocation,
      };
    });

    const transferResult: TransferForm = {
      id: editingTransfer ? editingTransfer.id : `tf-${Date.now()}`,
      formNo,
      createdDate,
      originatingBranch: branchObj?.name || 'สำนักงานใหญ่ ศรีนครินทร์',
      originatingBranchCode,
      originatingDept: `${originatingBranchCode} : ${branchObj?.name || 'สำนักงานใหญ่'}`,
      reasonType,
      reasonNote,
      items: formattedItems,
      managerApproved: editingTransfer ? editingTransfer.managerApproved : false,
      managerApprovedBy: editingTransfer?.managerApprovedBy,
      managerApprovedDate: editingTransfer?.managerApprovedDate,
      managerSignature: editingTransfer?.managerSignature,
      itApproved: editingTransfer ? editingTransfer.itApproved : false,
      itApprovedBy: editingTransfer?.itApprovedBy,
      itApprovedDate: editingTransfer?.itApprovedDate,
      itSignature: editingTransfer?.itSignature,
      accApproved: editingTransfer ? editingTransfer.accApproved : false,
      accApprovedBy: editingTransfer?.accApprovedBy,
      accApprovedDate: editingTransfer?.accApprovedDate,
      accSignature: editingTransfer?.accSignature,
      status: editingTransfer ? editingTransfer.status : 'PENDING_IT',
      deliveredBy,
      deliveryDate: createdDate,
      vehiclePlateNo,
    };

    onSave(transferResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12141c] border border-zinc-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-[#161824] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              {editingTransfer ? <Edit3 className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingTransfer ? `แก้ไขใบส่งมอบ / โอนย้ายทรัพย์สิน (${editingTransfer.formNo})` : 'สร้างใบส่งมอบ / โอนย้ายทรัพย์สินใหม่'}
              </h2>
              <p className="text-xs text-zinc-400">
                {editingTransfer
                  ? 'แก้ไขรายละเอียดข้อมูลสาขา สาเหตุ ข้อมูลการขนส่ง และรายการทรัพย์สินที่โอนย้าย'
                  : 'ดึงข้อมูลทรัพย์สินและผู้ครอบครองจากระบบอัตโนมัติ หรือกดเพิ่มข้อมูลใหม่ลงระบบได้ทันที'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#161822] p-4 rounded-xl border border-zinc-800">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">เลขที่เอกสาร (Form No.) *</label>
              <input
                type="text"
                required
                value={formNo}
                onChange={(e) => setFormNo(e.target.value)}
                className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-xs font-mono font-bold text-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">วันที่สร้างเอกสาร *</label>
              <input
                type="date"
                required
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-400">สาขาต้นทาง *</label>
                <button
                  type="button"
                  onClick={handleOpenQuickBranch}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>เพิ่มสาขา</span>
                </button>
              </div>
              <select
                value={originatingBranchCode}
                onChange={(e) => {
                  if (e.target.value === '__NEW_BRANCH__') {
                    handleOpenQuickBranch();
                  } else {
                    setOriginatingBranchCode(e.target.value);
                  }
                }}
                className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200"
              >
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
                <option value="__NEW_BRANCH__" className="text-cyan-400 font-bold">
                  + [ + เพิ่มสาขาใหม่ลงฐานข้อมูล... ]
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">สาเหตุการโอนย้าย *</label>
              <select
                value={reasonType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setReasonType(val);
                  if (val === 'RESIGNATION') setReasonNote('พนักงานลาออก / 员工离职');
                  else if (val === 'NEW_EMPLOYEE') setReasonNote('พนักงานเข้าใหม่ / 新员工入职');
                  else if (val === 'DEPARTMENT_CHANGE') setReasonNote('ย้ายแผนก / 部门调动');
                  else if (val === 'MAINTENANCE_SEND') setReasonNote('ส่งซ่อมบำรุง / 维修');
                  else setReasonNote('โอนย้ายทรัพย์สิน / 资产交接');
                }}
                className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200"
              >
                <option value="RESIGNATION">พนักงานลาออก (Resignation)</option>
                <option value="NEW_EMPLOYEE">พนักงานเข้าใหม่ (New Hire)</option>
                <option value="DEPARTMENT_CHANGE">ย้ายแผนก/สาขา (Internal Transfer)</option>
                <option value="MAINTENANCE_SEND">ส่งซ่อมบำรุง (Maintenance)</option>
                <option value="OTHER">อื่นๆ (Other)</option>
              </select>
            </div>
          </div>

          {/* Delivery & Vehicle info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#161822] p-4 rounded-xl border border-zinc-800 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">ชื่อผู้นำส่ง / คนขับรถขนส่ง</label>
              <input
                type="text"
                value={deliveredBy}
                onChange={(e) => setDeliveredBy(e.target.value)}
                placeholder="เช่น นายคเชนทร์ ทรัพย์เจริญ"
                className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">หมายเลขทะเบียนรถขนส่ง</label>
              <input
                type="text"
                value={vehiclePlateNo}
                onChange={(e) => setVehiclePlateNo(e.target.value)}
                placeholder="เช่น 9กข-4421 กทม."
                className="w-full bg-[#11131a] border border-zinc-700 rounded-lg p-2 text-zinc-200"
              />
            </div>
          </div>

          {/* Items Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>รายการทรัพย์สินที่ต้องการส่งมอบ ({items.length} รายการ)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-cyan-800/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มทรัพย์สินในใบส่งมอบ</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#161822] p-4 rounded-xl border border-zinc-800 space-y-3 relative"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      รายการที่ #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรายการนี้</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    {/* Select Asset */}
                    <div className="sm:col-span-6">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-zinc-400">เลือกทรัพย์สินจากฐานข้อมูล *</label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAsset(index)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 hover:underline font-semibold"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ เพิ่มทรัพย์สินใหม่</span>
                        </button>
                      </div>
                      <select
                        value={item.assetSystemId}
                        onChange={(e) => handleSelectAssetForItem(index, e.target.value)}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200"
                      >
                        {assets.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{a.assetId}] - {a.itemCode} - {a.assetName.substring(0, 45)}...
                          </option>
                        ))}
                        <option value="__NEW_ASSET__" className="text-cyan-400 font-bold">
                          + [ + เพิ่มทรัพย์สินใหม่ลงฐานข้อมูล... ]
                        </option>
                      </select>
                    </div>

                    {/* Transferor Staff */}
                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-zinc-400">ผู้ส่งมอบ (Transferor) *</label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickStaff(index, 'transferor')}
                          className="text-[10px] text-zinc-400 hover:text-cyan-400 flex items-center gap-0.5 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>เพิ่มพนักงาน</span>
                        </button>
                      </div>
                      <select
                        value={item.transferorStaffId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__NEW_STAFF__') {
                            handleOpenQuickStaff(index, 'transferor');
                          } else {
                            setItems((prev) => {
                              const n = [...prev];
                              n[index].transferorStaffId = val;
                              return n;
                            });
                          }
                        }}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200"
                      >
                        {staffList.map((s) => (
                          <option key={s.id} value={s.staffId}>
                            {s.thaiName || s.name} ({s.staffId})
                          </option>
                        ))}
                        <option value="__NEW_STAFF__" className="text-cyan-400 font-bold">
                          + [ + เพิ่มพนักงานใหม่... ]
                        </option>
                      </select>
                    </div>

                    {/* Receiver Staff */}
                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-cyan-400 font-bold">ผู้รับมอบใหม่ (Receiver) *</label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickStaff(index, 'receiver')}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 hover:underline font-bold"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>เพิ่มพนักงาน</span>
                        </button>
                      </div>
                      <select
                        value={item.receiverStaffId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__NEW_STAFF__') {
                            handleOpenQuickStaff(index, 'receiver');
                          } else {
                            setItems((prev) => {
                              const n = [...prev];
                              n[index].receiverStaffId = val;
                              return n;
                            });
                          }
                        }}
                        className="w-full bg-[#11131a] border border-cyan-800 rounded p-2 text-cyan-200 font-bold"
                      >
                        {staffList.map((s) => (
                          <option key={s.id} value={s.staffId}>
                            {s.thaiName || s.name} ({s.staffId})
                          </option>
                        ))}
                        <option value="__NEW_STAFF__" className="text-cyan-400 font-bold">
                          + [ + เพิ่มพนักงานใหม่... ]
                        </option>
                      </select>
                    </div>

                    {/* Destination Department & Location */}
                    <div className="sm:col-span-6">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-zinc-400">แผนกปลายทาง (Receiver Dept)</label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickDept(index)}
                          className="text-[10px] text-zinc-400 hover:text-cyan-400 flex items-center gap-0.5 hover:underline"
                        >
                          <FolderPlus className="w-3 h-3" />
                          <span>เพิ่มแผนก</span>
                        </button>
                      </div>
                      <select
                        value={item.receiverDeptCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__NEW_DEPT__') {
                            handleOpenQuickDept(index);
                          } else {
                            setItems((prev) => {
                              const n = [...prev];
                              n[index].receiverDeptCode = val;
                              return n;
                            });
                          }
                        }}
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200"
                      >
                        {departments.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.code} : {d.name}
                          </option>
                        ))}
                        <option value="__NEW_DEPT__" className="text-cyan-400 font-bold">
                          + [ + เพิ่มแผนกใหม่ลงฐานข้อมูล... ]
                        </option>
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-zinc-400 block mb-1">สถานที่ปลายทาง (Destination Location) *</label>
                      <input
                        type="text"
                        required
                        value={item.receiverLocation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) => {
                            const n = [...prev];
                            n[index].receiverLocation = val;
                            return n;
                          });
                        }}
                        placeholder="เช่น ซีคอนสแควร์ ชั้น 4 โซน B หรือ คลังสินค้าระยอง"
                        className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              {editingTransfer ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไขข้อมูล</span>
                </>
              ) : (
                <span>สร้างเอกสาร & ส่งขออนุมัติ 3 ฝ่าย</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ======================= 1. Quick Add Asset Sub-Modal ======================= */}
      {quickAssetModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181a24] border border-cyan-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-zinc-200">
            <div className="p-4 bg-[#141620] border-b border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Laptop className="w-4 h-4" />
                <span>เพิ่มทรัพย์สินใหม่เข้าสู่ฐานข้อมูลระบบ</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickAssetModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAsset} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">รหัสทรัพย์สิน (Asset ID) *</label>
                  <input
                    type="text"
                    required
                    value={qaAssetId}
                    onChange={(e) => setQaAssetId(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-cyan-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">รหัสสินค้า / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={qaItemCode}
                    onChange={(e) => setQaItemCode(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Serial Number (S/N)</label>
                  <input
                    type="text"
                    value={qaSerialNo}
                    onChange={(e) => setQaSerialNo(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">หมวดหมู่ทรัพย์สิน</label>
                  <select
                    value={qaCategory}
                    onChange={(e) => setQaCategory(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  >
                    <option value="คอมพิวเตอร์ & ไอที">คอมพิวเตอร์ & ไอที (IT Equipment)</option>
                    <option value="อุปกรณ์บาร์โค้ด & สแกนเนอร์">อุปกรณ์บาร์โค้ด & สแกนเนอร์ (Handheld)</option>
                    <option value="เครื่องพิมพ์ & เน็ตเวิร์ก">เครื่องพิมพ์ & เน็ตเวิร์ก (Printer & Network)</option>
                    <option value="อุปกรณ์สำนักงาน">อุปกรณ์สำนักงาน (Office Supply)</option>
                    <option value="ยานพาหนะ">ยานพาหนะ (Vehicle)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">ชื่อทรัพย์สิน / รายละเอียดสเปก *</label>
                <input
                  type="text"
                  required
                  value={qaAssetName}
                  onChange={(e) => setQaAssetName(e.target.value)}
                  placeholder="เช่น โน้ตบุ๊ก Dell Latitude 5440 Core i7 RAM 16GB"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">ยี่ห้อ (Brand)</label>
                  <input
                    type="text"
                    value={qaBrand}
                    onChange={(e) => setQaBrand(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">รุ่น (Model)</label>
                  <input
                    type="text"
                    value={qaModel}
                    onChange={(e) => setQaModel(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">ราคาต้นทุน (THB)</label>
                  <input
                    type="number"
                    value={qaCost}
                    onChange={(e) => setQaCost(Number(e.target.value))}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">สาขาที่จัดเก็บ</label>
                  <select
                    value={qaBranchCode}
                    onChange={(e) => setQaBranchCode(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  >
                    {branches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">แผนก</label>
                  <select
                    value={qaDepartmentCode}
                    onChange={(e) => setQaDepartmentCode(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">ผู้ครอบครองปัจจุบัน</label>
                  <select
                    value={qaOwnerStaffId}
                    onChange={(e) => setQaOwnerStaffId(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.staffId}>
                        {s.thaiName || s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuickAssetModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกทรัพย์สิน & เลือกทันที</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= 2. Quick Add Staff Sub-Modal ======================= */}
      {quickStaffModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181a24] border border-cyan-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-zinc-200">
            <div className="p-4 bg-[#141620] border-b border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <UserPlus className="w-4 h-4" />
                <span>
                  เพิ่มข้อมูลพนักงานใหม่ ({quickStaffTarget.field === 'transferor' ? 'ผู้ส่งมอบ' : 'ผู้รับมอบ'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuickStaffModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickStaff} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">รหัสพนักงาน (Staff ID) *</label>
                  <input
                    type="text"
                    required
                    value={qsStaffId}
                    onChange={(e) => setQsStaffId(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-cyan-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">ชื่อเล่น (Nickname)</label>
                  <input
                    type="text"
                    value={qsNickname}
                    onChange={(e) => setQsNickname(e.target.value)}
                    placeholder="เช่น เต้, ปาล์ม, นิว"
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">ชื่อ-นามสกุล (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={qsThaiName}
                  onChange={(e) => setQsThaiName(e.target.value)}
                  placeholder="เช่น นายพชร ชุ่มแจ่ม"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">ชื่อภาษาอังกฤษ (English Name)</label>
                <input
                  type="text"
                  value={qsName}
                  onChange={(e) => setQsName(e.target.value)}
                  placeholder="e.g. Pachara Chumjam"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">สังกัดแผนก</label>
                  <select
                    value={qsDeptCode}
                    onChange={(e) => setQsDeptCode(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">ประจำสาขา</label>
                  <select
                    value={qsBranchCode}
                    onChange={(e) => setQsBranchCode(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  >
                    {branches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">บทบาทสิทธิ์ (Role)</label>
                  <select
                    value={qsRole}
                    onChange={(e) => setQsRole(e.target.value as any)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                  >
                    <option value="USER">พนักงานทั่วไป (USER)</option>
                    <option value="IT">เจ้าหน้าที่ไอที (IT)</option>
                    <option value="MANAGER">ผู้จัดการแผนก (MANAGER)</option>
                    <option value="ACC">ฝ่ายบัญชีทรัพย์สิน (ACC)</option>
                    <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={qsEmail}
                    onChange={(e) => setQsEmail(e.target.value)}
                    className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuickStaffModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกพนักงาน & เลือกทันที</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= 3. Quick Add Department Sub-Modal ======================= */}
      {quickDeptModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181a24] border border-cyan-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-200">
            <div className="p-4 bg-[#141620] border-b border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <FolderPlus className="w-4 h-4" />
                <span>เพิ่มแผนกใหม่เข้าสู่ฐานข้อมูล</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickDeptModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickDept} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">รหัสแผนก (Department Code) *</label>
                <input
                  type="text"
                  required
                  value={qdCode}
                  onChange={(e) => setQdCode(e.target.value)}
                  placeholder="เช่น XT025-SALES"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-cyan-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">ชื่อแผนกภาษาไทย *</label>
                <input
                  type="text"
                  required
                  value={qdName}
                  onChange={(e) => setQdName(e.target.value)}
                  placeholder="เช่น ฝ่ายพัฒนาธุรกิจและการขาย (SALES)"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">ชื่อแผนกภาษาอังกฤษ (English Name)</label>
                <input
                  type="text"
                  value={qdNameEn}
                  onChange={(e) => setQdNameEn(e.target.value)}
                  placeholder="e.g. Sales & Business Development"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuickDeptModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกแผนก & เลือกทันที</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= 4. Quick Add Branch Sub-Modal ======================= */}
      {quickBranchModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181a24] border border-cyan-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-200">
            <div className="p-4 bg-[#141620] border-b border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Building2 className="w-4 h-4" />
                <span>เพิ่มสาขาใหม่เข้าสู่ฐานข้อมูล</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickBranchModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickBranch} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">รหัสสาขา (Branch Code) *</label>
                <input
                  type="text"
                  required
                  value={qbCode}
                  onChange={(e) => setQbCode(e.target.value)}
                  placeholder="เช่น KKC004"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2 text-cyan-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">ชื่อสาขา *</label>
                <input
                  type="text"
                  required
                  value={qbName}
                  onChange={(e) => setQbName(e.target.value)}
                  placeholder="เช่น สาขาขอนแก่น (Khon Kaen Hub)"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">ที่อยู่สาขา</label>
                <input
                  type="text"
                  value={qbAddress}
                  onChange={(e) => setQbAddress(e.target.value)}
                  placeholder="เช่น ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">เบอร์โทรศัพท์สาขา</label>
                <input
                  type="text"
                  value={qbPhone}
                  onChange={(e) => setQbPhone(e.target.value)}
                  placeholder="043-xxxxxx"
                  className="w-full bg-[#11131a] border border-zinc-700 rounded p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuickBranchModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกสาขา & เลือกทันที</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

