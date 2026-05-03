import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  useEffect(() => {
    if (isOpen) {
      const scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <QrCode size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Scan Booking QR</h2>
          <p className="text-slate-500 text-sm mt-2 mb-8">Place the customer's QR code inside the frame to verify.</p>
          
          <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50"></div>
          
          <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Center the code for faster detection
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
