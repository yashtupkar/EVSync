import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  useEffect(() => {
    if (isOpen) {
      const qrBoxSize = window.innerWidth < 640 ? 200 : 250;
      const scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: qrBoxSize, height: qrBoxSize },
      });

      scanner.render((decodedText) => {
        scanner.clear();
        onScanSuccess(decodedText);
      }, (error) => {
        // console.warn(error);
      });

      return () => {
        scanner.clear().catch(err => console.error("Scanner cleanup error", err));
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="p-6 sm:p-10 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <QrCode size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Scan Booking QR</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 mb-6 sm:mb-8">Place the customer's QR code inside the frame to verify.</p>

          <div id="reader" className="overflow-hidden rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50"></div>

          <p className="mt-6 sm:mt-8 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Center the code for faster detection
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
