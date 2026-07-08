'use client';

import { motion } from 'framer-motion';
import { Gallery } from '@/types/gallery';
import { GalleryCard } from './GalleryCard';

interface Props {
  galleries: Gallery[];
  enrichingIds?: Set<string>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function GalleryGrid({ galleries, enrichingIds }: Props) {
  if (galleries.length === 0) return null;

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {galleries.map((gallery) => (
        <motion.div key={gallery.id} variants={item}>
          <GalleryCard gallery={gallery} enriching={enrichingIds?.has(gallery.id)} />
        </motion.div>
      ))}
    </motion.div>
  );
}
