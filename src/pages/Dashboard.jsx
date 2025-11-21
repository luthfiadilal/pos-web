import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import SalesCard from "../components/SalesCard";
import ProductSalesTable from "../components/dashboard/ProductSalesTable";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";
import ProductSalesChart from "../components/dashboard/ProductSalesChart";
import GuestSummaryChart from "../components/dashboard/GuestSummaryChart";
import { useAuth } from "../contexts/AuthContext";
import Chatbot from "../components/Chatbot";
import { getDailySales } from "../services/salesDaily";
import { getMonthlySales } from "../services/salesMonthly";
import { getYearSales } from "../services/salesYearly";
import { getOrderProductByMonth } from "../services/orderProductByMonth";
import { getOrderHistory } from "../services/payment";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [dailySales, setDailySales] = useState({ title: t("daily_sales") });
  const [monthlySales, setMonthlySales] = useState({
    title: t("monthly_sales"),
  });
  const [yearlySales, setYearlySales] = useState({
    title: t("yearly_sales"),
  });

  const currentDate = new Date();
  const [dailyFilters, setDailyFilters] = useState({
    day: String(currentDate.getDate()).padStart(2, "0"),
    month: String(currentDate.getMonth() + 1).padStart(2, "0"),
    year: currentDate.getFullYear().toString(),
  });

  const [monthlyFilters, setMonthlyFilters] = useState({
    month: String(currentDate.getMonth() + 1).padStart(2, "0"),
    year: currentDate.getFullYear().toString(),
  });

  const [yearlyFilters, setYearlyFilters] = useState({
    year: currentDate.getFullYear().toString(),
  });

  const [productSales, setProductSales] = useState([]);
  const [isProductSalesLoading, setIsProductSalesLoading] = useState(true);

  const [guestData, setGuestData] = useState({ men: 0, women: 0, total: 0 });
  const [isGuestDataLoading, setIsGuestDataLoading] = useState(true);

  const [allDailySales, setAllDailySales] = useState([]);
  const [allMonthlySales, setAllMonthlySales] = useState([]);
  const [allYearlySales, setAllYearlySales] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      setIsProductSalesLoading(true);
      setIsGuestDataLoading(true);
      try {
        const { unit_cd, company_cd, branch_cd } = user;

        const [dailyRes, monthlyRes, yearlyRes, orderHistoryRes] =
          await Promise.all([
            getDailySales(unit_cd, company_cd, branch_cd),
            getMonthlySales(unit_cd, company_cd, branch_cd),
            getYearSales(unit_cd, company_cd, branch_cd),
            getOrderHistory(unit_cd, company_cd, branch_cd),
          ]);

        if (dailyRes.data) setAllDailySales(dailyRes.data);
        if (monthlyRes.data) setAllMonthlySales(monthlyRes.data);
        if (yearlyRes.data) setAllYearlySales(yearlyRes.data);

        let orders = orderHistoryRes.data;
        if (!orders && Array.isArray(orderHistoryRes)) {
          orders = orderHistoryRes;
        }
        if (orders && orders.length > 0) {
          const guestCounts = orders.reduce(
            (acc, order) => {
              acc.men += Number(order.guests_men_cnt) || 0;
              acc.women += Number(order.guests_women_cnt) || 0;
              return acc;
            },
            { men: 0, women: 0 }
          );
          guestCounts.total = guestCounts.men + guestCounts.women;
          setGuestData(guestCounts);
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const currentPeriod = `${year}${month}`;
        const productSalesRes = await getOrderProductByMonth(
          unit_cd,
          company_cd,
          branch_cd,
          currentPeriod
        );
        if (productSalesRes && productSalesRes.data) {
          setProductSales(productSalesRes.data);
        }
      } catch (err) {
        console.error(t("error_fetching_dashboard_data"), err);
      } finally {
        setIsProductSalesLoading(false);
        setIsGuestDataLoading(false);
      }
    };

    fetchAllData();
  }, [user, t]);

  const initialSalesState = {
    sales_qty: 0,
    sales_amnt: 0,
    pay_cash_amnt: 0,
    pay_bank_amnt: 0,
    pay_debit_amnt: 0,
    pay_credit_amnt: 0,
    pay_other_amnt: 0,
    pay_ewallet_amnt: 0,
    pay_online_amnt: 0,
    transfer_amnt: 0,
  };

  const salesReducer = (acc, sale) => {
    acc.sales_qty += sale.sales_qty || 0;
    acc.sales_amnt += sale.sales_amnt || 0;
    acc.pay_cash_amnt += sale.pay_cash_amnt || 0;
    acc.pay_bank_amnt += sale.pay_bank_amnt || 0;
    acc.pay_debit_amnt += sale.pay_debit_amnt || 0;
    acc.pay_credit_amnt += sale.pay_credit_amnt || 0;
    acc.pay_other_amnt += sale.pay_other_amnt || 0;
    acc.pay_ewallet_amnt += sale.pay_ewallet_amnt || 0;
    acc.pay_online_amnt += sale.pay_online_amnt || 0;
    acc.transfer_amnt += sale.transfer_amnt || 0;
    return acc;
  };

  useEffect(() => {
    const filteredData = allDailySales.filter((sale) => {
      const saleYear = sale.period_ymd.substring(0, 4);
      const saleMonth = sale.period_ymd.substring(4, 6);
      const saleDay = sale.period_ymd.substring(6, 8);

      const matchYear = !dailyFilters.year || saleYear === dailyFilters.year;
      const matchMonth =
        !dailyFilters.month || saleMonth === dailyFilters.month;
      const matchDay = !dailyFilters.day || saleDay === dailyFilters.day;

      return matchYear && matchMonth && matchDay;
    });

    const totalSales = filteredData.reduce(salesReducer, {
      ...initialSalesState,
    });
    setDailySales({ title: t("daily_sales"), ...totalSales });
  }, [allDailySales, dailyFilters, t]);

  useEffect(() => {
    const filteredData = allMonthlySales.filter((sale) => {
      const matchYear =
        !monthlyFilters.year || sale.period_yy === monthlyFilters.year;
      const matchMonth =
        !monthlyFilters.month || sale.period_mm === monthlyFilters.month;
      return matchYear && matchMonth;
    });

    const totalSales = filteredData.reduce(salesReducer, {
      ...initialSalesState,
    });
    setMonthlySales({ title: t("monthly_sales"), ...totalSales });
  }, [allMonthlySales, monthlyFilters, t]);

  useEffect(() => {
    const filteredData = allYearlySales.filter((sale) => {
      return !yearlyFilters.year || sale.period_yy === yearlyFilters.year;
    });

    const totalSales = filteredData.reduce(salesReducer, {
      ...initialSalesState,
    });
    setYearlySales({ title: t("yearly_sales"), ...totalSales });
  }, [allYearlySales, yearlyFilters, t]);

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
  const getDayOptions = (year, month) => {
    if (!month || !year) return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };
  const handleFilterChange = (setter) => (field, value) => {
    setter((prev) => {
      const newFilters = { ...prev, [field]: value };
      if (field === "year") {
        newFilters.month = "";
        newFilters.day = "";
      }
      if (field === "month") {
        newFilters.day = "";
      }
      return newFilters;
    });
  };

  return (
    <div className="bg-gray-100 p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("sales_dashboard_title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Sales Card */}
        <div className="bg-white p-2 rounded-xl shadow">
          <SalesCard {...dailySales} />
          <div className="flex items-center gap-2 mt-2">
            <select
              className="bg-gray-50 border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={dailyFilters.year}
              onChange={(e) =>
                handleFilterChange(setDailyFilters)("year", e.target.value)
              }
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className="bg-gray-50 border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={dailyFilters.month}
              onChange={(e) =>
                handleFilterChange(setDailyFilters)("month", e.target.value)
              }
              disabled={!dailyFilters.year}
            >
              <option value="">{t("all")}</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.name}
                </option>
              ))}
            </select>
            <select
              className="bg-gray-50 border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={dailyFilters.day}
              onChange={(e) =>
                handleFilterChange(setDailyFilters)("day", e.target.value)
              }
              disabled={!dailyFilters.month}
            >
              <option value="">{t("all")}</option>
              {getDayOptions(dailyFilters.year, dailyFilters.month).map(
                (day) => (
                  <option key={day} value={String(day).padStart(2, "0")}>
                    {day}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Monthly Sales Card */}
        <div className="bg-white p-2 rounded-xl shadow">
          <SalesCard {...monthlySales} title={t("monthly_sales")} />
          <div className="flex items-center gap-2 mt-2">
            <select
              className="bg-gray-50 border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={monthlyFilters.year}
              onChange={(e) =>
                handleFilterChange(setMonthlyFilters)("year", e.target.value)
              }
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className="bg-gray-50 border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={monthlyFilters.month}
              onChange={(e) =>
                handleFilterChange(setMonthlyFilters)("month", e.target.value)
              }
              disabled={!monthlyFilters.year}
            >
              <option value="">{t("all")}</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Yearly Sales Card */}
        <div className="bg-white p-2 rounded-xl shadow">
          <SalesCard {...yearlySales} title={t("yearly_sales")} />
          <div className="flex items-center gap-2 mt-2">
            <select
              className="bg-gray-50 border border-gray-300 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={yearlyFilters.year}
              onChange={(e) =>
                handleFilterChange(setYearlyFilters)("year", e.target.value)
              }
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ProductSalesTable
        data={productSales}
        isLoading={isProductSalesLoading}
      />

      <ProductSalesChart
        data={productSales}
        isLoading={isProductSalesLoading}
      />

      <GuestSummaryChart guestData={guestData} isLoading={isGuestDataLoading} />

      {/* <SalesTrendChart /> */}
      <Chatbot />
    </div>
  );
};

export default Dashboard;
