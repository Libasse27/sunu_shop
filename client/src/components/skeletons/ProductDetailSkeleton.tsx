export const ProductDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="container-custom py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-200 rounded-xl aspect-square" />
        <div className="space-y-4">
          <div className="bg-gray-200 h-6 rounded w-3/4" />
          <div className="bg-gray-200 h-4 rounded w-1/2" />
          <div className="bg-gray-200 h-8 rounded w-1/3" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-3 rounded" />
            ))}
          </div>
          <div className="bg-gray-200 h-12 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);
