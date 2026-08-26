import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // or your scanner library (e.g. @zxing/library)

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export const CameraScanner = ({ onScanSuccess }: ScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScanSuccess);

  // Keep callback reference updated without re-triggering scanner init
  useEffect(() => {
    onScanRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    const elementId = "qr-reader-container";
    const html5QrcodeScanner = new Html5Qrcode(elementId);
    scannerRef.current = html5QrcodeScanner;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Trigger parent callback when a valid QR is decoded
        onScanRef.current(decodedText);
      },
      (errorMessage) => {
        // Ignore frame read failures to avoid UI rerender flickering
      }
    ).catch((err) => {
      console.error("Camera access error:", err);
    });

    return () => {
      // Clean up stream safely on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear());
      }
    };
  }, []); // Empty dependency array ensures zero continuous re-mounting

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div id="qr-reader-container" className="w-full h-full object-cover" />
    </div>
  );
};
