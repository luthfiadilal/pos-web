import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isDualDisplayEnabled, setIsDualDisplayEnabled } = useSettings();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleChangeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setUsernameError("");
    setPasswordError("");

    let hasError = false;

    if (username.trim() === "") {
      setUsernameError(t("username_required"));
      hasError = true;
    }

    if (password.trim() === "") {
      setPasswordError(t("password_required"));
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      const res = await login(username, password);

      const bizType = res.data.compBizType.comp_biz_type;

      if (bizType === "10002") {
        // Tipe Resto
        navigate("/table");
      } else {
        // Tipe Cafe
        navigate("/pos");
      }
    } catch (err) {
      setError(err?.response?.data?.message || t("login_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      <div className="w-7/12 bg-[url('/images/Login.png')] bg-cover bg-center bg-no-repeat"></div>

      <div className="w-5/12 flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center  gap-2">
            {/* <Icon
              icon="solar:pos-terminal-bold-duotone"
              className="text-3xl text-blue-600"
            /> */}

            <img
              src="/images/logo/poslogoepos.png"
              alt="EasyPOS Logo"
              className="h-[200px] w-auto"
            />
          </div>

          {/* Language */}
          <div className="flex justify-center mb-4 gap-3">
            {[
              {
                code: "id",
                src: "/images/flags/indonesia.png",
                alt: t("indonesia"),
              },
              { code: "en", src: "/images/flags/us.png", alt: t("english") },
              { code: "ko", src: "/images/flags/kr.png", alt: t("korean") },
            ].map(({ code, src, alt }) => (
              <button
                key={code}
                onClick={() => handleChangeLanguage(code)}
                className={`p-1 rounded-md border ${
                  i18n.language === code
                    ? "border-blue-600 ring-2 ring-blue-300"
                    : "border-gray-300"
                } hover:ring-2 hover:ring-blue-200 transition`}
              >
                <img
                  src={src}
                  alt={alt}
                  className="w-12 h-10 object-cover rounded"
                />
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5 mb-20">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("username")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 border bg-slate-50 rounded-lg focus:outline-none focus:ring-2 transition ${
                    usernameError
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-300 focus:ring-blue-400 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                />
                <Icon
                  icon="solar:user-linear"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                />
              </div>
              {usernameError && (
                <p className="text-red-500 text-sm mt-1.5">{usernameError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 border bg-slate-50 rounded-lg focus:outline-none focus:ring-2 transition ${
                    passwordError
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-300 focus:ring-blue-400 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                />
                <Icon
                  icon="solar:lock-linear"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                />
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1.5">{passwordError}</p>
              )}
            </div>

            {error && (
              <p className="text-red-700 text-sm text-center bg-red-100 p-3 rounded-md">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <label
                htmlFor="dual-display-toggle"
                className="flex items-center justify-between w-full cursor-pointer select-none"
              >
                <span className="text-sm font-medium text-slate-700">
                  {t("dual_display_mode")}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="dual-display-toggle"
                    className="sr-only peer"
                    checked={isDualDisplayEnabled}
                    onChange={() =>
                      setIsDualDisplayEnabled(!isDualDisplayEnabled)
                    }
                  />
                  <div className="block bg-gray-300 peer-checked:bg-blue-600 w-14 h-8 rounded-full transition-colors"></div>
                  <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
              }`}
            >
              {isLoading ? (
                <>
                  <Icon icon="eos-icons:loading" className="text-xl" />
                  {t("loading")}
                </>
              ) : (
                <>
                  <Icon icon="solar:login-3-line-duotone" className="text-xl" />
                  {t("login")}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
