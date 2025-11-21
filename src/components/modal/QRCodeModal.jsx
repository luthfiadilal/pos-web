import React from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

const QRCodeModal = ({ qrCodeUrl, onClose }) => {
  const { t } = useTranslation();

  // Helper simpel untuk cek apakah string berupa URL (https://...)
  const isUrl = (string) => {
    try {
      return Boolean(new URL(string));
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {t("scan_qr_to_pay")}
        </h2>
        
        <div className="flex justify-center my-6 bg-white p-4 rounded-lg border border-gray-100">
          {qrCodeUrl ? (
            isUrl(qrCodeUrl) ? (
              // Kalo Backend ngasih URL Gambar (Fallback)
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64 object-contain" 
              />
            ) : (
              // Kalo Backend ngasih Raw String (Utama) -> Generate Vector QR
              <div style={{ background: "white", padding: "0px" }}>
                <QRCode
                  value={qrCodeUrl}
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
            )
          ) : (
            <p className="text-gray-400">Loading QR...</p>
          )}
        </div>

        <p className="text-center text-gray-600 mb-6 px-4 text-sm">
          {t("point_your_camera_at_the_qr_code")}
        </p>
        
        <button
          onClick={onClose}
          className="w-full bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;