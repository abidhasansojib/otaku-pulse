'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ isOpen, onClose, title = 'Filter Options', children }: SheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm glass-modal border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
                {children}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white font-semibold shadow-lg shadow-[#FF2A5F]/20 hover:opacity-95 transition-opacity"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
