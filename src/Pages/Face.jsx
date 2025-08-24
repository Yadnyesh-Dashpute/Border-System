import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { loadModels, detectFaces } from "../../public/FaceJs/script";

const Face = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    useEffect(() => {
        if (!isCameraActive) return;

        let stream;
        let intervalId;

        const setupCameraAndFaceAPI = async () => {
            await loadModels();
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setIsCameraActive(false); // Turn off if camera access is denied
            }
        };

        const onPlay = () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) return;

            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);

            intervalId = setInterval(async () => {
                const results = await detectFaces(video);
                const context = canvas.getContext("2d");
                context.clearRect(0, 0, canvas.width, canvas.height);

                results.forEach(({ box, label, accuracy }) => {
                    const drawBox = new faceapi.draw.DrawBox(box, {
                        label: `${label} (${(1 - accuracy).toFixed(2)})`,
                    });
                    drawBox.draw(canvas);

                    if (label === "unknown") {
                        console.warn("⚠ Unknown face detected");
                    }
                });
            }, 200);
        };

        setupCameraAndFaceAPI();

        const videoElement = videoRef.current;
        if (videoElement) {
            videoElement.addEventListener("play", onPlay);
        }

        // --- Cleanup Function ---
        // This runs when the component unmounts or `isCameraActive` becomes false
        return () => {
            console.log("Stopping system and cleaning up...");
            clearInterval(intervalId);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            if (videoElement) {
                videoElement.removeEventListener("play", onPlay);
            }
        };
    }, [isCameraActive]);

    // ** 1. This function now TOGGLES the state **
    const toggleSystem = () => {
        setIsCameraActive(prevState => !prevState);
    };

    return (
        <div className="relative flex items-center justify-center h-screen overflow-hidden bg-gradient-to-b from-[#0b0c10] via-[#0f1115] to-[#050608] text-white">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1c1c_1px,transparent_1px),linear-gradient(to_bottom,#1c1c1c_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
            <div className="absolute w-[500px] h-[500px] rounded-full bg-green-500/10 blur-3xl top-[-100px] left-[-200px]" />
            <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl bottom-[-150px] right-[-200px]" />

            <div className="relative z-10 items-center mr-6 flex">
                <div className="h-full w-[600px] bg-gradient-to-b from-green-200 to-cyan-400 bg-clip-text py-8 text-xl font-extrabold text-transparent sm:text-6xl">
                    <h1>Start the future of Surveillance.</h1>

                    {/* ** 2. Button now calls the toggle function ** */}
                    <button
                        onClick={toggleSystem}
                        className="cursor-pointer animated-border text-[16px] px-10 py-3 relative text-white rounded-md mt-4"
                    >
                        {/* ** 3. Button text changes based on state ** */}
                        <span className="flex gap-3">
                            {isCameraActive ? 'Stop System' : 'Start System'}
                        </span>
                    </button>
                </div>

                <div className="w-[800px]">
                    <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-600/50">
                        {isCameraActive ? (
                            <>
                                <video
                                    ref={videoRef}
                                    className="w-[800px] h-[480px] object-fill"
                                    width={800}
                                    height={480}
                                    autoPlay
                                    muted
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 z-30"
                                    width={800}
                                    height={480}
                                />
                            </>
                        ) : (
                            <>
                                <img
                                    src="/Loader/face.gif" // Replace with your placeholder video
                                    className="w-[800px] scale-140 h-[480px] object-fill"
                                    width={800}
                                    height={480}
                                    autoPlay
                                    loop
                                    muted
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Face;