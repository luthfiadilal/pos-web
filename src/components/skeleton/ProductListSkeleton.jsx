import React from "react";

const ProductSkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 animate-pulse flex flex-col h-full">
      <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
      <div className="space-y-3 flex-grow">
        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        <div className="h-5 bg-gray-300 rounded w-1/3 mx-auto"></div>
      </div>
    </div>
  );
};

const ProductListSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeletonCard key={i} />
      ))}
    </div>
  );
};

export default ProductListSkeleton;
