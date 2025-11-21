import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const CustomerDisplay = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [cart, setCart] = useState([]);
  const [cartTotals, setCartTotals] = useState(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'qris' | 'success'
  const [qrString, setQrString] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    const channel = new BroadcastChannel("customer_display");
    console.log("===[CustomerDisplay] BroadcastChannel connected");

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      console.log("===[CustomerDisplay] Broadcast message:", type);

      switch (type) {
        case "CART_UPDATE":
          setCart(payload.cart);
          setCartTotals(payload.cartTotals);
          setPointsToUse(payload.pointsToUse || 0);
          
          setPaymentStatus((prevStatus) => {
            if (prevStatus === "qris" && payload.cart.length > 0) {
              console.log("===[CustomerDisplay] Mengabaikan reset status karena sedang mode QRIS");
              return "qris";
            }
            if (payload.cart.length === 0) {
               setQrString("");
               return null;
            }
            return null; 
          });
          
          setQrString((prevQr) => {
            if (payload.qr_string) return payload.qr_string; 
             if (payload.cart.length > 0 && prevQr) return prevQr; 
             return "";
          });
          break;

        case "PAYMENT_QRIS":
          console.log("===[CustomerDisplay] Menerima Data QRIS");
          setCart(payload.cart);
          setCartTotals(payload.cartTotals);
          setPointsToUse(payload.pointsToUse || 0);
          setQrString(payload.qr_string);
          setPaymentStatus("qris");
          break;

        case "PAYMENT_END":
          console.log("===[CustomerDisplay] Payment End");
          setCart([]);
          setCartTotals(null);
          setPaymentStatus(null);
          setQrString("");
          break;

        default:
          console.log("===[CustomerDisplay] Unhandled Broadcast type:", type);
      }
    };

    const socket = io("https://posapi.wrdnika.my.id", {
      path: "/socket-react",
      transports: ["polling"], 
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
      auth: {
        userId: user?.user_id, 
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("===[CustomerDisplay] Socket.IO connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("===[CustomerDisplay] Socket.IO disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("===[CustomerDisplay] Connection error:", err.message);
    });

    socket.on("payment_success", (data) => {
      console.log("===[CustomerDisplay] Pembayaran sukses:", data);
      setPaymentStatus("success");
      setQrString("");
      setCart([]);
      setCartTotals(null);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);
    });

    return () => {
      channel.close();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]); 

  useEffect(() => {
    if (qrString) {
      console.log("===[CustomerDisplay] QR string state aktif:", qrString.substring(0, 50) + "...");
    }
  }, [qrString]);

  const handleFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const renderCartItems = () => (
    <div className="flex-grow overflow-y-auto">
      {cart.map((item, index) => (
        <div
          key={index}
          className="flex justify-between items-center p-4 border-b"
        >
          <div>
            <p className="font-semibold">{item.name}</p>
            {item.toppingSummary && (
              <p className="text-sm text-gray-600">{item.toppingSummary}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(item.price * item.qty)}
            </p>
            <p className="text-sm text-gray-600">
              {item.qty} x{" "}
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(item.price)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTotals = () => {
    if (!cartTotals) return null;
    
    const pointValue = 1000;
    const discountAmount = pointsToUse * pointValue;
    const finalTotal = cartTotals.grandTotal - discountAmount;

    return (
      <div className="p-6 bg-gray-50 border-t">
        <div className="flex justify-between mb-2">
          <p>{t("subtotal")}</p>
          <p>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(cartTotals.subtotal)}
          </p>
        </div>
        <div className="flex justify-between mb-2">
          <p>{t("service")}</p>
          <p>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(cartTotals.totalService)}
          </p>
        </div>
        <div className="flex justify-between mb-2">
          <p>{t("tax_pb1_ppn")}</p>
          <p>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(cartTotals.totalPb1 + cartTotals.totalPpn)}
          </p>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between mb-2 text-green-600">
            <p>{t("discount_points")}</p>
            <p>
              -{" "}
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(discountAmount)}
            </p>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold">
          <p>{t("total")}</p>
          <p>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(finalTotal)}
          </p>
        </div>
      </div>
    );
  };

  const renderNotification = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center animate-fade-in-up">
        <h2 className="text-3xl font-bold text-green-600 mb-3">
          🎉 Pembayaran Berhasil!
        </h2>
        <p className="text-gray-600 text-lg">
          Terima kasih atas pembeliannya 🙌
        </p>
      </div>
    </div>
  );

  const renderIdleState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <img src="/vite.svg" alt={t("company_logo")} className="w-48 h-48 mb-8" />
      <h1 className="text-4xl font-bold">{t("company_name")}</h1>
      <p className="text-xl text-gray-500 mt-2">{t("welcome_message")}</p>
    </div>
  );

  const renderTransactionState = () => (
    <div className="flex flex-col h-full">
      <header className="bg-blue-600 text-white p-6 text-center">
        <h1 className="text-3xl font-bold">{t("your_order")}</h1>
      </header>
      {renderCartItems()}
      {renderTotals()}
    </div>
  );

  const isUrl = (string) => {
    try {
      return Boolean(new URL(string));
    } catch (e) {
      return false;
    }
  };

  const renderQrisState = () => (
    <div className="flex h-full">
      <div className="w-1/2 flex flex-col">
        <header className="bg-blue-600 text-white p-6 text-center">
          <h1 className="text-3xl font-bold">{t("your_order")}</h1>
        </header>
        {renderCartItems()}
        {renderTotals()}
      </div>
      <div className="w-1/2 flex items-center justify-center bg-gray-100 p-8">
        <div className="text-center w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">
            {t("scan_to_pay_with_qris")}
          </h2>
          <div className="bg-white p-8 rounded-lg shadow-lg flex items-center justify-center min-h-[300px]">
            {qrString ? (
               isUrl(qrString) ? (
                <img 
                  src={qrString} 
                  alt="QR Payment" 
                  className="w-full h-auto max-w-[256px] object-contain"
                  onError={(e) => {
                    console.error("Gagal memuat gambar QR:", qrString);
                    e.target.style.display = 'none';
                  }}
                />
               ) : (
                <div style={{ background: 'white', padding: '0px' }}>
                  <QRCode 
                    value={qrString}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>
               )
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                 <span className="text-4xl mb-2">📷</span>
                 <p>Menunggu kode QR...</p>
              </div>
            )}
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            Silakan scan QR Code di atas menggunakan aplikasi pembayaran Anda.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h2 className="text-3xl font-bold text-green-500">
        {t("payment_successful")}
      </h2>
      <p className="text-lg text-gray-600">
        {t("thank_you_for_your_purchase")}
      </p>
    </div>
  );

  const renderContent = () => {
    if (paymentStatus === "qris") {
      return renderQrisState();
    }
    if (paymentStatus === "success") {
      return renderSuccessState();
    }
    if (cart && cart.length > 0 && cartTotals) {
      return renderTransactionState();
    }
    return renderIdleState();
  };

  return (
    <div className="h-screen bg-white text-gray-800 font-sans">
      {renderContent()}
      <button
        onClick={handleFullScreen}
        className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
        title={t("go_fullscreen")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"
          />
        </svg>
      </button>
      {showSuccessNotification && renderNotification()}
    </div>
  );
};

export default CustomerDisplay;