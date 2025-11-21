import React from "react";
import { useTranslation } from "react-i18next";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const GuestSummaryChart = ({ guestData, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md flex-1">
        <h3 className="text-md font-semibold text-gray-700">
          {t("guest_summary_today")}
        </h3>
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">{t("loading_data")}</p>
        </div>
      </div>
    );
  }

  if (!guestData || guestData.total === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md flex-1">
        <h3 className="text-md font-semibold text-gray-700">{t("summary")}</h3>
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">{t("no_guest_data_yet")}</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: [t("men"), t("women")],
    datasets: [
      {
        label: t("number_of_guests"),
        data: [guestData.men, guestData.women],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: t("total_guests_chart", { count: guestData.total }),
        position: "top",
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex-1">
      <h3 className="text-md font-semibold text-gray-700 mb-2">
        {t("guest_summary")}
      </h3>
      <div className="relative h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default GuestSummaryChart;
