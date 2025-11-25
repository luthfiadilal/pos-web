import apiClient from "./apiClient";

export const balanceInquiry = async () => {
  try {
    const response = await apiClient.post("/pos/nicepay/balance");
    return response;
  } catch (error) {
    console.error("Error in Balance Inquiry:", error);
    throw error;
  }
};
