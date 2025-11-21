import React, { useCallback } from "react";
import { useStartOfDay } from "../hooks/useStartofDay";
import { usePressAndHold } from "../hooks/usePressAndHold";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import Message from "../components/common/Message";

const DenominationRow = React.memo(
  ({ denom, count, onChange, loading, formatCurrency }) => {
    const incrementRef = usePressAndHold(() =>
      onChange(denom.money_value, (prevCount) => prevCount + 1)
    );
    const decrementRef = usePressAndHold(() =>
      onChange(denom.money_value, (prevCount) =>
        prevCount > 0 ? prevCount - 1 : 0
      )
    );

    return (
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-x-2 py-2 border-b border-gray-100 last:border-b-0 md:border-b-0">
        <label className="font-medium text-gray-800 text-base">
          {formatCurrency(denom.money_value)}
        </label>
        <div className="flex items-center justify-center border border-gray-300 rounded-lg shadow-sm">
          <button
            type="button"
            ref={decrementRef}
            className="px-3 py-2 text-2xl font-bold text-red-500 rounded-l-md hover:bg-red-50 focus:outline-none select-none"
            disabled={loading}
          >
            -
          </button>
          <input
            type="number"
            value={count || 0}
            onChange={(e) => onChange(denom.money_value, e.target.value)}
            className="w-20 text-center border-y-0 border-x font-semibold text-lg text-gray-900 focus:ring-0 focus:border-gray-300"
            min="0"
            disabled={loading}
          />
          <button
            type="button"
            ref={incrementRef}
            className="px-3 py-2 text-2xl font-bold text-green-500 rounded-r-md hover:bg-green-50 focus:outline-none select-none"
            disabled={loading}
          >
            +
          </button>
        </div>
        <div className="text-right font-mono text-base text-gray-700">
          = {formatCurrency((count || 0) * denom.money_value)}
        </div>
      </div>
    );
  }
);

export default function StartOfDay() {
  const {
    loading,
    message,
    type,
    hideMessage,
    tellers,
    selectedTeller,
    setSelectedTeller,
    shifts,
    selectedShift,
    setSelectedShift,
    currencies,
    selectedCurrency,
    setSelectedCurrency,
    moneyDenoms,
    denomCounts,
    usePayment,
    setUsePayment,
    totalBalance,
    formatCurrency,
    handleDenomCountChange,
    handleSave,
  } = useStartOfDay();

  const { t } = useTranslation();

  const formGridClass = usePayment ? "grid-cols-12" : "grid-cols-1";
  const containerWidthClass = usePayment ? "min-h-screen m-2" : "max-w-xl";

  // --- RENDER ---
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 font-sans">
      <div
        className={`bg-white p-6 rounded-xl shadow-lg w-full transition-all duration-300 ease-in-out ${containerWidthClass}`}
      >
        <div className="relative flex items-center justify-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">
            {t("startOfDay")}
          </h2>
        </div>
        <form onSubmit={handleSave} className={`grid ${formGridClass} gap-6`}>
          {/* Left Column: Main Form Inputs */}
          <div className="col-span-3">
            <div className=" space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("teller")}
                </label>
                <select
                  value={selectedTeller}
                  onChange={(e) => setSelectedTeller(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || tellers.length === 0}
                >
                  {tellers.map((t) => (
                    <option key={t.teller_cd} value={t.teller_cd}>
                      {t.teller_desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || shifts.length === 0}
                >
                  {shifts.map((s) => (
                    <option key={s.shift_cd} value={s.shift_cd}>
                      {s.shift_nm} {s.desc1} ({s.open_time} - {s.close_time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("currency")}
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || currencies.length === 0}
                >
                  {currencies.map((c) => (
                    <option key={c.currency_cd} value={c.currency_cd}>
                      {c.currency_nm} ({c.currency_cd})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("useInitialBalance")}
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setUsePayment(true)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-200 ease-in-out shadow-sm ${
                    usePayment
                      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                  disabled={loading}
                >
                  {t("yes")}
                </button>
                <button
                  type="button"
                  onClick={() => setUsePayment(false)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-200 ease-in-out shadow-sm ${
                    !usePayment
                      ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                  disabled={loading}
                >
                  {t("no")}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex justify-center items-center gap-2 font-semibold transition duration-200 ease-in-out shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  {" "}
                  <Icon
                    icon="line-md:loading-loop"
                    className="animate-spin text-xl"
                  />{" "}
                  {t("saving")}{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Icon
                    icon="solar:floppy-disk-bold"
                    className="text-xl"
                  />{" "}
                  {t("save")}{" "}
                </>
              )}
            </button>
          </div>
          {/* Right Column */}
          {usePayment && (
            <div className="col-span-9 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-[500px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {t("initialBalanceDetails")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2 overflow-y-auto">
                {moneyDenoms.map((denom) => (
                  <DenominationRow
                    key={denom.money_denom_cd}
                    denom={denom}
                    count={denomCounts[denom.money_value]}
                    onChange={handleDenomCountChange}
                    loading={loading}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
              <div className="mt-auto pt-3 border-t-2 border-dashed border-gray-300 text-right">
                <span className="text-sm text-gray-600">
                  {t("totalBalanceLabel")}{" "}
                </span>
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency(totalBalance)}
                </span>
              </div>
            </div>
          )}
        </form>
      </div>
      <Message message={message} type={type} onClose={hideMessage} />
    </div>
  );
}
