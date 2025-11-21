import apiClient from "./apiClient";

export const closing = (
  unit_cd,
  company_cd,
  branch_cd,
  trans_no,
  counted_end_amount
) => {
  return apiClient.put("/pos/close", {
    unit_cd,
    company_cd,
    branch_cd,
    trans_no,
    counted_end_amount,
  });
};
