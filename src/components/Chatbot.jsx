import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useLayout } from "../contexts/LayoutContext";
import { askChatbot } from "../services/chatbot";

const Chatbot = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isChatbotOpen, setChatbotOpen } = useLayout();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleChat = () => {
    setChatbotOpen(!isChatbotOpen);
    if (!isChatbotOpen && messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: t("chatbot.greeting"),
        },
      ]);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askChatbot(input, user);
      const botMessage = {
        sender: "bot",
        text: response.answer || t("chatbot.understandingError"),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage = {
        sender: "bot",
        text: t("chatbot.connectionError"),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-50"
        aria-label={t("chatbot.toggleChat")}
      >
        <Icon icon="fluent:chat-sparkle-20-regular" width="24" height="24" />
      </button>

      {isChatbotOpen &&
        ReactDOM.createPortal(
          <div className="fixed bottom-24 right-8 w-96 h-[32rem] bg-white rounded-2xl shadow-xl flex flex-col z-50">
            <div className="bg-blue-600 text-white p-4 rounded-t-2xl shadow-md flex-shrink-0">
              <h3 className="flex gap-2 text-lg font-semibold">
                {" "}
                <Icon
                  icon="fluent:chat-sparkle-24-filled"
                  width="24"
                  height="24"
                />
                {t("chatbot.chatAssistant")}
              </h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 pt-0.5 pb-1 max-w-xs shadow-md ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
                    <Icon
                      icon="eos-icons:three-dots-loading"
                      width="24"
                      height="24"
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-2 border-t bg-gray-100 rounded-b-2xl"
            >
              <div className="flex">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={t("chatbot.placeholder")}
                  className="flex-1 rounded-l-xl p-2 border-t mr-0 border-b border-l text-gray-800 border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="px-4 rounded-r-xl bg-blue-600 text-white font-bold p-2 uppercase border-blue-600 border-t border-b border-r hover:bg-blue-700"
                  disabled={isLoading}
                  aria-label={t("chatbot.send")}
                >
                  <Icon icon="fluent:send-28-filled" width="24" height="24" />
                </button>
              </div>
            </form>
          </div>,
          document.getElementById("chatbot-root")
        )}
    </>
  );
};

export default Chatbot;
