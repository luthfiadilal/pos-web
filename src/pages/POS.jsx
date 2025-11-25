import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import io from "socket.io-client";
import { useMessage } from "../hooks/useMessage";
// Hooks
import { useAuth } from "../contexts/AuthContext";
import { useOrder } from "../contexts/OrderContext";
import { useLayout } from "../contexts/LayoutContext";
import { useSettings } from "../contexts/SettingsContext";
// Services
import { getProducts } from "../services/product";
import {
  createOrder,
  processPayment,
  getOrderDetails,
} from "../services/order";
import { saveCashTransaction } from "../services/cashTransaction";
// Utils
import { generateTransactionId } from "../utils/transactionHelper";
//  ===> INGET!!!!!:nanti nyalain kalo gambar dah kekompresss
import { getImageUrl } from "../utils/imageHelper";
// Components
import ProductList from "../components/pos/ProductList";
import CategoryFilter from "../components/pos/CategoryFilter";
import Loader from "../components/common/Loader";
import CategoryFilterSkeleton from "../components/skeleton/CategoryFilterSkeleton";
// Lazy Components
const Cart = lazy(() => import("../components/pos/Cart"));
const ToppingModal = lazy(() => import("../components/modal/ToppingModal"));
const PaymentMethodModal = lazy(() =>
  import("../components/modal/PaymentMethodModal")
);
const CashPaymentModal = lazy(() =>
  import("../components/modal/CashPaymentModal")
);
const GuestInputModal = lazy(() =>
  import("../components/modal/GuestInputModal")
);
const QRCodeModal = lazy(() => import("../components/modal/QRCodeModal"));
const Message = lazy(() => import("../components/common/Message"));
const ErrorMessage = lazy(() => import("../components/common/ErrorMessage"));

/**
 * Format cart data for sending to order API
 * 
 * @param {object[]} cart - data cartS
 * @param {function} t - function translate
 * 
 * @return {object[]} data cart yang sudah di format sesuai dengan kebutuhan order API
 */
const formatCartForOrderAPI = (cart, t) => {
  if (!cart) return [];

  const allUnits = [];

  cart.forEach((item) => {
    for (let i = 0; i < item.qty; i++) {
      const toppingsForThisUnit = item.selectedToppings?.[i] || [];

      const formattedToppings = toppingsForThisUnit
        .filter((toppingName) => toppingName && toppingName !== t("no_topping"))
        .map((toppingName) => {
          const toppingDetail = item.availableToppings.find(
            (t) => t.topping_nm === toppingName
          );
          return {
            topping_cd: toppingDetail ? toppingDetail.topping_cd : null,
          };
        })
        .filter((t) => t.topping_cd);

      allUnits.push({
        product_cd: item.id,
        toppings: formattedToppings,
      });
    }
  });

  return allUnits;
};




