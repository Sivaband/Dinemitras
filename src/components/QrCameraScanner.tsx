/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { RestaurantTable, Branch, Restaurant } from '../types';

interface QrCameraScannerProps {
  tables: RestaurantTable[];
  branches: Branch[];
  restaurants: Restaurant[];
  onScanComplete: (restaurantId: string, branchId: string, tableId: string) => void;
  onClose: () => void;
}

export default function QrCameraScanner({
  tables,
  branches,
  restaurants,
  onScanComplete,
  onClose,
}: QrCameraScannerProps) {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [successData, setSuccessData] = useState<{
    restaurant: string;
    branch: string;
    table: string;
  } | null>(null);

  const qrRegionId = 'qr-camera-stream-reader';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Initialize and get cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setScannerError('No camera devices found. Ensure camera access is allowed.');
        }
      })
      .catch((err) => {
        console.error('Error fetching cameras:', err);
        setScannerError('Camera permission denied or camera list could not be retrieved.');
      });

    return () => {
      // Ensure scanner is stopped on unmount
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    try {
      setScannerError(null);
      setSuccessData(null);
      
      // Stop any existing instance
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      // Create new instance
      const scanner = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = scanner;

      setIsScanning(true);
      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        (errorMessage) => {
          // Verbose error logging can be noisy, so we do nothing here
        }
      );
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      setScannerError('Failed to initiate camera stream. Try reloading or selecting another camera.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  // Start scanning when camera is selected
  useEffect(() => {
    if (selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId]);

  // QR Code Parsing Logic
  const handleDecodedText = (text: string) => {
    console.log('Scanned text raw:', text);
    let restaurantId = '';
    let branchId = '';
    let tableId = '';

    // Formats supported:
    // 1. JSON string: {"restaurantId": "...", "branchId": "...", "tableId": "..."}
    try {
      const parsed = JSON.parse(text);
      restaurantId = parsed.restaurantId || parsed.restaurant_id || '';
      branchId = parsed.branchId || parsed.branch_id || '';
      tableId = parsed.tableId || parsed.table_id || '';
    } catch (e) {
      // Not a JSON string
    }

    // 2. URL parameters: http://.../?restaurantId=rest_1&branchId=branch_1a&tableId=table_1_2
    if (!tableId && (text.startsWith('http://') || text.startsWith('https://'))) {
      try {
        const url = new URL(text);
        restaurantId = url.searchParams.get('restaurantId') || url.searchParams.get('restaurant_id') || url.searchParams.get('r') || '';
        branchId = url.searchParams.get('branchId') || url.searchParams.get('branch_id') || url.searchParams.get('b') || '';
        tableId = url.searchParams.get('tableId') || url.searchParams.get('table_id') || url.searchParams.get('t') || '';

        // If path segment format, e.g. /scan/rest_1/branch_1a/table_1_2
        if (!tableId) {
          const segments = url.pathname.split('/').filter(Boolean);
          // e.g. ["scan", "rest_1", "branch_1a", "table_1_2"]
          if (segments.length >= 3) {
            const index = segments.indexOf('scan');
            if (index !== -1 && segments[index + 3]) {
              restaurantId = segments[index + 1];
              branchId = segments[index + 2];
              tableId = segments[index + 3];
            } else if (segments.length === 3) {
              restaurantId = segments[0];
              branchId = segments[1];
              tableId = segments[2];
            }
          }
        }
      } catch (urlErr) {
        // Not a valid URL
      }
    }

    // 3. Comma/Semicolon/Pipe CSV format: rest_1,branch_1a,table_1_2
    if (!tableId) {
      const separators = [',', ';', '|'];
      for (const sep of separators) {
        const parts = text.split(sep).map((p) => p.trim());
        if (parts.length === 3) {
          restaurantId = parts[0];
          branchId = parts[1];
          tableId = parts[2];
          break;
        }
      }
    }

    // 4. Fallback lookup: If only tableId is identified, resolve branchId and restaurantId
    // Or if the scanned text is exactly an existing table ID
    if (!tableId) {
      const matchedTable = tables.find(
        (t) => t.id === text.trim() || t.tableNumber === text.trim()
      );
      if (matchedTable) {
        tableId = matchedTable.id;
        branchId = matchedTable.branchId;
        restaurantId = matchedTable.restaurantId;
      }
    } else {
      // If we found a tableId, confirm it exists and fill missing branchId or restaurantId
      const matchedTable = tables.find((t) => t.id === tableId || t.tableNumber === tableId);
      if (matchedTable) {
        tableId = matchedTable.id;
        if (!branchId) branchId = matchedTable.branchId;
        if (!restaurantId) restaurantId = matchedTable.restaurantId;
      }
    }

    // Validate if resolved info exists in our state
    const finalTable = tables.find((t) => t.id === tableId);
    const finalBranch = branches.find((b) => b.id === branchId);
    const finalRest = restaurants.find((r) => r.id === restaurantId);

    if (finalTable && finalBranch && finalRest) {
      // Success! Stop camera and show confirmation
      stopScanner();
      setSuccessData({
        restaurant: finalRest.name,
        branch: finalBranch.name,
        table: `Table ${finalTable.tableNumber}`,
      });

      // Brief delay to let the user see the success screen before completing
      setTimeout(() => {
        onScanComplete(finalRest.id, finalBranch.id, finalTable.id);
      }, 1500);
    } else {
      // Invalid format or non-existent table/branch references
      console.warn('QR Code scan failed validation. Unrecognized ids:', { restaurantId, branchId, tableId });
      setScannerError(`Recognized: "${text}", but it doesn't match any registered restaurant table.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0d] text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-white">Live Camera QR Scanner</h3>
            <p className="text-[10px] text-slate-400">Scan table QR codes via camera</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Camera Selection Dropdown */}
      {cameras.length > 1 && !successData && (
        <div className="mb-3.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Choose Camera Source
          </label>
          <div className="relative">
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full bg-[#151724] border border-slate-800 hover:border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer transition-all appearance-none pr-8"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
          </div>
        </div>
      )}

      {/* Main Scanner Window */}
      <div className="flex-1 min-h-[220px] max-h-[320px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 relative flex flex-col items-center justify-center">
        {/* Scanned Success screen */}
        {successData && (
          <div className="absolute inset-0 bg-[#0c0d12]/95 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="bg-emerald-500/15 text-emerald-400 p-4 rounded-full border border-emerald-500/30 mb-3 animate-scale-up">
              <CheckCircle className="w-10 h-10" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
              QR Code Identified
            </span>
            <h4 className="text-base font-extrabold text-white mt-1">{successData.restaurant}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{successData.branch}</p>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1 rounded-full font-bold mt-3 font-mono">
              {successData.table}
            </span>
          </div>
        )}

        {/* Live scanner container */}
        <div
          id={qrRegionId}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            successData ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Laser scanner effect */}
        {isScanning && !successData && (
          <div className="absolute inset-x-0 top-1/4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#fbbf24] animate-bounce z-10 pointer-events-none" />
        )}

        {/* No active stream or error indicator */}
        {!isScanning && !successData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#090a0f]/90 text-slate-400">
            <Camera className="w-8 h-8 text-slate-600 mb-2" />
            <span className="text-xs font-semibold">Camera scanner inactive</span>
            <button
              onClick={() => selectedCameraId && startScanner(selectedCameraId)}
              className="mt-3 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Start Camera
            </button>
          </div>
        )}
      </div>

      {/* Error or Hint Drawer */}
      {scannerError && (
        <div className="mt-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex gap-2 items-start text-xs leading-normal">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <p className="flex-1">{scannerError}</p>
        </div>
      )}

      {/* Helpful Hint */}
      {!successData && !scannerError && (
        <div className="mt-4 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex gap-2 items-start text-[11px] text-slate-400 leading-normal">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-bold text-slate-300 block">How to use QR Camera Scanner:</span>
            <span>Point your webcam/mobile device camera at any QR code. You can scan the table QR code shown on printed flyers, other simulator screens, or any text string of:</span>
            <code className="block bg-slate-950 p-1 rounded font-mono text-[9px] text-amber-300 mt-1">
              restaurantId,branchId,tableId
            </code>
            <span>e.g., <code className="font-mono text-slate-300 text-[9px]">rest_1,branch_1a,table_1_2</code></span>
          </div>
        </div>
      )}
    </div>
  );
}
