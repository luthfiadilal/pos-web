import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { getKas, getKasYesterday } from "../services/kas";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const formatRupiah = (number) => "Rp " + number.toLocaleString();

const formatTanggal = (dateString) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function Kas() {
  const { t } = useTranslation();
  const [kasList, setKasList] = useState([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();

  const [dateRange, setDateRange] = useState([
    {
      startDate: today,
      endDate: today,
      key: "selection",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null);
  const startDate = dateRange[0].startDate;
  const endDate = dateRange[0].endDate;
  const [saldoKemarin, setSaldoKemarin] = useState(0);
  const [tanggalSaldo, setTanggalSaldo] = useState(null);
  const [kasirName, setKasirName] = useState(null);
  const [tellerCd, setTellerCd] = useState(null);

  useEffect(() => {
    const fetchSaldoKemarin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await getKasYesterday(
          "170",
          "100",
          "110",
          format(startDate, "yyyy-MM-dd"),
          token
        );
        setSaldoKemarin(res.saldoKemarin || 0);
        setTanggalSaldo(res.closingDate || null);
        setKasirName(res.kasirName || null);
        setTellerCd(res.tellerCd || null);
      } catch (err) {
        console.error(t("failed_to_fetch_yesterday_balance"), err);
        setSaldoKemarin(0);
        setTanggalSaldo(null);
        setKasirName(null);
        setTellerCd(null);
      }
    };

    fetchSaldoKemarin();
  }, [startDate, t]);

  useEffect(() => {
    const handler = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
      }
    };
    if (showModal) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [showModal]);

  useEffect(() => {
    const fetchKas = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await getKas(
          "170",
          "100",
          "110",
          {
            date_from: format(startDate, "yyyy-MM-dd"),
            date_to: format(endDate, "yyyy-MM-dd"),
          },
          token
        );
        setKasList(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error(t("failed_to_fetch_cash_data"), error);
      } finally {
        setLoading(false);
      }
    };

    fetchKas();
  }, [startDate, endDate, t]);

  const totalMasuk = useMemo(
    () =>
      kasList
        .filter((k) => k.type === "Masuk")
        .reduce((a, c) => a + c.amount, 0),
    [kasList]
  );

  const totalKeluar = useMemo(
    () =>
      kasList
        .filter((k) => k.type === "Keluar")
        .reduce((a, c) => a + c.amount, 0),
    [kasList]
  );

  const saldoAwal = useMemo(
    () =>
      kasList
        .filter((k) => k.type === "Saldo Awal")
        .reduce((a, c) => a + c.amount, 0),
    [kasList]
  );

  const saldoAkhir = useMemo(
    () => saldoAwal + totalMasuk - totalKeluar,
    [saldoAwal, totalMasuk, totalKeluar]
  );

  const kasWithRunningSaldo = useMemo(() => {
    let saldo = 0;

    const sorted = [...kasList].sort((a, b) =>
      a.trans_date.localeCompare(b.trans_date)
    );

    return sorted.map((item) => {
      if (item.type === "Keluar") {
        saldo -= item.amount || 0;
      } else if (item.type === "Masuk" || item.type === "Saldo Awal") {
        saldo += item.amount || 0;
      }
      return { ...item, runningSaldo: saldo };
    });
  }, [kasList]);

  const parseDbDate = (dbDate) => {
    if (!dbDate) return null;
    const year = dbDate.substring(0, 4);
    const month = dbDate.substring(4, 6);
    const day = dbDate.substring(6, 8);
    const hour = dbDate.substring(8, 10);
    const minute = dbDate.substring(10, 12);
    const second = dbDate.substring(12, 14);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl shadow-xl space-y-8 relative max-w-7xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-extrabold text-gray-800">
          {t("cash_history")}
        </h2>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {format(startDate, "dd MMM yyyy")} -{" "}
              {format(endDate, "dd MMM yyyy")}
            </span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded-2xl shadow-2xl animate-fade-in"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              {t("select_date_range")}
            </h3>
            <DateRange
              ranges={dateRange}
              onChange={(item) => setDateRange([item.selection])}
              rangeColors={["#3b82f6"]}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
            />
            <div className="text-right mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-l-4 border-gray-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">
            {t("last_balance")} ({tanggalSaldo})
          </h4>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatRupiah(saldoKemarin)}
          </p>
          {kasirName && tellerCd && (
            <div className="mt-2 text-gray-600">
              <p className="text-sm">
                {t("cashier")}: {kasirName}
              </p>
              <p className="text-sm">
                {t("pos_teller")}: {tellerCd}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Table Kas */}
      <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-700 font-bold uppercase">
            <tr>
              <th className="px-6 py-4 text-left">{t("date")}</th>
              <th className="px-6 py-4 text-left">{t("type")}</th>
              <th className="px-6 py-4 text-left">{t("amount")}</th>
              <th className="px-6 py-4 text-right">{t("balance")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-6 text-center text-gray-500 font-medium"
                >
                  <div className="flex justify-center items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>{t("loading_data")}...</span>
                  </div>
                </td>
              </tr>
            ) : kasWithRunningSaldo.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-6 text-center text-gray-500 font-medium"
                >
                  {t("no_cash_data_in_range")}
                </td>
              </tr>
            ) : (
              kasWithRunningSaldo.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 text-left">
                    {formatTanggal(parseDbDate(item.trans_date))}
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${
                          item.type === "Masuk"
                            ? "bg-green-100 text-green-800"
                            : item.type === "Keluar"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {t(
                        `cash_type_${item.type.toLowerCase().replace(" ", "_")}`
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-left font-semibold">
                    {formatRupiah(item.amount)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900">
                    {formatRupiah(item.runningSaldo)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Saldo Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Card: Total Masuk */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-green-700">
              {t("total_in")}
            </h4>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {formatRupiah(totalMasuk)}
            </p>
          </div>
        </div>

        {/* Card: Total Keluar */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-red-700">
              {t("total_out")}
            </h4>
            <p className="mt-1 text-2xl font-bold text-red-900">
              {formatRupiah(totalKeluar)}
            </p>
          </div>
        </div>

        {/* Card: Saldo Akhir */}
        <div className="bg-blue-100 border-l-4 border-blue-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-blue-700">
              {t("closing_balance")}
            </h4>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {formatRupiah(saldoAkhir)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
