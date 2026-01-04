import React, { useState, useEffect, useRef } from "react";

import { ImagePlus, User, Building2, Clock } from "lucide-react";
import { addUnknownPerson } from "../../public/Services/addUnknownPerson";

export default function Form({ open, onClose, onSubmit, detectedImage }) {
    // ✅ MATCHING FIREBASE FIELDS
    const [title, setTitle] = useState("");           // Person Name
    const [description, setDescription] = useState(""); // Department
    const [images, setImages] = useState([]);         // ARRAY
    const [imagePreview, setImagePreview] = useState(null);

    const timestamp = new Date().toLocaleString();
    const fileInputRef = useRef(null);


    // ✅ Auto-load detected image
    useEffect(() => {
        if (!detectedImage) return;

        setImagePreview(detectedImage);

        fetch(detectedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "detected-face.jpg", {
                    type: "image/jpeg",
                });

                // store as array (important)
                setImages([file]);
            })
            .catch(console.error);
    }, [detectedImage]);

    if (!open) return null;

    // ---------------- Helpers ----------------

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setImages([]);
        setImagePreview(null);
    };

    const handleManualImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImages([file]); // ✅ always array
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!title || !description || images.length === 0) {
            alert("Please fill all fields");
            return;
        }

        try {
            await addUnknownPerson({
                title,
                description,
                images,      // ARRAY
                timestamp,
            });

            resetForm();
            onSubmit?.();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to save unknown person");
        }
    };

    // ---------------- UI ----------------

    const handleCameraCapture = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImages([file]); // always array
        setImagePreview(URL.createObjectURL(file));

        // reset input so same image can be re-selected
        e.target.value = "";
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => {
                    resetForm();
                    onClose();
                }}
            />

            <div className="relative z-10 w-full max-w-lg">
                <div className="rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-900/80 to-gray-900/60 p-6 shadow-2xl">

                    {/* Header */}
                    <div className="mb-5">
                        <div className="text-xs font-semibold text-gray-400 uppercase">
                            Border Surveillance System
                        </div>
                        <h2 className="text-lg font-semibold text-white mt-1">
                            Unknown Person Detected
                        </h2>
                        <p className="text-sm text-gray-400">
                            Verify details before saving
                        </p>
                    </div>

                    {/* Person Name */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                            <User className="w-4 h-4" /> Person Name
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter full name"
                            className="w-full rounded-md bg-gray-800/70 border border-gray-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Department */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4" /> Department
                        </label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter department"
                            className="w-full rounded-md bg-gray-800/70 border border-gray-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Image Section */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-2">
                            <ImagePlus className="w-4 h-4" /> Person Image
                        </label>

                        {/* Hidden Camera Input */}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleCameraCapture}
                        />

                        {imagePreview ? (
                            <div className="space-y-2">
                                <img
                                    src={imagePreview}
                                    alt="Person"
                                    className="w-full h-48 object-cover rounded-lg border border-gray-700"
                                />
                                <p className="text-xs text-green-400">
                                    Captured from camera
                                </p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="text-xs text-cyan-400 hover:underline"
                                >
                                    Replace image
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="w-full py-2 rounded-md bg-gray-700 text-sm text-white hover:bg-gray-600"
                            >
                                Capture Image
                            </button>
                        )}
                    </div>


                    {/* Timestamp */}
                    <div className="mb-6">
                        <label className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4" /> Timestamp
                        </label>
                        <input
                            value={timestamp}
                            disabled
                            className="w-full rounded-md bg-gray-800/50 border border-gray-700 px-3 py-2 text-sm text-gray-400"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="w-1/2 px-4 py-2 cursor-pointer rounded-md bg-gray-800/60 text-sm text-gray-200 border border-gray-700 hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSubmit}
                            className="w-1/2 px-4 py-2 cursor-pointer rounded-md bg-gradient-to-br from-cyan-500 to-green-500 text-sm font-medium text-black hover:brightness-110"
                        >
                            Save
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
