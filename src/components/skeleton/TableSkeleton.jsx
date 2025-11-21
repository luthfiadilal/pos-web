import React from "react";

const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <tbody className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="p-3">
              <div className="h-6 bg-gray-200 rounded"></div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default TableSkeleton;
