'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoLogo() {
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideo(false);
    }, 4000); // 4 seconds baad hide

    return () => clearTimeout(timer);
  }, []);

  if (!showVideo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      >
        <video
          autoPlay
          muted
          playsInline
          className="max-w-md w-full max-h-screen object-contain"
        >
          <source src="/logo-animation.mp4" type="video/mp4" />
        </video>
      </motion.div>
    </AnimatePresence>
  );
}
