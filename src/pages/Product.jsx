import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";
import { getProducts, getBomProducts } from "../services/product";
import {
  getToppings,
  getToppingsStock,
  getBomToppings,
} from "../services/topping";
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

  // New States for BOM Products
  const [bomProducts, setBomProducts] = useState([]);
  const [bomProductSearchTerm, setBomProductSearchTerm] = useState("");
  const [debouncedBomProductSearch] = useDebounce(bomProductSearchTerm, 300);
  const [bomProductSortConfig, setBomProductSortConfig] = useState({
    key: "product_nm",
    direction: "ascending",
  });
  const [bomProductCurrentPage, setBomProductCurrentPage] = useState(1);
  const [activeProductTab, setActiveProductTab] = useState("product");

  const [toppings, setToppings] = useState([]);
  const [toppingSearchTerm, setToppingSearchTerm] = useState("");
  const [debouncedToppingSearch] = useDebounce(toppingSearchTerm, 300);
  const [toppingSortConfig, setToppingSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const [toppingCurrentPage, setToppingCurrentPage] = useState(1);

  // New States for Topping Stock
  const [toppingsStock, setToppingsStock] = useState([]);
  const [toppingStockSearchTerm, setToppingStockSearchTerm] = useState("");
  const [debouncedToppingStockSearch] = useDebounce(
    toppingStockSearchTerm,
    300
  );
  const [toppingStockSortConfig, setToppingStockSortConfig] = useState({
    key: "product_nm",
    direction: "ascending",
  });
  const [toppingStockCurrentPage, setToppingStockCurrentPage] = useState(1);

  // New States for BOM Topping
  const [bomToppings, setBomToppings] = useState([]);
  const [bomToppingSearchTerm, setBomToppingSearchTerm] = useState("");
  const [debouncedBomToppingSearch] = useDebounce(bomToppingSearchTerm, 300);
  const [bomToppingSortConfig, setBomToppingSortConfig] = useState({
    key: "product_nm",
    direction: "ascending",
  });
  const [bomToppingCurrentPage, setBomToppingCurrentPage] = useState(1);

  const [activeTab, setActiveTab] = useState("toppingStock");

  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) return;
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Products (Data Induk yang lengkap)
        const productData = await getProducts(
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );

        // Kita simpan hasil mapping ini ke variabel agar bisa dipakai oleh BOM logic di bawah
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

        // 2. Fetch BOM Products
        const bomProductData = await getBomProducts(
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );

        const rawBomList = bomProductData.data || [];

        const mappedBomProducts = rawBomList.map((item, index) => {
          // FIX: Cari data induk dari mappedProducts yang sudah kita ambil sebelumnya
          // Ini berguna untuk mengambil Category/Group jika di API BOM datanya null
          const parentInfo = mappedProducts.find(
            (p) => p.id === item.product_cd
          );

          const materialName = item.bom_detail?.material_name || "-";
          // Pastikan ID benar-benar unik kombinasi product + material + index
          const safeMaterialName = materialName.replace(/\s+/g, "");
          const uniqueId = `${item.product_cd}_${safeMaterialName}_${index}`;

          return {
            id: uniqueId,
            product_cd: item.product_cd,
            product_nm: item.product_nm,
            price: item.price,
            is_bom: item.is_bom,

            // FIX: Prioritaskan data dari API, jika null ambil dari parentInfo (product biasa)
            group_name:
              item.group?.product_grp_desc || parentInfo?.category || "-",
            subgroup_name:
              item.subGroup?.product_subgrp_desc ||
              parentInfo?.subCategory ||
              "-",

            in_qty: item.stock?.in_qty ?? 0,
            out_qty: item.stock?.out_qty ?? 0,
            ending_qty: item.stock?.ending_qty ?? 0,

            // Mapping Detail BOM sesuai JSON
            material_name: materialName,
            qty_bom: item.bom_detail?.qty_bom ?? 0,
            unit_bom_code: item.bom_detail?.unit_bom_code || "-",
            unit_bom: item.bom_detail?.unit_bom || 0,
          };
        });

        console.log("Mapped BOM items:", mappedBomProducts);
        setBomProducts(mappedBomProducts);

        // 3. Fetch Toppings
        const toppingData = await getToppings(
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );
        const mappedToppings = toppingData.map((item) => {
          // Gunakan mappedProducts yang ada di scope ini
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

        // 4. Fetch Toppings Stock
        const toppingStockResponse = await getToppingsStock(
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );
        const toppingStockData = toppingStockResponse.data || [];
        const mappedToppingsStock = toppingStockData.map((item) => ({
          id: `${item.product_cd}-${item.topping_cd}`,
          product_nm: item.product_nm,
          topping_nm: item.topping_nm,
          price: item.price,
          in_qty: item.stock?.in_qty ?? 0,
          out_qty: item.stock?.out_qty ?? 0,
          ending_qty: item.stock?.ending_qty ?? 0,
        }));
        setToppingsStock(mappedToppingsStock);

        // 5. Fetch Bom Toppings
        const bomToppingResponse = await getBomToppings(
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );
        const bomToppingData = bomToppingResponse.data || [];
        const mappedBomToppings = bomToppingData.map((item) => ({
          id: `${item.product_cd}-${item.topping_cd}`,
          product_nm: item.product_nm,
          topping_nm: item.topping_nm,
          price: item.price,
          in_qty: item.stock?.in_qty ?? 0,
          out_qty: item.stock?.out_qty ?? 0,
          ending_qty: item.stock?.ending_qty ?? 0,
          qty_bom: item.bom_detail?.qty_bom ?? 0,
          unit_bom_code: item.bom_detail?.unit_bom_code ?? "",
        }));
        setBomToppings(mappedBomToppings);
      } catch (err) {
        console.error(t("failed_to_fetch_data"), err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]); // Removed t dependency to prevent unnecessary re-renders

  const bomProductColumns = useMemo(
    () => [
      { header: "Product Code", accessor: "product_cd", sortable: true },
      { header: "Product Name", accessor: "product_nm", sortable: true },
      {
        header: "Price",
        accessor: "price",
        sortable: true,
        render: (p) => p.price.toLocaleString(),
      },
      {
        header: "Is BOM",
        accessor: "is_bom",
        sortable: true,
        render: (p) => (p.is_bom ? "Yes" : "No"),
      },
      { header: "Group", accessor: "group_name", sortable: true },
      { header: "SubGroup", accessor: "subgroup_name", sortable: true },
      { header: "In Qty", accessor: "in_qty", sortable: true },
      { header: "Out Qty", accessor: "out_qty", sortable: true },
      { header: "Ending Qty", accessor: "ending_qty", sortable: true },
      { header: "Material Name", accessor: "material_name", sortable: true },
      { header: "BOM Qty", accessor: "qty_bom", sortable: true },
      { header: "Unit BOM Code", accessor: "unit_bom_code", sortable: true },
      { header: "Unit BOM", accessor: "unit_bom", sortable: true },
    ],
    []
  );

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

  const toppingStockColumns = useMemo(
    () => [
      { header: "Product Name", accessor: "product_nm", sortable: true },
      { header: "Topping Name", accessor: "topping_nm", sortable: true },
      {
        header: "Price",
        accessor: "price",
        sortable: true,
        render: (p) => p.price.toLocaleString(),
      },
      { header: "In Qty", accessor: "in_qty", sortable: true },
      { header: "Out Qty", accessor: "out_qty", sortable: true },
      { header: "Ending Qty", accessor: "ending_qty", sortable: true },
    ],
    []
  );

  const bomToppingColumns = useMemo(
    () => [
      { header: "Product Name", accessor: "product_nm", sortable: true },
      { header: "Topping Name", accessor: "topping_nm", sortable: true },
      {
        header: "Price",
        accessor: "price",
        sortable: true,
        render: (p) => p.price.toLocaleString(),
      },
      { header: "In Qty", accessor: "in_qty", sortable: true },
      { header: "Out Qty", accessor: "out_qty", sortable: true },
      { header: "Ending Qty", accessor: "ending_qty", sortable: true },
      { header: "BOM Qty", accessor: "qty_bom", sortable: true },
      { header: "Unit BOM", accessor: "unit_bom_code", sortable: true },
    ],
    []
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

  const processedBomProducts = useMemo(() => {
    let sortedItems = [...bomProducts];
    sortedItems = sortedItems.filter(
      (p) =>
        p.product_nm
          .toLowerCase()
          .includes(debouncedBomProductSearch.toLowerCase()) ||
        p.product_cd
          .toLowerCase()
          .includes(debouncedBomProductSearch.toLowerCase())
    );
    if (bomProductSortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[bomProductSortConfig.key] < b[bomProductSortConfig.key]) {
          return bomProductSortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[bomProductSortConfig.key] > b[bomProductSortConfig.key]) {
          return bomProductSortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedItems;
  }, [bomProducts, debouncedBomProductSearch, bomProductSortConfig]);

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

  const processedToppingsStock = useMemo(() => {
    let sortedItems = [...toppingsStock];
    sortedItems = sortedItems.filter(
      (t) =>
        t.product_nm
          .toLowerCase()
          .includes(debouncedToppingStockSearch.toLowerCase()) ||
        t.topping_nm
          .toLowerCase()
          .includes(debouncedToppingStockSearch.toLowerCase())
    );
    if (toppingStockSortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[toppingStockSortConfig.key] < b[toppingStockSortConfig.key]) {
          return toppingStockSortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[toppingStockSortConfig.key] > b[toppingStockSortConfig.key]) {
          return toppingStockSortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedItems;
  }, [toppingsStock, debouncedToppingStockSearch, toppingStockSortConfig]);

  const processedBomToppings = useMemo(() => {
    let sortedItems = [...bomToppings];
    sortedItems = sortedItems.filter(
      (t) =>
        t.product_nm
          .toLowerCase()
          .includes(debouncedBomToppingSearch.toLowerCase()) ||
        t.topping_nm
          .toLowerCase()
          .includes(debouncedBomToppingSearch.toLowerCase())
    );
    if (bomToppingSortConfig.key !== null) {
      sortedItems.sort((a, b) => {
        if (a[bomToppingSortConfig.key] < b[bomToppingSortConfig.key]) {
          return bomToppingSortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[bomToppingSortConfig.key] > b[bomToppingSortConfig.key]) {
          return bomToppingSortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedItems;
  }, [bomToppings, debouncedBomToppingSearch, bomToppingSortConfig]);

  const paginatedProducts = processedProducts.slice(
    (productCurrentPage - 1) * itemsPerPage,
    productCurrentPage * itemsPerPage
  );
  const productTotalPages = Math.ceil(processedProducts.length / itemsPerPage);

  const paginatedBomProducts = processedBomProducts.slice(
    (bomProductCurrentPage - 1) * itemsPerPage,
    bomProductCurrentPage * itemsPerPage
  );
  const bomProductTotalPages = Math.ceil(
    processedBomProducts.length / itemsPerPage
  );

  const paginatedToppings = processedToppings.slice(
    (toppingCurrentPage - 1) * itemsPerPage,
    toppingCurrentPage * itemsPerPage
  );
  const toppingTotalPages = Math.ceil(processedToppings.length / itemsPerPage);

  const paginatedToppingsStock = processedToppingsStock.slice(
    (toppingStockCurrentPage - 1) * itemsPerPage,
    toppingStockCurrentPage * itemsPerPage
  );
  const toppingStockTotalPages = Math.ceil(
    processedToppingsStock.length / itemsPerPage
  );

  const paginatedBomToppings = processedBomToppings.slice(
    (bomToppingCurrentPage - 1) * itemsPerPage,
    bomToppingCurrentPage * itemsPerPage
  );
  const bomToppingTotalPages = Math.ceil(
    processedBomToppings.length / itemsPerPage
  );

  return (
    <div className="p-4 md:p-6 space-y-8 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeProductTab === "product"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveProductTab("product")}
          >
            Product List
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeProductTab === "bomProduct"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveProductTab("bomProduct")}
          >
            BOM Product List
          </button>
        </div>

        {activeProductTab === "product" && (
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
        )}

        {activeProductTab === "bomProduct" && (
          <DataTable
            title="BOM Product List"
            columns={bomProductColumns}
            data={paginatedBomProducts}
            isLoading={isLoading}
            searchPlaceholder="Search BOM products..."
            searchValue={bomProductSearchTerm}
            onSearchChange={(e) => {
              setBomProductSearchTerm(e.target.value);
              setBomProductCurrentPage(1);
            }}
            sortConfig={bomProductSortConfig}
            onSort={(key) =>
              requestSort(key, bomProductSortConfig, setBomProductSortConfig)
            }
            pagination={{
              currentPage: bomProductCurrentPage,
              totalPages: bomProductTotalPages,
              onPageChange: setBomProductCurrentPage,
            }}
          />
        )}
      </div>

      {/* Tabs and New Tables */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === "toppingStock"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("toppingStock")}
          >
            Topping Stock
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === "bomTopping"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("bomTopping")}
          >
            BOM Topping
          </button>
        </div>

        {activeTab === "toppingStock" && (
          <DataTable
            title="Topping Stock"
            columns={toppingStockColumns}
            data={paginatedToppingsStock}
            isLoading={isLoading}
            searchPlaceholder="Search topping stock..."
            searchValue={toppingStockSearchTerm}
            onSearchChange={(e) => {
              setToppingStockSearchTerm(e.target.value);
              setToppingStockCurrentPage(1);
            }}
            sortConfig={toppingStockSortConfig}
            onSort={(key) =>
              requestSort(
                key,
                toppingStockSortConfig,
                setToppingStockSortConfig
              )
            }
            pagination={{
              currentPage: toppingStockCurrentPage,
              totalPages: toppingStockTotalPages,
              onPageChange: setToppingStockCurrentPage,
            }}
          />
        )}

        {activeTab === "bomTopping" && (
          <DataTable
            title="BOM Topping"
            columns={bomToppingColumns}
            data={paginatedBomToppings}
            isLoading={isLoading}
            searchPlaceholder="Search BOM topping..."
            searchValue={bomToppingSearchTerm}
            onSearchChange={(e) => {
              setBomToppingSearchTerm(e.target.value);
              setBomToppingCurrentPage(1);
            }}
            sortConfig={bomToppingSortConfig}
            onSort={(key) =>
              requestSort(key, bomToppingSortConfig, setBomToppingSortConfig)
            }
            pagination={{
              currentPage: bomToppingCurrentPage,
              totalPages: bomToppingTotalPages,
              onPageChange: setBomToppingCurrentPage,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
