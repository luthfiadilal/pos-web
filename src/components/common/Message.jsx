import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

const Message = ({ message, type, onClose }) => {
  const { t } = useTranslation();
  if (!message) return null;

  let bgColor,
    textColor,
    borderColor,
    buttonColor,
    buttonHoverColor,
    buttonTextColor,
    icon,
    title;

  switch (type) {
    case "success":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      borderColor = "border-green-500";
      buttonColor = "bg-green-700";
      buttonHoverColor = "hover:bg-green-900";
      buttonTextColor = "text-green-100";
      icon = "mdi:check-circle";
      title = t("successExclamation");
      break;
    case "info":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      borderColor = "border-blue-500";
      buttonColor = "bg-blue-700";
      buttonHoverColor = "hover:bg-blue-900";
      buttonTextColor = "text-blue-100";
      icon = "mdi:information";
      title = t("information");
      break;
    default: // error
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      borderColor = "border-red-500";
      buttonColor = "bg-red-700";
      buttonHoverColor = "hover:bg-red-900";
      buttonTextColor = "text-red-100";
      icon = "mdi:close-circle";
      title = t("errorExclamation");
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-[9999]">
      <div
        className={`rounded-lg p-6 shadow-xl max-w-sm w-full border-t-4 ${borderColor} ${bgColor}`}
      >
        <div className="flex items-center mb-4">
          <Icon icon={icon} className={`text-2xl mr-3 ${textColor}`} />
          <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
        </div>
        <p className={`text-sm ${textColor} mb-6`}>{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${buttonColor} ${buttonTextColor} rounded-md ${buttonHoverColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Message;
