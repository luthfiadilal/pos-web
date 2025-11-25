import apiClient from "./apiClient";

export const registAccountPayout = async (payloadRegistPayout) => {
  try {
    const response = await apiClient.post(
      "/pos/nicepay/create-payout",
      payloadRegistPayout
    );
    return response;
  } catch (error) {
    console.error("Error in registAccountPayout service:", error);
    throw error;
  }
};

export const approvePayout = async (
  originalReferenceNo,
  originalPartnerReferenceNo
) => {
  try {
    const response = await apiClient.post(
      "/pos/nicepay/approve-payout",
      { originalReferenceNo, originalPartnerReferenceNo }
    );
    return response;
  } catch (error) {
    console.error("Error in approvePayout service:", error);
    throw error;
  }
};
