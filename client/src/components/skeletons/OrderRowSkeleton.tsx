export const OrderRowSkeleton = () => (
  <div className="animate-pulse flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl">
    <div className="bg-gray-200 h-12 w-12 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="bg-gray-200 h-4 rounded w-1/3" />
      <div className="bg-gray-200 h-3 rounded w-1/2" />
    </div>
    <div className="bg-gray-200 h-5 rounded w-20" />
  </div>
);
