// فایل جدید: src/components/DeleteMessageModal.tsx
import React from "react";

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tagDelete: "FOR_ALL" | "FOR_ME") => void;
  canDeleteForAll: boolean; // آیا اصلا حق حذف برای همه را دارد؟
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  canDeleteForAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          حذف پیام
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          آیا از حذف این پیام اطمینان دارید؟
        </p>

        <div className="flex flex-col gap-3">
          {canDeleteForAll && (
            <button
              onClick={() => onConfirm("FOR_ALL")}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
            >
              حذف برای همه
            </button>
          )}
          <button
            onClick={() => onConfirm("FOR_ME")}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            حذف فقط برای من
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mt-2"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
