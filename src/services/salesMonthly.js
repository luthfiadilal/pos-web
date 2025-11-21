import apiClient from "./apiClient";

export const getMonthlySales = (unit_cd, company_cd, branch_cd) => {
  return apiClient.get("/pos/getSalesMonthly", {
    params: { unit_cd, company_cd, branch_cd },
  });
};
