'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, onClose, duration = 4000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 max-w-md"
            >
                <div className="bg-[#0F0F0F] border border-red-500/50 rounded-lg p-4 shadow-2xl flex items-center gap-3">
                    <div className="flex-1">
                        <p className="text-red-400 text-sm font-medium">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
