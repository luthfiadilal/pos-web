import React from "react";
import { useTranslation } from "react-i18next";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProductSalesChart = ({ data = [], isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {t("product_sales_chart")}
        </h3>
        <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center h-96">
          <p className="text-gray-500">{t("loading_chart_data")}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {t("product_sales_chart")}
        </h3>
        <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center h-96">
          <p className="text-gray-500">
            {t("no_product_sales_data_to_display")}
          </p>
        </div>
      </div>
    );
  }

  // Siapkan data untuk grafik
  const chartData = {
    labels: data.map((product) => product.product_nm),
    datasets: [
      {
        label: t("total_sales_rp"),
        data: data.map((product) => product.total_sales_amount),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Konfigurasi opsi untuk grafik
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false, // Judul utama sudah ada di atas container
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        {t("product_sales_chart_this_month")}
      </h3>
      <div className="relative h-96">
        {<Bar options={options} data={chartData} />}
      </div>
    </div>
  );
};

export default ProductSalesChart;
