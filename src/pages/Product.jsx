import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";
import { getProducts } from "../services/product";
import { getToppings } from "../services/topping";
import { useAuth } from "../contexts/AuthContext";
import DataTable from "../components/common/DataTable";

const ProductManagement = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [debouncedProductSearch] = useDebounce(productSearchTerm, 300);
  const [productSortConfig, setProductSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [toppings, setToppings] = useState([]);
  const [toppingSearchTerm, setToppingSearchTerm] = useState("");
  const [debouncedToppingSearch] = useDebounce(toppingSearchTerm, 300);
  const [toppingSortConfig, setToppingSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const [toppingCurrentPage, setToppingCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) return;
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch Products
        const productData = await getProducts(
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );
        const mappedProducts = productData.map((item) => ({
          id: item.product_cd,
          name: item.product_nm,
          price: item.prices?.[0]?.sales_price || 0,
          category: item.group?.product_grp_desc || "-",
          subCategory: item.subGroup?.product_subgrp_desc || "-",
          stock: item.stock?.ending_qty ?? 0,
          toppings: item.toppings?.map((t) => t.topping_nm) || [],
          is_sold_out: item.is_sold_out,
          is_disc: item.is_disc,
        }));
        setProducts(mappedProducts);

        // Fetch Toppings
        const toppingData = await getToppings(
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );
        const mappedToppings = toppingData.map((item) => {
          const productName =
            mappedProducts.find((p) => p.id === item.product_cd)?.name ||
            item.product_cd;

          return {
            id: `${item.product_cd}-${item.topping_cd}`,
            name: item.topping_nm,
            product_cd: item.product_cd,
            price: item.toppingPrices?.[0]?.sales_price ?? 0,
            is_free: item.is_free,
            productName: productName,
          };
        });
        setToppings(mappedToppings);
      } catch (err) {
        console.error(t("failed_to_fetch_data"), err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const productColumns = useMemo(
    () => [
      { header: t("product.col.name"), accessor: "name", sortable: true },
      {
        header: t("product.col.price"),
        accessor: "price",
        sortable: true,
        render: (p) => p.price.toLocaleString(),
      },
      {
        header: t("product.col.stock"),
        accessor: "stock",
        sortable: true,
        className: "font-medium",
        render: (p) => (
          <span className={p.stock <= 5 ? "text-red-500" : ""}>{p.stock}</span>
        ),
      },
      {
        header: t("product.col.category"),
        accessor: "category",
        sortable: true,
      },
      {
        header: t("product.col.subCategory"),
        accessor: "subCategory",
        sortable: true,
      },
      {
        header: t("product.col.toppings"),
        accessor: "toppings",
        sortable: true,
        render: (p) => p.toppings?.join(", ") || "-",
      },
      {
        header: t("product.col.soldOut"),
        accessor: "is_sold_out",
        sortable: true,
        render: (p) => (p.is_sold_out ? t("yes") : t("no")),
      },
      {
        header: t("product.col.discount"),
        accessor: "is_disc",
        sortable: true,
        render: (p) => (p.is_disc ? t("yes") : t("no")),
      },
    ],
    [t]
  );

  const toppingColumns = useMemo(
    () => [
      { header: t("topping.col.name"), accessor: "name", sortable: true },
      {
        header: t("topping.col.price"),
        accessor: "price",
        sortable: true,
        render: (t) =>
          t.price > 0
            ? t.price.toLocaleString()
            : t.is_free
            ? t("topping.free")
            : "-",
      },
      {
        header: t("topping.col.linkedProduct"),
        accessor: "productName",
        sortable: true,
      },
    ],
    [t]
  );

  const requestSort = (key, config, setConfig) => {
    let direction = "ascending";
    if (config.key === key && config.direction === "ascending") {
      direction = "descending";
    }
    setConfig({ key, direction });
  };

  const processedProducts = useMemo(() => {
    let sortedItems = [...products];
    sortedItems = sortedItems.filter((p) =>
      p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase())
    );
    if (productSortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[productSortConfig.key] < b[productSortConfig.key]) {
          return productSortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[productSortConfig.key] > b[productSortConfig.key]) {
          return productSortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedItems;
  }, [products, debouncedProductSearch, productSortConfig]);

  const processedToppings = useMemo(() => {
    let sortedItems = [...toppings];
    sortedItems = sortedItems.filter((t) =>
      t.name.toLowerCase().includes(debouncedToppingSearch.toLowerCase())
    );
    if (toppingSortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[toppingSortConfig.key] < b[toppingSortConfig.key]) {
          return toppingSortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[toppingSortConfig.key] > b[toppingSortConfig.key]) {
          return toppingSortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedItems;
  }, [toppings, debouncedToppingSearch, toppingSortConfig]);

  const paginatedProducts = processedProducts.slice(
    (productCurrentPage - 1) * itemsPerPage,
    productCurrentPage * itemsPerPage
  );
  const productTotalPages = Math.ceil(processedProducts.length / itemsPerPage);

  const paginatedToppings = processedToppings.slice(
    (toppingCurrentPage - 1) * itemsPerPage,
    toppingCurrentPage * itemsPerPage
  );
  const toppingTotalPages = Math.ceil(processedToppings.length / itemsPerPage);

  return (
    <div className="p-4 md:p-6 space-y-8 bg-gray-100 min-h-screen">
      <DataTable
        title={t("product.title")}
        columns={productColumns}
        data={paginatedProducts}
        isLoading={isLoading}
        searchPlaceholder={t("product.searchPlaceholder")}
        searchValue={productSearchTerm}
        onSearchChange={(e) => {
          setProductSearchTerm(e.target.value);
          setProductCurrentPage(1);
        }}
        sortConfig={productSortConfig}
        onSort={(key) =>
          requestSort(key, productSortConfig, setProductSortConfig)
        }
        pagination={{
          currentPage: productCurrentPage,
          totalPages: productTotalPages,
          onPageChange: setProductCurrentPage,
        }}
      />

      <DataTable
        title={t("topping.title")}
        columns={toppingColumns}
        data={paginatedToppings}
        isLoading={isLoading}
        searchPlaceholder={t("topping.searchPlaceholder")}
        searchValue={toppingSearchTerm}
        onSearchChange={(e) => {
          setToppingSearchTerm(e.target.value);
          setToppingCurrentPage(1);
        }}
        sortConfig={toppingSortConfig}
        onSort={(key) =>
          requestSort(key, toppingSortConfig, setToppingSortConfig)
        }
        pagination={{
          currentPage: toppingCurrentPage,
          totalPages: toppingTotalPages,
          onPageChange: setToppingCurrentPage,
        }}
      />
    </div>
  );
};

export default ProductManagement;
