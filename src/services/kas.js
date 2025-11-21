import apiClient from "./apiClient";

export const getKas = (unit_cd, company_cd, branch_cd, { date_from, date_to } = {}, token) => {
  return apiClient.get("/kas", {
    params: { unit_cd, company_cd, branch_cd, date_from, date_to },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getKasYesterday = (unit_cd, company_cd, branch_cd, date, token) => {
  return apiClient.get("/kas/yesterday", {
    params: { unit_cd, company_cd, branch_cd, date },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};