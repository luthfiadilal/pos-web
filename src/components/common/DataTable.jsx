import React from "react";
import { Icon } from "@iconify/react";
import TableSkeleton from "../skeleton/TableSkeleton";

const SortIcon = ({ direction }) => {
  if (!direction) return null;
  return (
    <Icon
      icon={
        direction === "ascending"
          ? "solar:arrow-up-bold"
          : "solar:arrow-down-bold"
      }
      className="ml-1 text-gray-600"
    />
  );
};

const DataTable = ({
  title,
  columns,
  data,
  isLoading,
  emptyMessage = "Tidak ada data.",
  searchPlaceholder,
  searchValue,
  onSearchChange,
  sortConfig,
  onSort,
  pagination, 
}) => {
  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      {/* Header: Judul dan Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
        {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
        {onSearchChange && (
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg w-full sm:w-64 border">
            <Icon
              icon="solar:magnifer-linear"
              className="text-gray-500 text-xl"
            />
            <input
              type="text"
              placeholder={searchPlaceholder || "Cari..."}
              className="bg-transparent outline-none w-full"
              value={searchValue}
              onChange={onSearchChange}
            />
          </div>
        )}
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left rounded-xl divide-x">
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  className={`p-3 ${col.className || ""}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort && onSort(col.accessor)}
                      className="flex items-center font-semibold"
                    >
                      {col.header}
                      <SortIcon
                        direction={
                          sortConfig?.key === col.accessor
                            ? sortConfig.direction
                            : null
                        }
                      />
                    </button>
                  ) : (
                    <span className="font-semibold">{col.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {isLoading ? (
            <TableSkeleton cols={columns.length} rows={5} />
          ) : (
            <tbody className="text-gray-700">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-6 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="border-b hover:bg-gray-50 divide-x"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.accessor || col.header}
                        className={`p-3 ${col.className || ""}`}
                      >
                        {col.render ? col.render(item) : item[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          )}
        </table>
      </div>

      {/* Paginasi */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          {/* Tombol Previous */}
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 rounded-md text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>

          {Array.from({ length: pagination.totalPages }).map((_, i) => {
            const page = i + 1;
            if (
              page === 1 || 
              page === pagination.totalPages || 
              (page >= pagination.currentPage - 2 &&
                page <= pagination.currentPage + 2) 
            ) {
              return (
                <button
                  key={i}
                  onClick={() => pagination.onPageChange(page)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    pagination.currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              );
            }

            if (
              page === pagination.currentPage - 3 ||
              page === pagination.currentPage + 3
            ) {
              return (
                <span key={i} className="px-3 py-1">
                  ...
                </span>
              );
            }
            return null;
          })}

          {/* Tombol Next */}
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 rounded-md text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
