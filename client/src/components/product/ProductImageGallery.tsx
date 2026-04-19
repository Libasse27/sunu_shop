import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface Image {
  url: string;
  alt?: string;
}

interface Props {
  images: Image[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const validImages = images.length > 0 ? images : [{ url: '/placeholder.jpg', alt: productName }];

  const prev = () => setActiveIndex((i) => (i === 0 ? validImages.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === validImages.length - 1 ? 0 : i + 1));

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative aspect-square bg-green-50 rounded-xl overflow-hidden"
        style={{ cursor: zoomed ? 'zoom-out' : 'zoom-in' }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={validImages[activeIndex].url}
            alt={validImages[activeIndex].alt || productName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover"
            style={{ transform: zoomed ? 'scale(1.5)' : 'scale(1)', cursor: zoomed ? 'zoom-out' : 'zoom-in' }}
            onClick={() => setZoomed(!zoomed)}
          />
        </AnimatePresence>

        {validImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 ml-3 flex items-center justify-center rounded-full shadow-sm border-0"
              style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 mr-3 flex items-center justify-center rounded-full shadow-sm border-0"
              style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <button
          onClick={() => setZoomed(!zoomed)}
          className="absolute bottom-0 right-0 mb-3 mr-3 flex items-center justify-center rounded-full shadow-sm border-0"
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {validImages.map((img, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveIndex(i)}
              className="shrink-0 overflow-hidden rounded-lg p-0"
              style={{
                width: 80,
                height: 80,
                border: `2px solid ${i === activeIndex ? '#009A44' : 'transparent'}`,
                outline: 'none',
                background: 'transparent',
              }}
            >
              <img src={img.url} alt={img.alt || `${productName} ${i + 1}`} className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
