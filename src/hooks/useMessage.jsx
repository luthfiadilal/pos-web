import { useState } from "react";

export const useMessage = () => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  const showMessage = (msg, msgType = "success") => {
    setMessage(msg);
    setType(msgType);
  };

  const hideMessage = () => {
    setMessage("");
    setType("");
  };

  return {
    message,
    type,
    showMessage,
    hideMessage,
  };
};
