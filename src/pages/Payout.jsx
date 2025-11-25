import React, { useState } from "react";
import { registAccountPayout, approvePayout } from "../services/payout";
import { balanceInquiry } from "../services/balance"; // pastikan path sesuai
import { useEffect } from "react";

const Payout = () => {
  const [formData, setFormData] = useState({
    accountNo: "",
    name: "",
    phone: "",
    customerResidence: "",
    customerType: "",
    postalCode: "",
    codeBank: "",
    value: "",
    currency: "",
    partnerReferenceNo: "",
    description: "",
    reservedDt: "",
    reservedTm: "",
  });

  const [registResponse, setRegistResponse] = useState(null);
  const [approvalData, setApprovalData] = useState({
    originalReferenceNo: "",
    originalPartnerReferenceNo: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const response = await balanceInquiry("SITGLOBAL2"); // atau formData.accountNo?
      setBalance(response.data);
    } catch (error) {
      console.error("Balance inquiry failed", error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleRegistSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await registAccountPayout(formData);
      setRegistResponse(response);

      // Auto-populate approval data if available in response
      // Assuming response structure, adjust as needed based on actual API response
      if (response && response.data) {
        // Akses masuk ke response.data terlebih dahulu
        const refNo =
          response.data.originalReferenceNo || response.data.tXid || "";
        const partnerRef =
          response.data.partnerReferenceNo || formData.partnerReferenceNo || "";

        setApprovalData({
          originalReferenceNo: refNo,
          originalPartnerReferenceNo: partnerRef,
        });
      }

      setMessage({ type: "success", text: "Registration successful!" });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Registration failed. Check console.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await approvePayout(
        approvalData.originalReferenceNo,
        approvalData.originalPartnerReferenceNo
      );
      setMessage({ type: "success", text: "Payout Approved successfully!" });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Approval failed. Check console." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Available Balance</h2>

        {balanceLoading ? (
          <p className="animate-pulse text-gray-200">Loading balance...</p>
        ) : balance ? (
          <>
            <p className="text-3xl font-bold">
              {new Intl.NumberFormat("en-US").format(
                balance.accountInfos?.[0]?.availableBalance?.value
              )}{" "}
              {balance.accountInfos?.[0]?.availableBalance?.currency}
            </p>

            <p className="text-sm opacity-80 mt-1">
              Account: {balance.accountNo}
            </p>
          </>
        ) : (
          <p className="text-gray-200 italic">Balance unavailable</p>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Payout Management
      </h1>

      {message && (
        <div
          className={`p-4 mb-4 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Registration Form */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            Register Account Payout
          </h2>
          <form onSubmit={handleRegistSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account No"
                name="accountNo"
                value={formData.accountNo}
                onChange={handleChange}
              />
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              <Input
                label="Customer Residence"
                name="customerResidence"
                value={formData.customerResidence}
                onChange={handleChange}
              />
              <Input
                label="Customer Type"
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
              />
              <Input
                label="Code Bank"
                name="codeBank"
                value={formData.codeBank}
                onChange={handleChange}
              />
              <Input
                label="Value"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
              />
              <Input
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              />

              <Input
                label="Reserved Date"
                name="reservedDt"
                type="date"
                value={formData.reservedDt}
                onChange={handleChange}
              />
              <Input
                label="Reserved Time"
                name="reservedTm"
                type="time"
                value={formData.reservedTm}
                onChange={handleChange}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Register Payout"}
            </button>
          </form>
        </div>

        {/* Right Card: Response & Approval */}
        <div className="space-y-6">
          {/* Response Section */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Registration Response
            </h2>
            {registResponse ? (
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-300 shadow-inner">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-600 text-white rounded-full">
                    ✓
                  </div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Registration Successful
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-gray-800">
                  <DetailItem
                    label="Original Reference No"
                    value={approvalData.originalReferenceNo}
                  />
                  <DetailItem
                    label="Partner Reference No"
                    value={approvalData.originalPartnerReferenceNo}
                  />
                  <DetailItem
                    label="Status Message"
                    value={registResponse.data?.responseMessage}
                  />
                  <DetailItem
                    label="Account No"
                    value={registResponse.data?.beneficiaryaccountNo}
                  />
                  <DetailItem
                    label="Account No"
                    value={registResponse.data?.beneficiaryName}
                  />
                  <DetailItem
                    label="Bank Code"
                    value={registResponse.data?.beneficiaryBankCode}
                  />

                  <DetailItem
                    label="Value"
                    value={`${registResponse.data?.amount?.value} ${registResponse.data?.amount?.currency}`}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No response data yet.</p>
            )}
          </div>

          {/* Approval Section */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Approve Payout
            </h2>
            <form onSubmit={handleApprovalSubmit} className="space-y-4">
              <Input
                label="Original Reference No"
                name="originalReferenceNo"
                value={approvalData.originalReferenceNo}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    originalReferenceNo: e.target.value,
                  })
                }
              />
              <Input
                label="Original Partner Ref No"
                name="originalPartnerReferenceNo"
                value={approvalData.originalPartnerReferenceNo}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    originalPartnerReferenceNo: e.target.value,
                  })
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Approve Payout"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, name, type = "text", value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between border-b py-1">
    <span className="font-medium">{label}</span>
    <span className="text-gray-600">{value || "-"}</span>
  </div>
);

export default Payout;
