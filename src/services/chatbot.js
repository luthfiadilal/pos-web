import apiClient from "./apiClient";

export const askChatbot = (question, user) => {
  const { unit_cd, company_cd, branch_cd } = user;
  return apiClient.post(
    "/pos/chatbot",
    { question },
    {
      params: { unit_cd, company_cd, branch_cd },
    }
  );
};