import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

const ErrorMessage = ({
  message,
  onRetry,
  title = "Oops! Something went wrong",
}) => {
  if (!message) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
