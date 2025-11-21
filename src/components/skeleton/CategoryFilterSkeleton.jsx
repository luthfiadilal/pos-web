import React from "react";

const CategoryFilterSkeleton = ({ count = 4 }) => {
  return (
    <div className="py-2 px-2">
      <div className="overflow-x-auto">
        <div className="flex space-x-2 w-max animate-pulse">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="px-3 py-1 h-8 w-24 bg-gray-200 rounded-full"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilterSkeleton;
