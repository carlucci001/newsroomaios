'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatusModalProps {
  children: ReactNode;
}

export function StatusModal({ children }: StatusModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-auto rounded-3xl bg-[#0a0f1a] shadow-2xl shadow-black/50 border border-white/10"
      >
        {children}
      </motion.div>
    </div>
  );
}
