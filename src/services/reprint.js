import apiClient from "./apiClient";

export const reprintTransaction = async (reprintData) => {
  try {
    const response = await apiClient.post("/pos/reprint", reprintData);
    return response;
  } catch (error) {
    console.error("Error in reprintTransaction service:", error);
    throw error;
  }
};
