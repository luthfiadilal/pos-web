import React, { useState, useMemo, useContext, useRef } from "react";
import { Icon } from "@iconify/react";
import { useDebounce } from "use-debounce";
import { OfflineContext } from "../../contexts/OfflineContext";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import ProductListSkeleton from "../skeleton/ProductListSkeleton";

const ProductCard = React.memo(({ item, isOnline, onProductClick, isLCP }) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => {
        if (item && !item.isSoldOut && isOnline) {
          onProductClick(item);
        }
      }}
      className={`relative bg-white rounded-2xl shadow-sm transition-all duration-300 border cursor-pointer overflow-hidden h-full flex flex-col
    ${
      !item || !isOnline || item.isSoldOut
        ? "opacity-50 pointer-events-none"
        : "hover:shadow-lg"
    }
  `}
    >
      {item ? (
        <>
          {/* Sold Out Overlay */}
          {(!isOnline || item.isSoldOut) && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-bold z-10">
              {t("soldOut")}
            </div>
          )}

          {/* Discount Badge */}
          {item.discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-20">
              {t("discountLabel", { discount: item.discount })}
            </span>
          )}

          {/* Topping Icon */}
          {item.hasToppings && (
            <span
              className="absolute top-2 right-2 bg-yellow-400 text-white text-sm p-1 rounded-full flex items-center justify-center z-15"
              title={t("tooltipHasTopping")}
            >
              <Icon
                icon="solar:chef-hat-minimalistic-broken"
                className="w-4 h-4"
              />
            </span>
          )}

          {/* Product Image */}
          <div className="p-1">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-32 object-cover rounded-xl"
                fetchPriority={isLCP ? "high" : "auto"}
              />
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-gray-200 text-gray-500 text-sm rounded-xl">
                {t("noImage")}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="px-2 py-2 text-left flex-grow flex flex-col">
            <div>
              <h3
                className="font-semibold text-xs text-gray-800 truncate"
                title={item.name}
              >
                {item.name}
              </h3>
              <p className="text-xs text-gray-500">
                {t("stockLabel")}{" "}
                {item.stock !== undefined ? item.stock : "N/A"}
              </p>
            </div>
            <p className="text-center bg-gray-200 text-black rounded-xl px-2 py-1 font-semibold text-xs mt-1">
              {item.discount > 0 ? (
                <>
                  <span className="line-through text-gray-400 mr-1">
                    Rp {item.price.toLocaleString()}
                  </span>
                  Rp{" "}
                  {Math.round(
                    item.price * (1 - item.discount / 100)
                  ).toLocaleString()}
                </>
              ) : (
                <>Rp {item.price.toLocaleString()}</>
              )}
            </p>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-transparent"></div>
      )}
    </div>
  );
});

const useResponsiveColumnCount = () => {
  const [columnCount, setColumnCount] = useState(4);
  React.useEffect(() => {
    const getColumnCount = (width) => {
      if (width < 640) return 2;
      if (width < 768) return 3;
      if (width < 1024) return 3;
      return 4;
    };
    const handleResize = () =>
      setColumnCount(getColumnCount(window.innerWidth));
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return columnCount;
};

const VirtualizedProductGrid = ({ products, isOnline, onProductClick }) => {
  const parentRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const columnCount = useResponsiveColumnCount();
  const rowCount = Math.ceil(products.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
  });

  const handleScroll = () => {
    const el = parentRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setIsAtTop(scrollTop === 0);
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
  };

  return (
    <div className="relative h-full">
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto custom-scrollbar"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columnCount;
            const items = products.slice(startIndex, startIndex + columnCount);

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 p-1`}
              >
                {items.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    isOnline={isOnline}
                    onProductClick={onProductClick}
                    isLCP={startIndex + index < 4}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {!isAtTop && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/10 to-transparent" />
      )}

      {!isAtBottom && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent" />
      )}
    </div>
  );
};

const ProductList = ({ products, onProductClick, loading }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const { isOnline } = useContext(OfflineContext);

  const filteredBySearch = useMemo(() => {
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    if (!lowercasedTerm) {
      return products;
    }
    return products.filter((item) =>
      item.name.toLowerCase().includes(lowercasedTerm)
    );
  }, [products, debouncedSearchTerm]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-1 flex-shrink-0">
        {loading ? (
          <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        ) : (
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Icon icon="mdi:magnify" className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder={t("placeholderSearchProduct")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="flex-grow min-h-0">
        {loading ? (
          <ProductListSkeleton count={12} />
        ) : filteredBySearch.length > 0 ? (
          <VirtualizedProductGrid
            products={filteredBySearch}
            isOnline={isOnline}
            onProductClick={onProductClick}
          />
        ) : (
          <div className="col-span-full text-center py-10 text-sm text-gray-500">
            {t("productNotFound")}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProductList);
