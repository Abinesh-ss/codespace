'use client';

import React, { useState } from 'react';
// Changed to a default import to fix your "CameraScanner is not exported from" warning
import CameraScanner from './CameraScanner'; 

interface QRAnchorScannerProps {
  onAnchorCalibrated?: (anchorData: { nodeId: string; x: number; y: number; name: string }) => void;
  onClose?: () => void;
  // Added to fix the "Type error: Property 'onDetect' does not exist" build error
  onDetect?: (data: any) => void | Promise<void>; 
}

export const QRAnchorScanner: React.FC<QRAnchorScannerProps> = ({ 
  onAnchorCalibrated, 
  onClose,
  onDetect 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleScanSuccess = async (scannedText: string) => {
    if (processing) return;
    setProcessing(true);
    setError(null);

    try {
      let parsedData;
      if (scannedText.startsWith('{')) {
        parsedData = JSON.parse(scannedText);
      } else {
        const urlParams = new URLSearchParams(scannedText.split('?')[1]);
        parsedData = {
          nodeId: urlParams.get('nodeId'),
          x: urlParams.get('x'),
          y: urlParams.get('y'),
          name: urlParams.get('name') || 'QR Anchor Point',
        };
      }

      if (!parsedData.nodeId || parsedData.x === undefined || parsedData.y === undefined) {
        throw new Error('Invalid QR structure. Missing nodeId or coordinates.');
      }

      const formattedData = {
        nodeId: parsedData.nodeId,
        x: Number(parsedData.x),
        y: Number(parsedData.y),
        name: parsedData.name,
      };

      // Triggers whichever prop callback your parent page is using
      if (onAnchorCalibrated) {
        onAnchorCalibrated(formattedData);
      }
      if (onDetect) {
        await onDetect(formattedData);
      }
      
    } catch (err: any) {
      console.error('Calibration scan failed:', err);
      setError(err.message || 'Failed to sync location via this QR code.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-between p-4 text-white animate-fade-in">
      <div className="flex justify-between items-center py-2 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold">Scan Calibration QR</h2>
          <p className="text-xs text-gray-400">Align with any posted QR to clear drift</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white/15 rounded-full text-sm font-semibold hover:bg-white/20 transition-all">
          ✕ Close
        </button>
      </div>

      <div className="relative flex-1 max-h-[60vh] my-4 rounded-xl overflow-hidden border border-white/20">
        <CameraScanner onScan={handleScanSuccess} />
        <div className="absolute inset-0 pointer-events-none border-4 border-emerald-500/40 m-12 rounded-lg animate-pulse" />
      </div>

      <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-2">
        {error ? (
          <div className="text-red-400 text-center text-sm font-medium">{error}</div>
        ) : processing ? (
          <div className="text-emerald-400 text-center text-sm font-medium animate-pulse">
            Calibrating dead-reckoning alignment matrix...
          </div>
        ) : (
          <p className="text-xs text-gray-300 text-center leading-relaxed">
            Positioning will latch onto this exact spot, recalibrating device accelerometer drift parameters.
          </p>
        )}
      </div>
    </div>
  );
};
