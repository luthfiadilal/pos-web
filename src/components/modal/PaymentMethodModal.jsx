import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

const PaymentButton = React.memo(({ method, onClick, isLoading }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="w-full flex items-center gap-3 justify-center border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition disabled:opacity-50"
  >
    <Icon icon={method.icon} className={`${method.color} text-2xl`} />
    <span className="font-medium text-gray-700">{method.label}</span>
  </button>
));

const PaymentMethodModal = ({
  onClose,
  onSelectCash,
  onSelectDebit,
  onSelectDigital,
  isLoading,
  cart,
  cartTotals,
  memberData,
  pointsToUse,
}) => {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState({});

  const paymentMethods = [
    {
      id: "cash",
      label: t("payment.paymentMethods.cash"),
      icon: "solar:money-bag-linear",
      color: "text-green-600",
      type: "select",
    },
    {
      id: "debit",
      label: t("payment.paymentMethods.debit"),
      icon: "solar:card-linear",
      color: "text-yellow-500",
      type: "select",
    },
    { type: "divider" },
    {
      id: "digital",
      label: t("payment.paymentMethods.digital"),
      icon: "solar:qr-code-linear",
      color: "text-purple-600",
      type: "gateway",
    },
  ];

  const transformCartForCheckout = (cart) => {
    return cart.map((item) => {
      const transformed = {
        product_cd: item.product_cd,
        product_nm: item.name,
        price: item.price,
        quantity: item.qty,
      };

      const toppingsSet = new Map();

      if (Array.isArray(item.selectedToppings)) {
        item.selectedToppings.forEach((list) => {
          if (Array.isArray(list)) {
            list.forEach((name) => {
              if (!name || name === t("noTopping")) return;

              const toppingDetail = item.availableToppings?.find(
                (t) => t.topping_nm === name
              );

              if (toppingDetail && !toppingsSet.has(toppingDetail.topping_cd)) {
                toppingsSet.set(toppingDetail.topping_cd, {
                  topping_cd: String(toppingDetail.topping_cd ?? ""),
                  topping_nm: String(toppingDetail.topping_nm ?? ""),
                  price: Number(
                    toppingDetail.toppingPrices?.[0]?.basic_sales_price ?? 0
                  ),
                });
              }
            });
          }
        });
      }

      if (toppingsSet.size > 0) {
        transformed.toppings = Array.from(toppingsSet.values());
      }

      return transformed;
    });
  };

  const toggleDetails = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getToppingDetails = (item) => {
    if (!Array.isArray(item.selectedToppings)) return [];

    const summary = {};

    item.selectedToppings.forEach((toppingList) => {
      if (!Array.isArray(toppingList)) return;

      toppingList.forEach((name) => {
        if (!name || name === t("noTopping")) return;

        if (!summary[name]) {
          const toppingDetail = item.availableToppings?.find(
            (t) => t.topping_nm === name
          );
          const price =
            toppingDetail?.toppingPrices?.[0]?.basic_sales_price || 0;
          summary[name] = { count: 1, price };
        } else {
          summary[name].count += 1;
        }
      });
    });

    return Object.entries(summary);
  };

  const getToppingDetailsFormatted = (item) => {
    if (!item.selectedToppings || !Array.isArray(item.selectedToppings))
      return [];

    const summary = {};
    const lines = [];

    item.selectedToppings.forEach((list, index) => {
      if (!Array.isArray(list)) return;

      lines.push(t("itemNumber", { number: index + 1 }));

      list.forEach((name) => {
        if (!name || name === t("noTopping")) return;

        summary[name] = (summary[name] || 0) + 1;

        const toppingDetail = item.availableToppings.find(
          (t) => t.topping_nm === name
        );
        const price = toppingDetail?.toppingPrices?.[0]?.basic_sales_price || 0;

        lines.push(`+ ${name.padEnd(10)} Rp ${price.toLocaleString()}`);
      });
    });

    // const summaryLines = Object.entries(summary).map(
    //   ([name, count]) => `${count}x ${name}`
    // );
    return [...lines];
  };

  const handleClick = (method) => {
    if (isLoading) return;

    const transformedCart = transformCartForCheckout(cart);

    if (method.type === "select") {
      if (method.id === "cash") onSelectCash(transformedCart);
      if (method.id === "debit") onSelectDebit(transformedCart);
    } else if (method.type === "gateway") {
      onSelectDigital(transformedCart);
    }
  };

  const pointsDiscountAmount = (pointsToUse || 0) * 1000;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <Icon
            icon="solar:wallet-bold-duotone"
            className="text-blue-600 text-5xl mx-auto mb-2"
          />
          <h3 className="text-2xl font-bold text-gray-800">
            {t("payment.title")}
          </h3>
        </div>

        <div className="mt-6 md:flex md:gap-8" style={{ maxHeight: "65vh" }}>
          {/* Left Side: Order Summary */}
          <div className="md:w-1/2 bg-gray-50 rounded-lg p-4 border text-left mb-6 md:mb-0 flex flex-col">
            <h4 className="font-semibold mb-3 text-gray-700">
              {t("payment.orderSummary")}
            </h4>
            <div className="flex-grow overflow-y-auto space-y-2 text-sm pr-2">
              {cart?.map((item, index) => {
                const toppingDetails = getToppingDetails(item);
                const lines = getToppingDetailsFormatted(item);

                return (
                  <div key={index} className="pb-2 border-b last:border-b-0">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                      <div className="text-gray-800 font-medium">
                        {item.qty}x {item.name}
                      </div>
                      <div className="text-right text-gray-500">
                        Rp {item.price.toLocaleString()}
                      </div>
                      <div className="text-right font-semibold text-gray-900">
                        Rp {(item.price * item.qty).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-1 space-y-1 text-xs">
                      {toppingDetails.map(([name, detail]) => (
                        <div
                          key={name}
                          className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center"
                        >
                          <div className="text-gray-600">
                            {detail.count}x {name}
                          </div>
                          <div className="text-right text-gray-500">
                            Rp {detail.price.toLocaleString()}
                          </div>
                          <div className="text-right text-gray-600">
                            Rp {(detail.count * detail.price).toLocaleString()}
                          </div>
                        </div>
                      ))}

                      {toppingDetails.length > 0 && (
                        <>
                          <button
                            className="mt-1 px-2 py-1 text-blue-600 rounded transition"
                            onClick={() => toggleDetails(index)}
                          >
                            {expandedItems[index]
                              ? t("hideDetails")
                              : t("showDetails")}
                          </button>

                          {expandedItems[index] && (
                            <div className="mt-1 space-y-1 text-gray-600 ">
                              {lines.map((line, i) => (
                                <div
                                  key={i}
                                  className={`pl-4 ${
                                    line.startsWith("item")
                                      ? "text-gray-800 font-medium"
                                      : ""
                                  }`}
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto pt-4 border-t">
              {cartTotals && (
                <div className="flex justify-between items-center font-bold text-lg">
                  <span className="text-gray-800">
                    {t("payment.totalPrice")}
                  </span>
                  <span className="text-blue-600">
                    Rp {cartTotals.subtotal.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Payment Options */}
          <div className="md:w-1/2">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              {cartTotals && (
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span>{t("payment.tax_pb1")}</span>
                    <span className="font-medium text-gray-800">
                      Rp {cartTotals.totalPb1.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("payment.tax_ppn")}</span>
                    <span className="font-medium text-gray-800">
                      Rp {cartTotals.totalPpn.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("payment.serviceCharge")}</span>
                    <span className="font-medium text-gray-800">
                      Rp {cartTotals.totalService.toLocaleString()}
                    </span>
                  </div>
                  {memberData && pointsToUse > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        {t("payment.memberDiscount", { pointsToUse })}
                      </span>
                      <span className="font-medium">
                        -Rp {pointsDiscountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <hr className="my-3" />
              <div className="flex justify-between items-center font-bold text-xl">
                <span className="text-gray-800">{t("payment.totalDue")}</span>
                <span className="text-blue-600">
                  Rp{" "}
                  {(
                    (cartTotals?.grandTotal || 0) - pointsDiscountAmount
                  ).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4 text-center md:text-left">
              {t("payment.choosePaymentMethod")}
            </p>
            <div className="space-y-3">
              {paymentMethods.map((method, index) =>
                method.type === "divider" ? (
                  <hr key={`divider-${index}`} />
                ) : (
                  <PaymentButton
                    key={method.id}
                    method={method}
                    onClick={() => handleClick(method)}
                    isLoading={isLoading}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <button onClick={onClose} disabled={isLoading} className="mt-8">
          {t("cancel")}
        </button>
      </div>
    </div>
  );
};

export default React.memo(PaymentMethodModal);
