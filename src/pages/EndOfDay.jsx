import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

export default function EndOfDay() {
  const { t } = useTranslation();
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [usePayment, setUsePayment] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedOpening = localStorage.getItem("openingBalance");
    const storedUsePayment = localStorage.getItem("usePayment");

    if (storedOpening) setOpeningBalance(storedOpening);
    if (storedUsePayment !== null) setUsePayment(storedUsePayment === "true");
  }, []);

  const handleSubmit = () => {
    if (!closingBalance || parseInt(closingBalance) <= 0) {
      alert(t("enter_valid_closing_balance"));
      return;
    }

    console.log(t("end_of_day_report"), {
      openingBalance,
      closingBalance,
      usePayment,
      date: new Date().toISOString(),
    });

    // Reset
    localStorage.removeItem("openingBalance");
    localStorage.removeItem("usePayment");

    alert(t("eod_saved_see_you_tomorrow"));
    navigate("/menu");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-blue-700 mb-4">
          {t("end_of_day")}
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("opening_balance_from_sod")}
          </label>
          <div className="bg-gray-100 p-2 rounded-lg text-gray-700">
            Rp {parseInt(openingBalance || 0).toLocaleString("id-ID")}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("closing_balance_capital_income")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">Rp</span>
            <input
              type="number"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("example_500000")}
              min="0"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex justify-center items-center gap-2"
        >
          <Icon icon="solar:archive-down-bold" />
          {t("save_and_close_day")}
        </button>
      </div>
    </div>
  );
}
