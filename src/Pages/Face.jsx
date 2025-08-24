import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { loadModels, detectFaces } from "../../public/FaceJs/script";

const Face = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const startVideo = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
        };

        loadModels().then(startVideo);

        videoRef.current.addEventListener("play", () => {
            const canvas = canvasRef.current;
            const displaySize = {
                width: videoRef.current.width,
                height: videoRef.current.height,
            };

            // Sync canvas size with video
            faceapi.matchDimensions(canvas, displaySize);

            setInterval(async () => {
                const results = await detectFaces(videoRef.current);

                const context = canvas.getContext("2d");
                context.clearRect(0, 0, canvas.width, canvas.height);

                results.forEach(({ box, label, accuracy }) => {
                    // Draw bounding box
                    const drawBox = new faceapi.draw.DrawBox(box, {
                        label: `${label} (${(1 - accuracy).toFixed(2)})`,
                    });
                    drawBox.draw(canvas);

                    if (label === "unknown") {
                        console.warn("⚠ Unknown face detected");
                        // you can set React state here to show popup
                    }
                });
            }, 200);
        });
    }, []);

    return (
        <div className="relative flex items-center justify-center h-screen overflow-hidden 
      bg-gradient-to-b from-[#0b0c10] via-[#0f1115] to-[#050608] text-white">

            {/* Background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1c1c_1px,transparent_1px),linear-gradient(to_bottom,#1c1c1c_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
            <div className="absolute w-[500px] h-[500px] rounded-full bg-green-500/10 blur-3xl top-[-100px] left-[-200px]" />
            <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl bottom-[-150px] right-[-200px]" />

            <div className="relative z-10 items-center mr-6 flex">
                <div className="h-full w-[600px] bg-gradient-to-b from-green-200 to-cyan-400 bg-clip-text py-8 text-xl font-extrabold text-transparent sm:text-6xl">
                    <h1>Start the future of Surveillance.</h1>
                    <a href="/face" className="cursor-pointer">
                        <button
                            className="cursor-pointer animated-border text-[16px] px-10 py-3 relative text-white rounded-md"
                        >
                            <span className="flex gap-3">Start System</span>
                        </button>
                    </a>
                </div>

                {/* Video + Overlay */}
                <div className="w-[800px]">
                    <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-600/50">
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
                            className="absolute top-0 left-0 z-30 "
                            width={800}
                            height={480}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Face;
