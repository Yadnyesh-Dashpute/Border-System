import { MessageCircleWarning, OctagonAlert } from "lucide-react";
import React from "react";

export default function Popup({
    open,
    title = "Unknown Person Detected",
    subtitle = "Security Alert",
    message = "An unrecognized face has been detected. Please take action.",
    onAllow,
    onDisallow,
    onClose,
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
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-md">
                            <MessageCircleWarning className="w-8 h-8 text-white" />
                        </div>

                        <div className="flex-1">
                            <div className="text-xs text-left font-semibold text-gray-400 uppercase">
                                Border Surveillance System
                            </div>
                            <div className="mt-1 text-lg text-left font-semibold text-white">
                                {title}
                            </div>
                            <div className="text-sm text-left text-gray-300 mt-0.5">
                                {subtitle}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-gray-800/60" />

                    <div className="mt-4 flex gap-3">
                        <div className="w-18 h-8 rounded-full bg-gray-800/60 flex items-center justify-center">
                            <OctagonAlert />
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-3">
                        <button
                            onClick={onAllow}
                            className="px-4 w-1/2 py-2 cursor-pointer rounded-md bg-gray-800/60 text-sm font-medium text-gray-200 border border-gray-700 hover:bg-gray-800"

                        >
                            Allow
                        </button>

                        <button
                            onClick={onDisallow}
                            className="px-4 py-2 w-1/2 cursor-pointer rounded-md bg-gradient-to-br from-gray-700/80 to-gray-600/80 text-sm font-medium text-white shadow-md hover:brightness-110"
                        >
                            Don’t Allow
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
