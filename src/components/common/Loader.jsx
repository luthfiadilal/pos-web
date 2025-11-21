import React from "react";
import "./loader.css";

const Loader = ({ show = false, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/10 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="loader"></div>
        {message && <p className="text-black text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default Loader;
