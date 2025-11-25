import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

const QRCodeModal = ({ qrCodeUrl, totalAmount, onClose }) => {
  const { t } = useTranslation();
  // 1. Set waktu awal 5 menit (300 detik)
  const [timeLeft, setTimeLeft] = useState(300);

  // 2. Logic hitung mundur
  useEffect(() => {
    if (!timeLeft) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // 3. Format menit:detik
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const isUrl = (string) => {
    try {
      return Boolean(new URL(string));
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-md animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {t("scan_qr_to_pay")}
        </h2>

        <div className="text-center mb-2">
           <span className={`text-sm font-semibold ${timeLeft < 60 ? "text-red-600 animate-pulse" : "text-gray-600"}`}>
             Berakhir dalam: {formatTime(timeLeft)}
           </span>
        </div>
        
        <div className="flex justify-center mb-6 bg-white p-4 rounded-lg border border-gray-100 relative">
          {/* Overlay jika waktu habis */}
          {timeLeft === 0 && (
             <div className="absolute inset-0 bg-gray-300 bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <p className="text-red-600 font-bold">QR Expired</p>
             </div>
          )}

          {qrCodeUrl ? (
            isUrl(qrCodeUrl) ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64 object-contain" 
              />
            ) : (
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

        <div className="text-center ">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">
            {t("payment.totalDue") || "Total Payment"}
          </p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            Rp {(totalAmount || 0).toLocaleString("id-ID")}
          </p>
        </div>

        <p className="text-center text-gray-600 mb-4 px-2 text-sm">
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