export default function POS() {
  const { t } = useTranslation();
  const { user, bizType } = useAuth();
  const { draftOrder, saveSession, clearDraftOrder, endTableSession } =
    useOrder();
  const { setShowCustomerDisplayButton } = useLayout();
  const { isDualDisplayEnabled } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { message, type, showMessage, hideMessage } = useMessage();

  // State untuk data produk dan UI
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedSubGroup, setSelectedSubGroup] = useState("All Sub");

  // State untuk modal dan pembayaran
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [setPaymentMethod] = useState("");
  const [showCashModal, setShowCashModal] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState(null);
  const [productForToppingSelection, setProductForToppingSelection] =
    useState(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrTotalAmount, setQrTotalAmount] = useState(0); 
  const [paymentOrderDetails, setPaymentOrderDetails] = useState(null);
  const [activeTransactionId, setActiveTransactionId] = useState(null);
  const [currentTrxNo, setCurrentTrxNo] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [channel, setChannel] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const socketRef = useRef(null);

  const cartTotals = useMemo(() => {
    const totals = {
      subtotal: 0,
      totalPb1: 0,
      totalPpn: 0,
      totalService: 0,
      grandTotal: 0,
    };

    cart.forEach((item) => {
      totals.subtotal += item.price * item.qty;
      totals.totalPb1 += (item.pb1 || 0) * item.qty;
      totals.totalPpn += (item.ppn || 0) * item.qty;
      totals.totalService += (item.service || 0) * item.qty;

      const allSelectedToppings = item.selectedToppings?.flat() || [];
      allSelectedToppings.forEach((toppingName) => {
        if (toppingName && toppingName !== t("no_topping")) {
          const toppingDetails = item.availableToppings.find(
            (t) => t.topping_nm === toppingName
          );
          if (toppingDetails && toppingDetails.is_free === 0) {
            totals.subtotal += toppingDetails.price || 0;
            totals.totalPb1 += toppingDetails.pb1 || 0;
            totals.totalPpn += toppingDetails.ppn || 0;
            totals.totalService += toppingDetails.service || 0;
          }
        }
      });
    });

    totals.grandTotal =
      totals.subtotal + totals.totalPb1 + totals.totalPpn + totals.totalService;

    return totals;
  }, [cart, t]);

  const totalQty = useMemo(
    () => cart.reduce((acc, item) => acc + item.qty, 0),
    [cart]
  );
  
  useEffect(() => {
    if (!user) return;

    const bc = new BroadcastChannel("customer_display");
    setChannel(bc);

    const socket = io("https://posapi.wrdnika.my.id", {
      path: "/socket-react",
      transports: ["polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
      auth: {
        userId: user.user_id,
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ [POS] Socket Connected"));
    socket.on("disconnect", () => console.log("❎ [POS] Socket Disconnected"));

    return () => {
      bc.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user.user_id]); 

  useEffect(() => {
    if (channel && cartTotals) {
      channel.postMessage({
        type: "CART_UPDATE",
        payload: {
          cart,
          cartTotals,
          pointsToUse,
        },
      });
    }
  }, [cart, cartTotals, pointsToUse, channel]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handlePaymentSuccess = (data) => {
      console.log("🎉 [POS] Payment Event:", data);

      if (data.status === "SUCCESS" && (showQRModal || activeTransactionId)) {
        
        console.log("✅ [POS] Validasi OK. Menampilkan Notif.");

        setShowQRModal(false);

        setTimeout(() => {
            showMessage(t("payment_successful"), "success");
            setShowSuccessNotification(true); 
        }, 200);

        if (channel) {
          channel.postMessage({ type: "PAYMENT_SUCCESS" });
          setTimeout(() => channel.postMessage({ type: "PAYMENT_END" }), 3000);
        }

        setShowPaymentModal(false);
        setCart([]);
        setActiveTransactionId(null);
        setMemberData(null);
        setPointsToUse(0);
        setCurrentTrxNo(null);
        setQrTotalAmount(0);

        setTimeout(() => {
            setShowSuccessNotification(false); 
            hideMessage(); 
        }, 3000);
      }
    };

    socketRef.current.on("payment_success", handlePaymentSuccess);

    return () => {
      socketRef.current.off("payment_success", handlePaymentSuccess);
    };
  }, [showQRModal, activeTransactionId, channel, t, showMessage, hideMessage]);
  useEffect(() => {
    setShowCustomerDisplayButton(true);
    return () => {
      setShowCustomerDisplayButton(false);
    };
  }, [setShowCustomerDisplayButton]);

  const fetchProductsData = useCallback(async () => {
    if (!user) {
      setError(new Error(t("user_data_not_available")));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { unit_cd, company_cd, branch_cd } = user;
      const response = await getProducts(unit_cd, company_cd, branch_cd);
      const mappedProducts = response.map((item) => {
        const isSoldOut =
          item.is_sold_out === 1 ||
          // item.is_product_stock === 0 ||
          (item.stock && item.stock.ending_qty <= 0);
        const priceInfo =
          item.prices && item.prices.length > 0 ? item.prices[0] : {};
        return {
          id: item.product_cd,
          name: item.product_nm,
          barcode: item.barcode,
          // image: item.product_file_imgserver,
          // ===> INGET: nanti yang image ganti dengan yang udah di parsing ya, ntar pas backoffice udah bisa komppress gambar
          image: getImageUrl(item.product_file_img_server),
          stock: item.stock?.ending_qty ?? "N/A",
          isSoldOut: isSoldOut,
          price: priceInfo.sales_price || 0,
          pb1: priceInfo.pb1_amnt || 0,
          ppn: priceInfo.ppn_amnt || 0,
          service: priceInfo.service_amnt || 0,
          effectiveDate: priceInfo.effective_date || "",
          group: item.group ? item.group.product_grp_desc : t("uncategorized"),
          subGroup: item.subGroup
            ? item.subGroup.product_subgrp_desc
            : t("uncategorized"),
          category:
            item.group && item.subGroup
              ? `${item.group.product_grp_desc} - ${item.subGroup.product_subgrp_desc}`
              : item.group
              ? item.group.product_grp_desc
              : t("uncategorized"),
          availableToppings: (item.toppings || []).map((topping) => {
            const toppingPriceInfo =
              topping.toppingPrices && topping.toppingPrices.length > 0
                ? topping.toppingPrices[0]
                : {};
            return {
              ...topping,
              price: toppingPriceInfo.sales_price || 0,
              pb1: toppingPriceInfo.pb1_amnt || 0,
              ppn: toppingPriceInfo.ppn_amnt || 0,
              service: toppingPriceInfo.service_amnt || 0,
            };
          }),
          hasToppings: (item.toppings || []).length > 0,
          discount: 0,
        };
      });
      setProducts(mappedProducts);
    } catch (err) {
      console.error(t("error_fetching_products"), err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    const orderToPay = location.state?.orderToPay;

    const setupPaymentMode = async (session) => {
      setLoading(true);
      try {
        const response = await getOrderDetails(
          session.posOrderNo,
          user.unit_cd,
          user.company_cd,
          user.branch_cd
        );
        const orderDetails = response.data;
        setCart(orderDetails.cart || []);
        setActiveTransactionId(orderDetails.pos_order_no);
        setPaymentOrderDetails({
          table: orderDetails.table,
          guests: orderDetails.guests,
        });
        setShowPaymentModal(true);
      } catch (err) {
        console.error(t("failed_to_get_order_details"), err);
        showMessage(t("failed_to_load_order_details_for_payment"), "error");
        navigate("/table");
      } finally {
        setLoading(false);
      }
    };

    if (orderToPay && user) {
      setupPaymentMode(orderToPay);
    } else if (user) {
      fetchProductsData();
    }
  }, [location.state, user, navigate, fetchProductsData]);

  const handleAddToCart = useCallback((productToAdd) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === productToAdd.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === productToAdd.id
            ? {
                ...item,
                qty: item.qty + productToAdd.qty,
                selectedToppings: [
                  ...item.selectedToppings,
                  ...productToAdd.selectedToppings,
                ],
              }
            : item
        );
      } else {
        return [...prev, productToAdd];
      }
    });
  }, []);

  const handleRemoveItem = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = Math.max(item.qty + delta, 0);
            if (newQty === 0) return null;
            const newSelectedToppings = [...item.selectedToppings];
            if (delta > 0) {
              newSelectedToppings.push("");
            } else if (newSelectedToppings.length > newQty) {
              newSelectedToppings.splice(newQty);
            }
            return {
              ...item,
              qty: newQty,
              selectedToppings: newSelectedToppings,
            };
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const handleToppingChange = useCallback(
    (toppingSlotIndex, value) => {
      setCart((prevCart) =>
        prevCart.map((item, index) => {
          if (index === editingCartItemIndex) {
            const newSelectedToppings = [...item.selectedToppings];
            newSelectedToppings[toppingSlotIndex] = value;
            return { ...item, selectedToppings: newSelectedToppings };
          }
          return item;
        })
      );
    },
    [editingCartItemIndex]
  );

  const handleProductClick = useCallback(
    (product) => {
      if (product.hasToppings) {
        setProductForToppingSelection({
          ...product,
          qty: 1,
          selectedToppings: [""],
        });
        setIsToppingModalOpen(true);
      } else {
        handleAddToCart({ ...product, qty: 1, selectedToppings: [] });
      }
    },
    [handleAddToCart]
  );

  const handleConfirmAddToCart = useCallback(
    (productWithToppings) => {
      handleAddToCart(productWithToppings);
      setIsToppingModalOpen(false);
      setProductForToppingSelection(null);
    },
    [handleAddToCart]
  );

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;

    if (bizType === "10002") {
      handleSaveRestoOrder();
    } else {
      setIsGuestModalOpen(true);
    }
  }, [cart, bizType, draftOrder]);

  const handleSaveRestoOrder = async () => {
    if (!draftOrder) {
      showMessage(t("no_table_data_error"), "error");
      navigate("/table");
      return;
    }

    setIsPaymentLoading(true);
    const posNo = generateTransactionId();

    const payload = {
      ...user,
      pos_no: posNo,
      tbl_cd: draftOrder.table.tbl_cd,
      floor_cd: draftOrder.table.floor_cd,
      name_of_order: draftOrder.guests.name,
      guests_cnt: draftOrder.guests.total,
      guests_men_cnt: draftOrder.guests.men,
      guests_women_cnt: draftOrder.guests.women,
      cart: formatCartForOrderAPI(cart, t),
      userDetails: { userId: user.user_id, userName: user.name },
    };

    try {
      const response = await createOrder(payload);
      saveSession({
        table: draftOrder.table,
        guests: draftOrder.guests,
        posOrderNo: response.pos_order_no,
      });
      showMessage(
        t("order_for_name_saved_successfully", {
          name: draftOrder.guests.name,
        }),
        "success"
      );
      clearDraftOrder();
      setCart([]);
      navigate("/table");
    } catch (error) {
      console.error(t("failed_to_save_resto_order"), error);
      showMessage(t("failed_to_save_order_try_again"), "error");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleConfirmCafeOrder = async (guestDetails) => {
    setIsGuestModalOpen(false);
    setIsPaymentLoading(true);

    const posNo = generateTransactionId();
    setActiveTransactionId(posNo);

    const payload = {
      ...user,
      pos_no: posNo,
      tbl_cd: "101",
      floor_cd: "101",
      name_of_order: guestDetails.name,
      guests_cnt: guestDetails.total,
      guests_men_cnt: guestDetails.men,
      guests_women_cnt: guestDetails.women,
      cart: formatCartForOrderAPI(cart, t),
      userDetails: { userId: user.user_id, userName: user.name },
    };

    try {
      await createOrder(payload);
      setPaymentOrderDetails({ guests: guestDetails });
      setShowPaymentModal(true);
    } catch (error) {
      console.error(t("failed_to_create_cafe_order"), error);
      showMessage(t("failed_to_create_order_try_again"), "error");
      setActiveTransactionId(null);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleCashPaymentSubmit = async ({ cashReceived }) => {
    // if (!user.trans_no_teller) {
    //   alert(
    //     "Error: Nomor transaksi teller tidak ditemukan. Silakan mulai sesi kasir terlebih dahulu."
    //   );
    //   return;
    // }

    // =======================================================================
    // =======================================================================
    // sementara generate dlu banh nanti pake sod nya
    // =======================================================================
    // =======================================================================
    const generateTransNoTeller = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

      const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
      return `CASHT1${timestamp}`;
    };

    const transNoTeller = generateTransNoTeller();

    setIsPaymentLoading(true);
    const payload = {
      unit_cd: user.unit_cd,
      company_cd: user.company_cd,
      branch_cd: user.branch_cd,
      guests_cnt: paymentOrderDetails?.guests?.total || 1,
      guests_men_cnt: paymentOrderDetails?.guests?.men || 0,
      guests_women_cnt: paymentOrderDetails?.guests?.women || 0,
      teller_cd: "T1",
      slip_no: activeTransactionId,
      pay_cash_amnt: cashReceived,
      trans_no_teller: transNoTeller,
      cart: formatCartForOrderAPI(cart, t),
      userDetails: { userId: user.user_id, userName: user.name },
    };

    if (memberData) {
      payload.mobile_phone_no = memberData.mobile_phone_no;
      payload.points_used_qty = pointsToUse > 0 ? pointsToUse : 0;
    }

    try {
      const response = await saveCashTransaction(payload);
      showMessage(t("cash_payment_saved_successfully"), "success");

      setShowCashModal(false);
      setCart([]);
      setActiveTransactionId(null);
      setMemberData(null);
      setPointsToUse(0);

      if (paymentOrderDetails?.table) {
        endTableSession(paymentOrderDetails.table.tbl_cd);
        setPaymentOrderDetails(null);
        navigate("/table");
      }
    } catch (error) {
      console.error(t("failed_to_save_cash_payment"), error);
      showMessage(
        error.response?.data?.message ||
          t("failed_to_save_cash_payment_message"),
        "error"
      );
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleProcessPayment = async (paymentData) => {
    if (paymentData.method === "cash") {
      setShowPaymentModal(false);
      setShowCashModal(true);
      return;
    }

    if (paymentData.method === "debit") {
      showMessage(t("debit_credit_payment_not_available_yet"), "info");
      return;
    }

    setIsPaymentLoading(true);

    let guestInfo = {};
    if (paymentOrderDetails) {
      guestInfo = {
        guests_cnt: paymentOrderDetails.guests.total,
        guests_men_cnt: paymentOrderDetails.guests.men,
        guests_women_cnt: paymentOrderDetails.guests.women,
      };
    }

    const payload = {
      unit_cd: user.unit_cd,
      company_cd: user.company_cd,
      branch_cd: user.branch_cd,
      slip_no: activeTransactionId,
      teller_cd: "T1",
      cart: formatCartForOrderAPI(cart, t),
      userDetails: { userId: user.user_id, userName: user.name },
      ...guestInfo,
      dual_display_enabled: isDualDisplayEnabled,
    };

    if (memberData) {
      payload.mobile_phone_no = memberData.mobile_phone_no;
      payload.points_used_qty = pointsToUse > 0 ? pointsToUse : 0;
    }

    try {
      const response = await processPayment(payload);
      console.log(" [POS] Response dari processPayment:", response);

      const qrData = response?.provider?.data?.qrContent || response.qr_string || response.qr_url;

      if (qrData) {
        console.log(" [POS] QR Data detected:", qrData);

        setQrCodeUrl(qrData); 
        setCurrentTrxNo(response.trx_no);
        setShowPaymentModal(false);
        setQrTotalAmount(response.total_amount || 0); 
        setShowQRModal(true);

        if (isDualDisplayEnabled && channel) {
          console.log("📡 [POS] Broadcasting QR to Customer Display");
          channel.postMessage({
            type: "PAYMENT_QRIS",
            payload: {
              cart,
              cartTotals,
              pointsToUse,
              qr_string: qrData, 
            },
          });
        }

        setIsPaymentLoading(false);
        return; 
      }

      if (response.mode === "snap" && response.redirect_url) {
        console.log("===[POS] Redirecting to:", response.redirect_url);
        window.location.href = response.redirect_url;
        return;
      }

      console.log("===[POS] Pembayaran langsung sukses");
      showMessage(t("payment_successful"), "success");
      
      if (channel) {
        channel.postMessage({ type: "PAYMENT_SUCCESS" });
        setTimeout(() => channel.postMessage({ type: "PAYMENT_END" }), 3000);
      }
      
      setShowPaymentModal(false);
      setCart([]);
      setActiveTransactionId(null);
      setMemberData(null);
      setPointsToUse(0);
      
      if (paymentOrderDetails) {
        endTableSession(paymentOrderDetails.table.tbl_cd);
        setPaymentOrderDetails(null);
        navigate("/table");
      }

    } catch (error) {
      console.error("❌ [POS] Error processPayment:", error);
      showMessage(
        error.response?.data?.message || t("failed_to_process_payment_message"),
        "error"
      );
      setIsPaymentLoading(false);
    }
  };

  const getToppingSummary = useCallback(
    (item) => {
      const { selectedToppings, availableToppings } = item;
      if (!selectedToppings || selectedToppings.length === 0) {
        return null;
      }

      const toppingCounts = selectedToppings.reduce((acc, toppings) => {
        const validToppings = Array.isArray(toppings)
          ? toppings.filter(Boolean)
          : [];

        if (validToppings.length === 0) {
          acc[t("no_topping")] = (acc[t("no_topping")] || 0) + 1;
        } else {
          validToppings.forEach((toppingName) => {
            acc[toppingName] = (acc[toppingName] || 0) + 1;
          });
        }
        return acc;
      }, {});

      return Object.entries(toppingCounts)
        .map(([toppingName, count]) => {
          if (toppingName === t("no_topping")) {
            return `${toppingName} (x${count})`;
          }

          const toppingDetails = availableToppings.find(
            (t) => t.topping_nm === toppingName
          );

          if (!toppingDetails) {
            return `${toppingName} (x${count})`;
          }

          const price = toppingDetails.price || 0;
          const isFree = toppingDetails.is_free === 1;

          if (isFree || price === 0) {
            return `${toppingName} (x${count})`;
          }
          return `${toppingName} (x${count})`;
        })
        .join(", ");
    },
    [t]
  );


  useEffect(() => {
    if (channel) {
      channel.postMessage({
        type: "CART_UPDATE",
        payload: {
          cart,
          cartTotals,
          pointsToUse,
        },
      });
    }
  }, [cart, cartTotals, channel, pointsToUse]);

  const uniqueGroups = useMemo(
    () => ["All", ...new Set(products.map((p) => p.group))],
    [products]
  );

  const currentSubGroups = useMemo(() => {
    if (selectedGroup === "All") return ["All Sub"];
    const subGroups = new Set(
      products
        .filter((p) => p.group === selectedGroup && p.subGroup)
        .map((p) => p.subGroup)
    );
    return ["All Sub", ...Array.from(subGroups)];
  }, [products, selectedGroup]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesGroup =
        selectedGroup === "All" || product.group === selectedGroup;
      const matchesSubGroup =
        selectedSubGroup === "All Sub" || product.subGroup === selectedSubGroup;
      return matchesGroup && matchesSubGroup;
    });
  }, [products, selectedGroup, selectedSubGroup]);

  const itemForModal = useMemo(() => {
    if (productForToppingSelection) return productForToppingSelection;
    if (editingCartItemIndex !== null) return cart[editingCartItemIndex];
    return null;
  }, [productForToppingSelection, editingCartItemIndex, cart]);

  const finalTotalAmount = useMemo(() => {
    const pointValue = 1000;
    const discountAmount = pointsToUse * pointValue;
    return cartTotals.grandTotal - discountAmount;
  }, [cartTotals.grandTotal, pointsToUse]);

  if (error) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-screen bg-gray-100">
        <Suspense fallback={<Loader show={true} />}>
          <ErrorMessage
            message={error.message || t("failed_to_fetch_data")}
            onRetry={fetchProductsData}
          />
        </Suspense>
      </div>
    );
  }

  const DraftOrderBanner = () => {
    if (bizType !== "10002" || !draftOrder) return null;
    return (
      <div className="p-3 bg-blue-100 text-blue-800 m-2 rounded-lg shadow-sm text-center">
        <p className="font-bold">
          {t("preparing_order_for_table", {
            table: draftOrder.table.tbl_cd,
            name: draftOrder.guests.name,
          })}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-7/12 xl:w-8/12 flex flex-col ">
          <DraftOrderBanner />
          <div className="flex-shrink-0 bg-white border-b">
            {loading ? (
              <CategoryFilterSkeleton />
            ) : (
              <CategoryFilter
                categories={uniqueGroups}
                selectedFilter={selectedGroup}
                setFilter={(group) => {
                  setSelectedGroup(group);
                  setSelectedSubGroup("All Sub");
                }}
                label={t("category")}
              />
            )}
            {currentSubGroups.length > 1 &&
              selectedGroup !== "All" &&
              !loading && (
                <CategoryFilter
                  categories={currentSubGroups}
                  selectedFilter={selectedSubGroup}
                  setFilter={setSelectedSubGroup}
                  label={t("sub_category")}
                />
              )}
          </div>

          <div className="flex-grow overflow-y-auto bg-gray-100 shadow-sm">
            <ProductList
              products={filteredProducts}
              onProductClick={handleProductClick}
              loading={loading}
            />
          </div>
        </div>

        <div className="w-full lg:w-5/12 xl:w-4/12 relative">
          <Suspense fallback={<div className="p-4">{t("loading_cart")}</div>}>
            <Cart
              cart={cart}
              totalQty={totalQty}
              cartTotals={cartTotals}
              handleRemoveItem={handleRemoveItem}
              updateQty={updateQty}
              getToppingSummary={getToppingSummary}
              onEditToppings={(index) => {
                setEditingCartItemIndex(index);
                setIsToppingModalOpen(true);
              }}
              handleCheckout={handleCheckout}
              memberData={memberData}
              pointsToUse={pointsToUse}
              onMemberUpdate={setMemberData}
              onPointsUpdate={setPointsToUse}
              showMessage={showMessage}
            />
          </Suspense>
        </div>
      </div>

      <div className="flex-shrink-0"></div>
      <Loader show={isPaymentLoading} message={t("processing_payment")} />
      <Suspense fallback={<Loader show={true} message={t("loading_modal")} />}>
        {isToppingModalOpen && itemForModal && (
          <ToppingModal
            key={itemForModal.id || editingCartItemIndex}
            item={itemForModal}
            mode={productForToppingSelection ? "add" : "edit"}
            onClose={() => {
              setIsToppingModalOpen(false);
              setProductForToppingSelection(null);
              setEditingCartItemIndex(null);
            }}
            onConfirmAddToCart={handleConfirmAddToCart}
            onSaveChanges={handleToppingChange}
          />
        )}
        {showPaymentModal && (
          <PaymentMethodModal
            onClose={() => setShowPaymentModal(false)}
            onSelectCash={() => handleProcessPayment({ method: "cash" })}
            onSelectDebit={() => handleProcessPayment({ method: "debit" })}
            onSelectDigital={() => handleProcessPayment({ method: "digital" })}
            isLoading={isPaymentLoading}
            cart={cart}
            cartTotals={cartTotals}
            memberData={memberData}
            pointsToUse={pointsToUse}
          />
        )}
        {showCashModal && (
          <CashPaymentModal
            totalAmount={finalTotalAmount}
            onClose={() => setShowCashModal(false)}
            onSubmit={handleCashPaymentSubmit}
            isLoading={isPaymentLoading}
          />
        )}
        {showQRModal && (
          <QRCodeModal
            qrCodeUrl={qrCodeUrl}
            totalAmount={qrTotalAmount}
            onClose={() => {
              setShowQRModal(false);
              setCurrentTrxNo(null);
              setQrTotalAmount(0);
              showMessage(t("payment_cancelled"), "info");
            }}
          />
        )}
      </Suspense>
      <Suspense fallback={<div />}>
        {isGuestModalOpen && (
          <GuestInputModal
            isOpen={isGuestModalOpen}
            onClose={() => setIsGuestModalOpen(false)}
            onConfirm={handleConfirmCafeOrder}
            bizType={bizType}
          />
        )}
        {message && (
          <Message message={message} type={type} onClose={hideMessage} />
        )}
        {showSuccessNotification && (
          <Message
            message={t("payment_successful")}
            type="success"
            onClose={() => setShowSuccessNotification(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
