import apiClient from "./apiClient";

export const getDailySalesByCashier = (
  unit_cd,
  company_cd,
  branch_cd,
  shift_cd,
  cashier_id
) => {
  return apiClient.get("/pos/sales-daily-by-cashier", {
    params: { unit_cd, company_cd, branch_cd, shift_cd, cashier_id },
  });
};
