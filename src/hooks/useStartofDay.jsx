import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { getCurrencyData } from "../services/currency";
import { saveSOD } from "../services/cashdraw";
import { useMessage } from "./useMessage";

export const useStartOfDay = () => {
  const { t, i18n } = useTranslation();
  const [usePayment, setUsePayment] = useState(true);
  const [loading, setLoading] = useState(false);
  const { message, type, showMessage, hideMessage } = useMessage();
  const [tellers, setTellers] = useState([]);
  const [selectedTeller, setSelectedTeller] = useState("");
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [moneyDenoms, setMoneyDenoms] = useState([]);
  const [denomCounts, setDenomCounts] = useState({});
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user) {
      if (user.teller && user.teller.length > 0) {
        setTellers(user.teller);
        setSelectedTeller(user.teller[0].teller_cd);
      }
      if (user.shift && user.shift.length > 0) {
        setShifts(user.shift);
        setSelectedShift(user.shift[0].shift_cd);
      }
      const fetchCurrencyData = async () => {
        setLoading(true);
        try {
          const response = await getCurrencyData(
            user.unit_cd,
            user.company_cd,
            user.branch_cd
          );

          const { currencies: apiCurrencies, moneyDenoms: apiDenoms } =
            response;
          if (apiCurrencies && apiCurrencies.length > 0) {
            setCurrencies(apiCurrencies);
            setSelectedCurrency(apiCurrencies[0].currency_cd);
          }
          if (apiDenoms && apiDenoms.length > 0) {
            setMoneyDenoms(apiDenoms);
            const initialCounts = apiDenoms.reduce((acc, denom) => {
              acc[denom.money_value] = 0;
              return acc;
            }, {});
            setDenomCounts(initialCounts);
          }
        } catch (error) {
          console.error("❌ Error fetching currency data:", error);
          showMessage(t("errorFetchCurrency"), "error");
        } finally {
          setLoading(false);
        }
      };
      fetchCurrencyData();
    }
  }, [isAuthenticated, navigate, user, t]);

  const handleDenomCountChange = useCallback((moneyValue, updater) => {
    setDenomCounts((prevCounts) => {
      const currentValue = prevCounts[moneyValue] || 0;
      const newValue =
        typeof updater === "function"
          ? updater(currentValue)
          : parseInt(updater, 10) || 0;
      return {
        ...prevCounts,
        [moneyValue]: newValue < 0 ? 0 : newValue,
      };
    });
  }, []);

  const totalBalance = useMemo(() => {
    return moneyDenoms.reduce((total, denom) => {
      const count = denomCounts[denom.money_value] || 0;
      return total + denom.money_value * count;
    }, 0);
  }, [moneyDenoms, denomCounts]);

  const formatCurrency = useCallback(
    (value) => {
      const currencyCode =
        currencies.find((c) => c.currency_cd === selectedCurrency)
          ?.currency_cd || "IDR";
      return new Intl.NumberFormat({
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
      }).format(value);
    },
    [i18n.language, currencies, selectedCurrency]
  );

  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedTeller || !selectedCurrency) {
      showMessage(t("errorCompleteAllFields"), "error");
      return;
    }
    if (usePayment && totalBalance <= 0) {
      showMessage(t("errorInitialBalanceZero"), "error");
      return;
    }
    if (!user) {
      showMessage(t("errorInvalidUserToken"), "error");
      return;
    }

    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      const selectedShiftObj = shifts.find((s) => s.shift_cd === selectedShift);
      const shiftName = selectedShiftObj ? selectedShiftObj.shift_nm : "";

      const payload = {
        unit_cd: user.unit_cd,
        company_cd: user.company_cd,
        branch_cd: user.branch_cd,
        teller_cd: selectedTeller,
        shift_cd: selectedShift,
        shift_nm: shiftName,
        date: today,
        currency_cd: selectedCurrency,
        cashier_id: user.user_id,
        cashier_nm: user.name,
        is_cash_rcv: usePayment ? 1 : 0,
        details: [],
      };

      if (usePayment) {
        payload.details = Object.entries(denomCounts)
          .filter(([_, count]) => count > 0)
          .map(([value, count]) => ({
            money_denom_value: value,
            begin_money_cnt: count,
          }));
      }

      const response = await saveSOD(payload);

      console.log("API Response:", response);
      showMessage(t("successSodSaved"), "success");
      setTimeout(() => navigate("/pos"), 1500);
    } catch (error) {
      console.error("❌ Error during Start of Day process:", error);

      const errorMessage =
        error.response?.data?.message || error.message || t("errorSavingData");

      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};
