import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // or your scanner library (e.g. @zxing/library)

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export const CameraScanner = ({ onScanSuccess }: ScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScanSuccess);import { useEffect, useRef } from 'react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export const CameraScanner = ({ onScanSuccess }: ScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onScanRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Check browser support for BarcodeDetector
          if ('BarcodeDetector' in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code']
            });

            const detectCode = async () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    onScanRef.current(barcodes[0].rawValue);
                  }
                } catch (e) {
                  // Ignore frame detection errors
                }
              }
              animationFrameId = requestAnimationFrame(detectCode);
            };

            detectCode();
          }
        }
      } catch (err) {
        console.error('Camera access error:', err);
      }
    };

    startCamera();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
    </div>
  );
};

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
