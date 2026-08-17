/**
 * ============================================================================
 * [MODULE: QR STICKER & ASSET TAG PRINTER]
 * File: /src/components/Assets/QRLabelPrintModal.tsx
 * Description: Batch QR barcode sticker generator with print CSS layout
 *              optimized for 50x30mm or standard sticker paper.
 * 
 * [ฟังก์ชันหลัก]:
 * 1. Bulk QR Generation: แปลงข้อมูล Asset ID, Item Code, Serial No เป็น QR Data URL
 * 2. Multi-Select Checkboxes: เลือกเฉพาะรายการทรัพย์สินที่ต้องการพิมพ์สติกเกอร์
 * 3. Print Layout Grid: จัดวางเป็นตารางสติกเกอร์พร้อมตราสัญลักษณ์บริษัท ซิงไท่ฯ
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { X, Printer, QrCode, Download, CheckSquare, Square } from 'lucide-react';
import { Asset } from '../../types';
import { generateQRCodeDataUrl } from '../../utils/exportUtils';
import { printElementDirectly } from '../../utils/printUtils';

interface QRLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
}

export const QRLabelPrintModal: React.FC<QRLabelPrintModalProps> = ({
  isOpen,
  onClose,
  assets,
}) => {
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && assets.length > 0) {
      setSelectedAssetIds(assets.slice(0, 12).map((a) => a.id));
      
      // Generate QR codes for all assets
      const newMap: Record<string, string> = {};
      Promise.all(
        assets.map(async (a) => {
          const payload = JSON.stringify({
            assetId: a.assetId,
            code: a.itemCode,
            sn: a.serialNo,
            co: 'XING TAI',
          });
          const url = await generateQRCodeDataUrl(payload);
          newMap[a.id] = url;
        })
      ).then(() => {
        setQrMap(newMap);
      });
    }
  }, [isOpen, assets]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedAssetIds.length === assets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(assets.map((a) => a.id));
    }
  };

  const handlePrint = () => {
    printElementDirectly('qr-labels-printable-container', {
      orientation: 'portrait',
      docTitle: 'Asset_QR_Labels',
    });
  };

  const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12141c] border border-zinc-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-[#161824] flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">พิมพ์ป้าย QR Code ติดทรัพย์สิน (Print Asset QR Tags)</h2>
              <p className="text-[11px] text-zinc-400">เลือกรายการทรัพย์สินที่ต้องการพิมพ์สติกเกอร์</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700"
            >
              {selectedAssetIds.length === assets.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              <span>เลือกทั้งหมด ({assets.length})</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ป้ายสติกเกอร์ (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Content Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-900">
          <div className="text-xs text-zinc-400 mb-4 no-print flex items-center justify-between">
            <span>ตัวอย่างป้ายสติกเกอร์ (เลือก {selectedAssets.length} รายการ):</span>
            <span className="text-[11px] font-mono">Layout: Standard Grid 2-Column Stickers</span>
          </div>

          <div
            id="qr-labels-printable-container"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white rounded-xl"
          >
            {assets
              .filter((a) => selectedAssetIds.includes(a.id))
              .map((asset) => {
                const isSelected = selectedAssetIds.includes(asset.id);
                const qrUrl = qrMap[asset.id];

              return (
                <div
                  key={asset.id}
                  onClick={() => toggleSelect(asset.id)}
                  className={`bg-white text-zinc-900 rounded-xl p-3.5 border-2 relative cursor-pointer select-none transition-all shadow-sm flex gap-3 items-center ${
                    isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-zinc-300 opacity-60'
                  }`}
                >
                  {/* QR Image */}
                  <div className="w-20 h-20 shrink-0 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-center p-1">
                    {qrUrl ? (
                      <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className="w-12 h-12 text-zinc-400 animate-spin" />
                    )}
                  </div>

                  {/* Label Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider truncate">
                      XING TAI TRADING CO., LTD.
                    </div>
                    <div className="text-xs font-mono font-extrabold text-blue-900 tracking-tight truncate">
                      {asset.assetId}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-zinc-800 truncate">
                      {asset.itemCode}
                    </div>
                    <div className="text-[10px] text-zinc-600 line-clamp-1 font-medium">
                      {asset.assetName}
                    </div>
                    {asset.serialNo && (
                      <div className="text-[9px] font-mono text-zinc-500 truncate">
                        S/N: {asset.serialNo}
                      </div>
                    )}
                  </div>

                  {/* Checkmark indicator */}
                  <div className="absolute top-2 right-2 no-print">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded bg-cyan-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-zinc-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
