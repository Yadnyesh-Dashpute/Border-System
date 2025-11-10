import { MessageCircleWarning } from "lucide-react";
import React from "react";

export default function Popup({
    open,
    title = "Gross House",
    subtitle = "Property offer",
    message =
    "Leave on Time Sensitive notifications from Props? This allows Props to deliver important notifications immediately.",
    onClose,
    onConfirm,
}) {
    if (!open) return null;

    return (
        <div
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md">
                <div className="rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-900/80 to-gray-900/60 p-5 shadow-2xl">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-md">
                                {/* <svg
                                    viewBox="0 0 24 24"
                                    width="28"
                                    height="28"
                                    fill="white"
                                    aria-hidden
                                >
                                    <path d="M12 3l8 7h-2v8h-4v-5H10v5H6v-8H4z" />
                                </svg> */}
                                <MessageCircleWarning className="w-8 h-8" />

                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-400 uppercase">Border Surveillance System</div>
                            <div className="mt-1 text-lg font-semibold text-white">{title}</div>
                            <div className="text-sm text-gray-300 mt-0.5">{subtitle}</div>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-gray-800/60" />

                    <div className="mt-4 flex gap-3 items-start">
                        <div className="mt-1">
                            <div className="w-8 h-8 rounded-full bg-gray-800/60 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M12 8v4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="16" r="1" fill="#9CA3AF" />
                                </svg>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
                    </div>

                    <div className="mt-5 flex gap-3 ">
                        <button
                            onClick={onClose}
                            className="px-4 w-1/2 py-2 cursor-pointer rounded-md bg-gray-800/60 text-sm font-medium text-gray-200 border border-gray-700 hover:bg-gray-800"
                        >
                            Allow
                        </button>

                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 w-1/2 cursor-pointer rounded-md bg-gradient-to-br from-gray-700/80 to-gray-600/80 text-sm font-medium text-white shadow-md hover:brightness-110"
                        >
                            Don't Allow
                        </button>
                    </div>
                </div>

                <div className="absolute -inset-0.5 rounded-2xl pointer-events-none" />
            </div>
        </div>
    );
}

