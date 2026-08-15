/**
 * ============================================================================
 * [MODULE: ASSET CREATE & EDIT MODAL]
 * File: /src/components/Assets/AssetFormModal.tsx
 * Description: Modal form for registering new hardware assets or updating
 *              existing serial numbers, specifications, warranty, and branches.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Intelligent ID Generation: สุ่มรหัส Asset ID และ Item Code อัตโนมัติเมื่อสร้างใหม่
 * 2. Dynamic Dropdowns: เชื่อมต่อรายชื่อพนักงาน, สาขา และแผนกของบริษัท ซิงไท่ฯ
 * 3. Warranty & Cost Tracking: บันทึกต้นทุนและวันหมดอายุการรับประกัน
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Boxes, Building, User, DollarSign, Calendar } from 'lucide-react';
import { Asset, AssetStatus, Branch, Department, UserProfile } from '../../types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => void;
  initialAsset?: Asset | null;
  branches: Branch[];
  departments: Department[];
  staffList: UserProfile[];
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAsset,
  branches,
  departments,
  staffList,
}) => {
  const [assetId, setAssetId] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Laptop / Notebook');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [branchCode, setBranchCode] = useState('TH100');
  const [departmentCode, setDepartmentCode] = useState('XT018-IT');
  const [ownerStaffId, setOwnerStaffId] = useState('');
  const [status, setStatus] = useState<AssetStatus>('ACTIVE');
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [warrantyExpireDate, setWarrantyExpireDate] = useState('2027-12-31');

  useEffect(() => {
    if (initialAsset) {
      setAssetId(initialAsset.assetId);
      setItemCode(initialAsset.itemCode);
      setSerialNo(initialAsset.serialNo || '');
      setAssetName(initialAsset.assetName);
      setCategory(initialAsset.category);
      setBrand(initialAsset.brand || '');
      setModel(initialAsset.model || '');
      setLocation(initialAsset.location);
      setBranchCode(initialAsset.branchCode);
      setDepartmentCode(initialAsset.departmentCode);
      setOwnerStaffId(initialAsset.ownerStaffId || '');
      setStatus(initialAsset.status);
      setAcquisitionDate(initialAsset.acquisitionDate);
      setCost(initialAsset.cost);
      setSupplier(initialAsset.supplier || '');
      setWarrantyExpireDate(initialAsset.warrantyExpireDate || '');
    } else {
      // Auto-generate random new Asset ID format: 3-XXX-XXXXXX
      const rand1 = Math.floor(100 + Math.random() * 900);
      const rand2 = Math.floor(100000 + Math.random() * 900000);
      setAssetId(`3-${rand1}-${rand2}`);
      setItemCode(`XT-IT-${Math.floor(100 + Math.random() * 900)}`);
      setSerialNo('');
      setAssetName('');
      setCategory('Laptop / Notebook');
      setBrand('');
      setModel('');
      setLocation('สำนักงานใหญ่ ศรีนครินทร์ ชั้น 3');
      setBranchCode('TH100');
      setDepartmentCode('XT018-IT');
      setOwnerStaffId('');
      setStatus('ACTIVE');
      setAcquisitionDate(new Date().toISOString().split('T')[0]);
      setCost(15000);
      setSupplier('Synnex Thailand PCL');
      setWarrantyExpireDate('2027-12-31');
    }
  }, [initialAsset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !itemCode || !assetName) return;

    const ownerStaff = staffList.find((s) => s.staffId === ownerStaffId || s.id === ownerStaffId);

    onSave({
      ...(initialAsset ? { id: initialAsset.id } : {}),
      assetId,
      itemCode,
      serialNo,
      assetName,
      category,
      brand,
      model,
      location,
      branchCode,
      departmentCode,
      ownerStaffId: ownerStaff ? ownerStaff.staffId : undefined,
      ownerStaffName: ownerStaff ? `${ownerStaff.thaiName || ownerStaff.name}` : undefined,
      status,
      acquisitionDate,
      cost: Number(cost) || 0,
      supplier,
      warrantyExpireDate,
      repairLogs: initialAsset?.repairLogs || [],
      custodyHistory: initialAsset?.custodyHistory || [
        {
          id: `cst-init-${Date.now()}`,
          date: acquisitionDate,
          toStaffId: ownerStaff ? ownerStaff.staffId : 'XT-CENTRAL',
          toStaffName: ownerStaff ? ownerStaff.thaiName || ownerStaff.name : 'คลังกลาง',
          toDeptCode: departmentCode,
          location,
          reason: 'บันทึกทรัพย์สินเข้าระบบครั้งแรก',
          approvedBy: 'Admin Controller',
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12141a] border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-[#161822] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialAsset ? 'แก้ไขข้อมูลทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่ (New Asset Registration)'}
              </h2>
              <p className="text-xs text-zinc-400">
                บริษัท ซิงไท่ เทรดดิ้ง จำกัด / Xing Tai Trading Co., Ltd.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">รหัสทรัพย์สิน (Asset ID) *</label>
              <input
                type="text"
                required
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-cyan-400 font-mono font-bold"
                placeholder="เช่น 3-300-680031"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">รหัสสินค้า (Item Code) *</label>
              <input
                type="text"
                required
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 font-mono"
                placeholder="เช่น XT-IT-HW-23-0105"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Serial Number (S/N)</label>
              <input
                type="text"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 font-mono"
                placeholder="เช่น 01602537007234"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              ชื่อทรัพย์สิน และ สเปกการใช้งาน (Asset Name & Description) *
            </label>
            <textarea
              required
              rows={2}
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100"
              placeholder="เช่น Handheld เครื่องสแกนบาร์โค้ดพกพาสินค้า Urovo DT50S, Qualcomm, Android 11..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">หมวดหมู่ทรัพย์สิน</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              >
                <option value="Laptop / Notebook">Laptop / Notebook</option>
                <option value="Desktop PC / All-in-One">Desktop PC / All-in-One</option>
                <option value="Handheld Barcode Scanner / Terminal">Handheld Scanner / Urovo</option>
                <option value="Audio & Media Equipment">Audio & Media (DJI Mic / Camera)</option>
                <option value="Office Furniture">Office Furniture (โต๊ะ / เก้าอี้)</option>
                <option value="Industrial Label Printer">Industrial Printer (Zebra)</option>
                <option value="Network Infrastructure">Network (Cisco / Router / Switch)</option>
                <option value="Monitor / Display">Monitor / จอแสดงผล</option>
                <option value="Other Asset">Other Equipment (อื่นๆ)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">ยี่ห้อ (Brand)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="เช่น Urovo, Lenovo, DJI, Herman Miller"
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">รุ่น (Model)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="เช่น DT50S, X1 Carbon, Aeron"
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">สาขาที่ตั้ง (Branch)</label>
              <select
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              >
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">แผนกผู้ดูแล (Department)</label>
              <select
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">ผู้ครอบครองปัจจุบัน (Owner)</label>
              <select
                value={ownerStaffId}
                onChange={(e) => setOwnerStaffId(e.target.value)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              >
                <option value="">-- ส่วนกลาง / ว่าง (Unassigned) --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.staffId}>
                    {s.thaiName || s.name} ({s.staffId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">ตำแหน่งที่วาง (Location Details)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น ซีคอนสแควร์ ชั้น 4 โซน B"
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">ราคาทุน (THB)</label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">สถานะทรัพย์สิน</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full bg-[#171922] border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200"
              >
                <option value="ACTIVE">ACTIVE (พร้อมใช้งาน)</option>
                <option value="MAINTENANCE">MAINTENANCE (ซ่อมบำรุง)</option>
                <option value="TRANSFERRED">TRANSFERRED (ส่งมอบ/โอนย้าย)</option>
                <option value="RETIRED">RETIRED (ตัดจำหน่าย)</option>
              </select>
            </div>
          </div>

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
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
            >
              {initialAsset ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มทรัพย์สิน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
