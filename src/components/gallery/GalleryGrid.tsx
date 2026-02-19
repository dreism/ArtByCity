'use client';

import { motion } from 'framer-motion';
import { Gallery } from '@/types/gallery';
import { GalleryCard } from './GalleryCard';

interface Props {
  galleries: Gallery[];
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

export function GalleryGrid({ galleries }: Props) {
  if (galleries.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400 text-lg">No galleries found yet.</p>
        <p className="text-zinc-300 text-sm mt-1">Discovery is in progress...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {galleries.map((gallery) => (
        <motion.div key={gallery.id} variants={item}>
          <GalleryCard gallery={gallery} />
        </motion.div>
      ))}
    </motion.div>
  );
}
