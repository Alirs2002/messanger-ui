import React from "react";
import { AlertTriangle, Trash2, LogOut, ShieldAlert } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  iconType?: "danger" | "warning" | "leave";
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = "تأیید",
  cancelText = "انصراف",
  danger = true,
  iconType = "danger",
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm overflow-hidden p-6 text-center transform transition-all"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3.5 ${
            danger
              ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          }`}
        >
          {iconType === "leave" ? (
            <LogOut className="w-6 h-6 rotate-180" />
          ) : iconType === "warning" ? (
            <ShieldAlert className="w-6 h-6" />
          ) : (
            <Trash2 className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1.5">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl text-white transition-all shadow-sm active:scale-95 ${
              danger
                ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
            }`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-medium rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
