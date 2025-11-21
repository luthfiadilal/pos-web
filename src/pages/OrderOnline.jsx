import { Icon } from "@iconify/react";

const OrderOnline = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-700 p-8 text-center">
      <Icon icon="mdi:tools" className="text-8xl text-gray-400 mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 mb-2">
        Under Construction
      </h1>
      <p className="text-lg text-gray-500">
        This page is currently being developed. Please check back later!
      </p>
    </div>
  );
};

export default OrderOnline;
