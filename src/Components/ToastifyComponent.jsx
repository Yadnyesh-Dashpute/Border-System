import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export const toastSuccess = (message) =>
    toast.success(message, {
        icon: "✅",
    });

export const toastError = (message) =>
    toast.error(message, {
        icon: "❌",
    });

export const toastWarning = (message) =>
    toast.warn(message, {
        icon: "⚠️",
    });

export const toastInfo = (message) =>
    toast.info(message, {
        icon: "ℹ️",
    });

export default function ToastifyComponent() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="dark"
            toastClassName={() =>
                `
                relative flex p-4 rounded-xl
                bg-gradient-to-br from-gray-900/90 to-gray-800/90
                border border-gray-700/60
                shadow-xl backdrop-blur-md
                text-sm text-gray-100
                `
            }
            bodyClassName="text-sm text-gray-200"
            progressClassName="bg-gradient-to-r from-cyan-500 to-green-500"
        />
    );
}
