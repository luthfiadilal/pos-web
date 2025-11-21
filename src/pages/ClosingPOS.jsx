import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";

import { getDailySalesByCashier } from "../services/dailySalesCashier";
import { session } from "../services/session";
import { closing } from "../services/closing";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString || dateString.length < 8) return "N/A";
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const hours = dateString.substring(8, 10) || "00";
  const minutes = dateString.substring(10, 12) || "00";
  return new Date(year, month - 1, day, hours, minutes).toLocaleString(
    "id-ID",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const normalizeSalesFromApi = (items) => {
  const result = {
    pay_cash_amnt: 0,
    pay_ewallet_amnt: 0,
    pay_debit_amnt: 0,
    pay_credit_amnt: 0,
    sales_amnt: 0,
  };

  if (!Array.isArray(items)) return result;

  const seen = new Set();

  items.forEach((item) => {
    const dp = item.data_penjualan || {};
    const amount = Number(dp.total_amount) || 0;
    const method = (dp.payment_method?.payment_nm || "").trim().toUpperCase();
    const key = dp.trans_no_sales || dp.slip_no; 

    if (seen.has(key)) return;
    seen.add(key);

    result.sales_amnt += amount;

    switch (method) {
      case "TUNAI":
        result.pay_cash_amnt += amount;
        break;
      case "OVO":
        result.pay_ewallet_amnt += amount;
        break;
      case "DEBIT":
        result.pay_debit_amnt += amount;
        break;
      default:
        break;
    }
  });

  return result;
};

export default function ClosingPOS() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const [view, setView] = useState("initial");
  const [salesData, setSalesData] = useState({
    pay_cash_amnt: 0,
    pay_ewallet_amnt: 0,
    pay_debit_amnt: 0,
    pay_credit_amnt: 0,
    sales_amnt: 0,
  });

  const [sessionData, setSessionData] = useState(null);
  const [finalClosingData, setFinalClosingData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const handleStartProcess = async () => {
    if (!user) {
      Swal.fire(t("error"), t("invalid_session_login_again"), "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const commonParams = {
        unit_cd: user.unit_cd,
        company_cd: user.company_cd,
        branch_cd: user.branch_cd,
      }; 

      const sessionRes = await session(
        commonParams.unit_cd,
        commonParams.company_cd,
        commonParams.branch_cd,
        getTodayDateString(),
        user.user_id
      );

      if (
        !sessionRes?.data ||
        !sessionRes.data.shift_cd ||
        !sessionRes.data.cashier_id
      ) {
        throw new Error(t("no_active_session"));
      }

      const { shift_cd, cashier_id } = sessionRes.data; 

      const salesRes = await getDailySalesByCashier(
        commonParams.unit_cd,
        commonParams.company_cd,
        commonParams.branch_cd,
        shift_cd,
        cashier_id
      ); 

      console.log("=== CHECK salesRes.data ===", salesRes.data);
      console.log(
        "=== CHECK typeof salesRes.data.data ===",
        typeof salesRes.data.data
      );
      console.log("=== CHECK REAL RAW ITEM ===", salesRes.data?.[0]);
      console.log("NORMALIZED RESULT:", normalizeSalesFromApi(salesRes.data));

      setSalesData(normalizeSalesFromApi(salesRes.data));

      setSessionData(sessionRes.data);
      setView("form");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t("failed_to_load_initial_data");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClosingProcess = async (counted_end_amount) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { unit_cd, company_cd, branch_cd, user_id } = user;
      const { shift_cd, cashier_id } = sessionData;

      const closingRes = await closing(
        unit_cd,
        company_cd,
        branch_cd,
        sessionData.trans_no,
        parseFloat(counted_end_amount)
      );

      setFinalClosingData({
        ...closingRes.data,
        is_cash_rcv: sessionData.is_cash_rcv,
      });

      const salesRes = await getDailySalesByCashier(
        unit_cd,
        company_cd,
        branch_cd,
        shift_cd,
        cashier_id
      );

      console.log(
        "=== RESPONSE getDailySalesByCashier (AFTER CLOSING) ===",
        salesRes
      );

      setSalesData(normalizeSalesFromApi(salesRes.data));
      setView("result");

      Swal.fire(t("success"), t("session_closed_successfully"), "success");
    } catch (err) {
      console.error(
        "=== DEBUG CLOSING ERROR ===",
        err.response?.data || err.message
      );
      const errorMessage =
        err.response?.data?.message || t("error_during_closing");
      Swal.fire(t("failed"), errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading)
      return (
        <div className="flex justify-center items-center h-screen">
              
          <Icon
            icon="line-md:loading-loop"
            className="text-4xl text-blue-600"
          />
             
        </div>
      );

    if (error)
      return (
        <div className="flex flex-col justify-center items-center h-screen text-red-500 font-medium text-center p-5">
               <p>{error}</p>    
          <button
            onClick={() => {
              setError(null);
              setView("initial");
            }}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
                  {t("back")}    
          </button>
             
        </div>
      );

    switch (view) {
      case "form":
        if (!sessionData) return null;
        return (
          <ClosingForm
            salesData={salesData}
            sessionData={sessionData}
            user={user}
            onSubmit={handleClosingProcess}
            isSubmitting={isSubmitting}
          />
        );
      case "result":
        return (
          <ClosingResult
            closingData={finalClosingData}
            salesData={salesData}
            user={user}
          />
        );
      default:
        return (
          <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                 
            <Icon
              icon="solar:login-3-bold-duotone"
              className="text-7xl text-blue-500 mb-4"
            />
                 
            <h1 className="text-2xl font-bold text-gray-700 mb-2">
                     {t("cashier_closing_page")}     
            </h1>
                 
            <p className="text-gray-500 mb-6">
                     {t("click_button_to_start_closing")}     
            </p>
                 
            <button
              onClick={handleStartProcess}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md flex items-center gap-2"
            >
                    
              <Icon icon="solar:play-circle-bold" className="text-xl" />   
                 {t("start_closing_process")}     
            </button>
                
          </div>
        );
    }
  };

  return <div className="w-full min-h-screen">{renderContent()}</div>;
}

const ClosingForm = ({
  salesData,
  sessionData,
  user,
  onSubmit,
  isSubmitting,
}) => {
  if (!salesData || !sessionData) return null;

  const { t } = useTranslation();
  const openingBalance = parseFloat(sessionData.begin_amnt) || 0;
  const totalSales = parseFloat(salesData.sales_amnt) || 0;
  const expectedClosing = openingBalance + totalSales;

  const triggerSubmit = async () => {
    if (parseInt(sessionData.is_cash_rcv) === 0) {
      // Tidak perlu input uang fisik
      await onSubmit(0);
      return;
    }

    const { value: counted_end_amount } = await Swal.fire({
      title: t("confirm_closing"),
      input: "number",
      inputLabel: t("enter_physical_cash_amount"),
      inputPlaceholder: t("example_amount"),
      showCancelButton: true,
      confirmButtonText: t("continue_and_close_session"),
      cancelButtonText: t("cancel"),
      inputValidator: (value) =>
        !value || value < 0 ? t("enter_valid_amount") : null,
    });

    if (counted_end_amount) {
      onSubmit(counted_end_amount);
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-4 md:p-6">
        
      <div className="p-6 md:p-10 max-w-4xl mx-auto bg-white shadow-lg rounded-xl">
           
        <h1 className="text-3xl font-bold text-center mb-8">
               {t("cashier_session_closing")}   
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              
          <div className="bg-gray-50 rounded-lg p-5 shadow-inner">
                 
            <h2 className="font-semibold text-lg mb-4 text-gray-700">
                     {t("session_information")}     
            </h2>
                 
            <div className="text-sm space-y-3">
                    
              <p>
                        <strong>{t("session_id")}:</strong>
                {sessionData.trans_no}      
              </p>
                    
              <p>
                        <strong>{t("cashier")}:</strong>
                {user?.name || "N/A"}      
              </p>
                    
              <p>
                        <strong>{t("start_time")}:</strong>      
                  {formatDate(sessionData.trans_date)}      
              </p>
                    
              <p>
                        <strong>{t("opening_balance")}:</strong>    
                    {formatCurrency(openingBalance)}      
              </p>
                    
              <p>
                        <strong>{t("is_cash_rcv")}:</strong>      
                 
                {parseInt(sessionData.is_cash_rcv) === 1
                  ? t("accepts_cash")
                  : t("non_cash_only")}
                      
              </p>
                   
            </div>
                
          </div>
              
          <div className="bg-gray-50 rounded-lg p-5 shadow-inner">
                 
            <h2 className="font-semibold text-lg mb-4 text-gray-700">
                     {t("sales_summary")}     
            </h2>
                 
            <div className="text-sm space-y-3">
                    
              <p>
                        <strong>{t("cash")}:</strong>        
                {formatCurrency(salesData.pay_cash_amnt)}      
              </p>
                    
              <p>
                        <strong>{t("e_wallet")}:</strong>       
                 {formatCurrency(salesData.pay_ewallet_amnt)}      
              </p>
                    
              <p>
                        <strong>{t("debit_credit")}:</strong>     
                  
                {formatCurrency(
                  (salesData.pay_debit_amnt || 0) +
                    (salesData.pay_credit_amnt || 0)
                )}
                      
              </p>
                    
              <p className="font-bold text-blue-600 border-t pt-3 mt-2">
                        {t("total_sales")}: {formatCurrency(totalSales)}
                      
              </p>
                   
            </div>
                
          </div>
             
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8 text-center">
              
          <h2 className="font-semibold text-md text-blue-800 mb-2">
                  {t("estimated_system_closing_balance")}    
          </h2>
              
          <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(expectedClosing)}    
          </p>
             
        </div>
           
        <div className="text-center">
              
          <button
            onClick={triggerSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
                 
            <Icon
              icon={
                isSubmitting
                  ? "line-md:loading-twotone-loop"
                  : "solar:check-circle-bold"
              }
              className="text-xl"
            />
                 
            {isSubmitting ? t("processing") : t("confirm_and_continue_closing")}
                
          </button>
             
        </div>
          
      </div>
       
    </div>
  );
};

const ClosingResult = ({ closingData, salesData, user }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-6">
        
      <div className="p-6 md:p-10 max-w-4xl mx-auto bg-white shadow-lg rounded-xl">
           
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-600">
               {t("closing_report")}   
        </h1>
           
        <p className="text-center text-gray-500 mb-8">
               {t("session_closed_successfully_message")}   
        </p>
           
        <div className="border rounded-lg p-5 mb-6">
              
          <h2 className="font-semibold text-lg mb-4 text-gray-800">
                  {t("session_financial_details")}    
          </h2>
              
          <div className="space-y-3">
                 
            <div className="flex justify-between items-center">
                    
              <span className="text-gray-600">
                        {t("opening_balance_label")}      
              </span>
                    
              <span className="font-medium">
                        {formatCurrency(closingData.begin_amnt)}   
                  
              </span>
                   
            </div>
                 
            <div className="flex justify-between items-center">
                    
              <span className="text-gray-600">{t("total_income_system")}</span>
                   
              <span className="font-medium text-green-600">
                        + {formatCurrency(closingData.rcv_amnt)}   
                  
              </span>
                   
            </div>
                 
            <div className="flex justify-between items-center pb-2 border-b">
                    
              <span className="text-gray-600">{t("total_expenses")}</span>  
                 
              <span className="font-medium text-red-600">
                        - {formatCurrency(closingData.paid_out_amnt)} 
                    
              </span>
                   
            </div>
                 
            <div className="flex justify-between items-center font-bold">
                     <span>{t("closing_balance_system")}</span>    
               
              <span>
                       
                {formatCurrency(
                  parseFloat(closingData.begin_amnt) +
                    parseFloat(closingData.rcv_amnt)
                )}
                      
              </span>
                   
            </div>
                             
            {parseInt(closingData.is_cash_rcv) === 1 && (
              <>
                       
                <div className="flex justify-between items-center font-bold">
                           <span>{t("closing_balance_physical")}</span>
                          
                  <span>{formatCurrency(closingData.counted_end_amount)}</span>
                        
                </div>
                       
                <div
                  className={`flex justify-between items-center text-lg font-bold p-3 rounded-lg ${
                    closingData.variance == 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                           <span>{t("variance")}</span>       
                   <span>{formatCurrency(closingData.variance)}</span>    
                    
                </div>
                      
              </>
            )}
                
          </div>
             
        </div>
            {/* Sales Summary */}   
        <div className="bg-gray-50 rounded-lg p-5 shadow-inner">
              
          <h2 className="font-semibold text-lg mb-4 text-gray-700">
                  {t("sales_summary_during_session")}          
          </h2>
              
          <div className="text-sm space-y-3">
                 
            <p>
                     <strong>{t("cash")}:</strong>       
              {formatCurrency(salesData.pay_cash_amnt)}     
            </p>
                 
            <p>
                     <strong>{t("e_wallet")}:</strong>       
              {formatCurrency(salesData.pay_ewallet_amnt)}     
            </p>
                 
            <p>
                     <strong>{t("debit_credit")}:</strong>       
              {formatCurrency(
                (salesData.pay_debit_amnt || 0) +
                  (salesData.pay_credit_amnt || 0)
              )}
                   
            </p>
                 
            <p className="font-bold text-blue-600 border-t pt-3 mt-2">
                     {t("total_sales")}:
              {formatCurrency(salesData.sales_amnt)}     
            </p>
                
          </div>
             
        </div>
          
      </div>
       
    </div>
  );
};
