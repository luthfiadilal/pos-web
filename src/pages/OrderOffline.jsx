import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { getOrderHistory } from "../services/payment";
import DataTable from "../components/common/DataTable";
import TransactionDetailModal from "../components/modal/TransactionDetailModal";

const formatCurrency = (value) => {
  return new Intl.NumberFormat({
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const parseApiDateTime = (dateTimeString) => {
  if (!dateTimeString || dateTimeString.length < 14) {
    return { date: "N/A", time: "N/A" };
  }
  const year = dateTimeString.substring(0, 4);
  const month = dateTimeString.substring(4, 6);
  const day = dateTimeString.substring(6, 8);
  const hour = dateTimeString.substring(8, 10);
  const minute = dateTimeString.substring(10, 12);

  return {
    date: `${year}-${month}-${day}`, 
    time: `${hour}:${minute}`,
  };
};

const OrderOfflineOverview = () => {
  const { t, i18n } = useTranslation();
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    day: String(currentDate.getDate()).padStart(2, "0"),
    month: String(currentDate.getMonth() + 1).padStart(2, "0"),
    year: currentDate.getFullYear().toString(),
  });
  const [transactionSortConfig, setTransactionSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  useEffect(() => {
    if (user) {
      const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
          const responseData = await getOrderHistory(
            user.unit_cd,
            user.company_cd,
            user.branch_cd
          );

          if (!Array.isArray(responseData)) {
            console.warn(t("response_not_an_array"), responseData);
            setAllTransactions([]);
            return;
          }

          const paidTransactions = responseData.filter(
            (transaction) => transaction.orderHeader?.is_paid === 1
          );

          const formattedTransactions = paidTransactions.map((transaction) => {
            const { time } = parseApiDateTime(transaction.trans_date);
            return {
              ...transaction,
              time: time,
            };
          });

          setAllTransactions(formattedTransactions);
        } catch (err) {
          console.error(t("failed_to_fetch_transactions"), err);
          setError(t("errorFetchTransactions"));
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    } else {
      setLoading(false);
      setError(t("errorUserDataNotAvailable"));
    }
  }, [user, t]);

  const transactionColumns = useMemo(
    () => [
      { header: t("slipNo"), accessor: "slip_no", sortable: true },
      { header: t("time"), accessor: "time", sortable: true },
      {
        header: t("totalItems"),
        accessor: "sales_qty",
        sortable: true,
      },
      {
        header: t("totalPurchase"),
        accessor: "total_amnt",
        className: "font-semibold",
        sortable: true,
        render: (trx) => formatCurrency(trx.total_amnt),
      },
      {
        header: t("paymentStatus"),
        accessor: "is_paid",
        // className: "text-center",
        sortable: true,
        render: (trx) => (
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              trx.orderHeader?.is_paid === 1
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {trx.orderHeader?.is_paid === 1 ? t("paid") : t("unpaid")}
          </span>
        ),
      },
      {
        header: t("actions"),
        accessor: "actions",
        // className: "text-center",
        sortable: true,
        render: (trx) => (
          <button
            onClick={() => setSelectedTransaction(trx)}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            {t("viewDetails")}
          </button>
        ),
      },
    ],
    [t, setSelectedTransaction]
  );

  const requestSort = (key, config, setConfig) => {
    let direction = "ascending";
    if (config.key === key && config.direction === "ascending") {
      direction = "descending";
    }
    setConfig({ key, direction });
  };
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      if (!transaction.trans_date) return false;

      const { date } = parseApiDateTime(transaction.trans_date);
      if (date === "N/A") return false;

      const orderDate = new Date(date);
      const orderYear = orderDate.getFullYear().toString();
      const orderMonth = String(orderDate.getMonth() + 1).padStart(2, "0");
      const orderDay = String(orderDate.getDate()).padStart(2, "0");

      const matchYear = !filters.year || orderYear === filters.year;
      const matchMonth = !filters.month || orderMonth === filters.month;
      const matchDay = !filters.day || orderDay === filters.day;

      return matchYear && matchMonth && matchDay;
    });
  }, [allTransactions, filters]);

  const sortedTransactions = useMemo(() => {
    let sorted = [...filteredTransactions];
    if (transactionSortConfig.key) {
      sorted.sort((a, b) => {
        if (a[transactionSortConfig.key] < b[transactionSortConfig.key]) {
          return transactionSortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[transactionSortConfig.key] > b[transactionSortConfig.key]) {
          return transactionSortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [filteredTransactions, transactionSortConfig]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(sortedTransactions.length / rowsPerPage);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedTransactions, currentPage]);

  const totalQty = useMemo(
    () => filteredTransactions.reduce((sum, trx) => sum + trx.sales_qty, 0),
    [filteredTransactions]
  );
  const totalAmount = useMemo(
    () => filteredTransactions.reduce((sum, trx) => sum + trx.total_amnt, 0),
    [filteredTransactions]
  );

  // --- UI HELPER FUNCTIONS & RENDER METHOD --- (Tidak ada perubahan)
  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => currentDate.getFullYear() - i
  );
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1).padStart(2, "0"),
        name: new Date(0, i).toLocaleString(i18n.language, { month: "long" }),
      })),
    [i18n.language]
  );
  const getDayOptions = () => {
    if (!filters.month || !filters.year)
      return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    if (field === "year") {
      newFilters.month = "";
      newFilters.day = "";
    }
    if (field === "month") {
      newFilters.day = "";
    }
    setFilters(newFilters);
  };

  return (
    <>
      {/* <div className="p-4 md:p-6 bg-gray-50 min-h-screen"> */}
      <div className="p-2 md:p-4 bg-gray-100 h-full rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          {t("transactionHistory")}
        </h1>

        {/* Date Filters */}
        <div className="flex flex-col md:flex-row shadow-md md:items-center gap-4 mb-2 p-2 bg-white rounded-xl ">
          {/* Filter controls... */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-sm text-gray-600">
              {t("year")}:
            </label>
            <select
              className="bg-white border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-sm text-gray-600">
              {t("month")}:
            </label>
            <select
              className="bg-white border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
              disabled={!filters.year}
            >
              <option value="">{t("all")}</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-sm text-gray-600">
              {t("day")}:
            </label>
            <select
              className="bg-white border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.day}
              onChange={(e) => handleFilterChange("day", e.target.value)}
              disabled={!filters.month}
            >
              <option value="">{t("all")}</option>
              {getDayOptions().map((day) => (
                <option key={day} value={String(day).padStart(2, "0")}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() =>
              setFilters({
                day: String(currentDate.getDate()).padStart(2, "0"),
                month: String(currentDate.getMonth() + 1).padStart(2, "0"),
                year: currentDate.getFullYear().toString(),
              })
            }
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
          >
            {t("today")}
          </button>
        </div>

        <DataTable
          columns={transactionColumns}
          data={paginatedTransactions}
          isLoading={loading}
          emptyMessage={error || t("noTransactionsFound")}
          sortConfig={transactionSortConfig}
          onSort={(key) =>
            requestSort(key, transactionSortConfig, setTransactionSortConfig)
          }
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
          }}
        />
        {/* Pagination Controls */}
        {/* {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md border text-sm ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )} */}

        <div className="mt-2 flex flex-col md:flex-row justify-end items-center gap-4 md:gap-8 p-4 bg-gray-100 rounded-lg">
          <div className="font-bold text-gray-800">
            {t("totalQty")}: <span className="text-blue-600">{totalQty}</span>
          </div>
          <div className="font-bold text-gray-800">
            {t("totalAmount")}:{" "}
            <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
      {/* </div> */}

      {/* Render Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </>
  );
};

export default OrderOfflineOverview;
