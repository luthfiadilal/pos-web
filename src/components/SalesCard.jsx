import React from "react";
import { useTranslation } from "react-i18next";

const SalesCard = ({
  title,
  sales_qty,
  sales_amnt,
  pay_cash_amnt,
  pay_bank_amnt,
  pay_debit_amnt,
  pay_credit_amnt,
  pay_other_amnt,
  pay_ewallet_amnt,
  pay_online_amnt,
  transfer_amnt,
}) => {
  const { t } = useTranslation();
  const formatCurrency = (value) =>
    value !== null && value !== undefined
      ? `Rp${Number(value).toLocaleString()}`
      : "-";

  return (
    <div className="bg-gray-100 p-4 rounded-lg flex-1 shadow-inner">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>

      {/* Summary */}
      <div className="space-y-3 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">{t("sales_qty")}:</span>
          <span className="font-medium">
            {sales_qty ?? 0} {t("items")}
          </span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="text-gray-600 font-semibold">
            {t("total_sales_amount")}:
          </span>
          <span className="font-bold">{formatCurrency(sales_amnt)}</span>
        </div>
      </div>

      <div className="space-y-2 text-xs border-t pt-2">
        <div className="flex justify-between">
          <span className="text-gray-600">{t("cash")}:</span>
          <span className="font-medium">{formatCurrency(pay_cash_amnt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("bank")}:</span>
          <span className="font-medium">{formatCurrency(pay_bank_amnt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("debit")}:</span>
          <span className="font-medium">{formatCurrency(pay_debit_amnt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("credit")}:</span>
          <span className="font-medium">{formatCurrency(pay_credit_amnt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("other")}:</span>
          <span className="font-medium">{formatCurrency(pay_other_amnt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("e_wallet")}:</span>
          <span className="font-medium">
            {formatCurrency(pay_ewallet_amnt)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("online")}:</span>
          <span className="font-medium">{formatCurrency(pay_online_amnt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t("transfer")}:</span>
          <span className="font-medium">{formatCurrency(transfer_amnt)}</span>
        </div>
      </div>
    </div>
  );
};

export default SalesCard;
