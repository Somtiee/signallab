"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  txSignature?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, txSignature?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", txSignature?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, txSignature }]);

    // Auto-remove after 5 seconds if there's a tx, else 3
    const duration = txSignature ? 5000 : 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto min-w-[300px] max-w-md rounded-lg p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full border border-white/10
              ${
                toast.type === "success"
                  ? "bg-green-900/90 text-white"
                  : toast.type === "error"
                  ? "bg-red-900/90 text-white"
                  : "bg-gray-800/90 text-white"
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{toast.message}</p>
                {toast.txSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${toast.txSignature}?cluster=custom&customUrl=http://localhost:8899`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline opacity-80 hover:opacity-100 flex items-center gap-1"
                  >
                    View Transaction ↗
                  </a>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
