import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DataTable from "../common/DataTable";

const formatRupiah = (number) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(number || 0)}`;

const ProductSalesTable = ({ data = [], isLoading }) => {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState({
    key: "total_sales_amount",
    direction: "descending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let sortedItems = [...data];
    if (sortConfig.key) {
      sortedItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedItems;
  }, [data, sortConfig]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage]);

  const columns = [
    { header: t("product_name"), accessor: "product_nm", sortable: true },
    {
      header: t("quantity_sold"),
      accessor: "total_quantity",
      // className: "text-center",
      sortable: true,
    },
    {
      header: t("total_sales"),
      accessor: "total_sales_amount",
      className: "font-semibold",
      sortable: true,
      render: (item) => formatRupiah(item.total_sales_amount),
    },
  ];

  return (
    <DataTable
      title={t("product_sales_this_month")}
      columns={columns}
      data={paginatedData}
      isLoading={isLoading}
      emptyMessage={t("no_product_sales_this_month")}
      sortConfig={sortConfig}
      onSort={requestSort}
      pagination={{
        currentPage,
        totalPages,
        onPageChange: setCurrentPage,
      }}
    />
  );
};

export default ProductSalesTable;
