export const ProductCardSkeleton = () => (
  <div className="animate-pulse rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
    <div className="bg-gray-200 aspect-square w-full" />
    <div className="p-3 space-y-2">
      <div className="bg-gray-200 h-3 rounded w-3/4" />
      <div className="bg-gray-200 h-3 rounded w-1/2" />
      <div className="flex justify-between items-center pt-1">
        <div className="bg-gray-200 h-4 rounded w-1/3" />
        <div className="bg-gray-200 h-7 w-7 rounded-full" />
      </div>
    </div>
  </div>
);
