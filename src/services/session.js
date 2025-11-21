import apiClient from "./apiClient";

export const session = (unit_cd, company_cd, branch_cd, date, user_id) => {
  return apiClient.get("/pos/session", {
    params: {
      // ✨ Tambahkan object 'params' di sini
      unit_cd,
      company_cd,
      branch_cd,
      date,
      user_id,
    },
  });
};
