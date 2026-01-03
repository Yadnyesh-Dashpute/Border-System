import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { loadModels, detectFaces } from "../../public/FaceJs/script";
import Popup from "../Components/Popup";


const Face = () => {
    const [showPopup, setShowPopup] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        const handleAlert = () => {
            setShowPopup(true);
        };

        window.addEventListener("unknown-face-detected", handleAlert);
        return () => window.removeEventListener("unknown-face-detected", handleAlert);
    }, []);

    const handleClose = () => {
        setShowPopup(false);
    };

    const handleConfirm = () => {
        setShowPopup(false);
        console.log("User denied notification or closed alert");
    };

    useEffect(() => {
        if (!isCameraActive) return;

        let stream;
        let intervalId;

        const setupCameraAndFaceAPI = async () => {
            try {
                console.log("Loading models...");
                await loadModels();

                console.log("Starting camera...");
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    await new Promise((resolve) => {
                        videoRef.current.onloadedmetadata = resolve;
                    });

                    await videoRef.current.play();
                    console.log("Camera stream active.");
                    startFaceDetection();
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setIsCameraActive(false);
            }
        };

        const startFaceDetection = async () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
            faceapi.matchDimensions(canvasRef.current, displaySize);

            const detections = await faceapi
                .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            faceapi.draw.drawDetections(canvasRef.current, resizedDetections);


            intervalId = setInterval(async () => {
                if (!video.videoWidth || !video.videoHeight) return;

                const results = await detectFaces(video);
                const resizedResults = faceapi.resizeResults(results, displaySize);
                const context = canvas.getContext("2d");
                context.clearRect(0, 0, canvas.width, canvas.height);

                if (resizedResults && resizedResults.length > 0) {
                    resizedResults.forEach((result) => {
                        if (!result || !result.detection || !result.detection.box) return;

                        const { detection, label = "Unknown", accuracy = 0 } = result;
                        const color = label === "unknown" ? "red" : "lime";


                        const drawBox = new faceapi.draw.DrawBox(detection.box, {
                            boxColor: color,
                            lineWidth: 3,
                        });
                        drawBox.draw(canvas);

                        const text = `${label}`;

                        const drawText = new faceapi.draw.DrawTextField(
                            [text],
                            detection.box.topLeft,
                            {
                                textColor: 'white',
                                fontSize: 18,

                            }
                        );

                        drawText.draw(canvas);
                    });
                } else {
                    const ctx = canvas.getContext("2d");
                    ctx.font = "18px Arial";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                    ctx.fillText("No face detected", 20, 40);
                }
                ;
            }, 200);
        };

        setupCameraAndFaceAPI();
        return () => {
            clearInterval(intervalId);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isCameraActive]);

    const toggleSystem = () => {
        setIsCameraActive(prevState => !prevState);
    };

    return (
        <>
            <div className="relative hidden sm:flex items-center justify-center h-screen overflow-hidden bg-gradient-to-b from-[#0b0c10] via-[#0f1115] to-[#050608] text-white">

                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1c1c_1px,transparent_1px),linear-gradient(to_bottom,#1c1c1c_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
                <div className="absolute w-[500px] h-[500px] rounded-full bg-green-500/10 blur-3xl top-[-100px] left-[-200px]" />
                <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl bottom-[-150px] right-[-200px]" />

                <div className="relative z-10 items-center mr-6 flex">
                    <div className="h-full w-[600px] bg-gradient-to-b from-green-200 to-cyan-400 bg-clip-text py-8 text-xl font-extrabold text-transparent sm:text-6xl">
                        <h1>Start the future of Surveillance</h1>
                        <div className="flex gap-2">
                            <p className="text-sm mt-2 uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text">AI That Never Blinks</p>
                            <p className="text-sm mt-2 uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text">|</p>

                            <p className="text-sm mt-2 uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text">Smarter Eyes for Safer Places</p>
                        </div>

                        <button
                            onClick={toggleSystem}
                            className="cursor-pointer bg-gradient-to-b from-white to-cyan-400  rounded-full text-[16px] px-10 py-3 relative text-white mt-4"
                        >

                            <span className="flex gap-3">
                                {isCameraActive ? 'Stop System' : 'Start System'}
                            </span>
                        </button>
                    </div>

                    <div className="w-[800px] relative ">
                        <div className="z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-600/50">
                            {isCameraActive ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        className=" object-cover"
                                        width={800}
                                        height={480}
                                        autoPlay
                                        muted
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute top-0 left-0 w-full h-full"
                                        width={400}
                                        height={400}
                                    />
                                </>
                            ) : (
                                <>
                                    <video
                                        src="/Loader/face.mp4"
                                        className="w-[800px]  h-[480px] object-fill"
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
                    {showPopup && <Popup
                        open={showPopup}
                        title="Unknown Person Detected!"
                        subtitle="Security Alert"
                        message="An unrecognized face has been detected by the camera. Please verify the identity immediately."
                        onClose={handleClose}
                        onConfirm={handleConfirm}
                    />}
                </div>
            </div>

            {/* Mobile Responsiveness */}
            <div className="relative sm:hidden flex flex-col lg:flex-row items-center justify-center min-h-screen overflow-hidden bg-gradient-to-b from-[#0b0c10] via-[#0f1115] to-[#050608] text-white px-4">

                {/* Grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1c1c_1px,transparent_1px),linear-gradient(to_bottom,#1c1c1c_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

                {/* Glow Orbs */}
                <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full bg-green-500/10 blur-3xl top-[-80px] left-[-120px]" />
                <div className="absolute w-[350px] h-[350px] md:w-[450px] md:h-[450px] lg:w-[600px] lg:h-[600px] rounded-full bg-cyan-500/10 blur-3xl bottom-[-100px] right-[-150px]" />

                {/* MAIN CONTENT WRAPPER */}
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">

                    {/* CAMERA BOX */}
                    <div className="w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] md:w-[350px] md:h-[350px] lg:w-[300px] lg:h-[300px] relative">

                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-600/50 relative w-full h-full">
                            {isCameraActive ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        className="object-cover w-full h-full"
                                        autoPlay
                                        muted
                                    />

                                    <canvas
                                        ref={canvasRef}
                                        className="absolute top-0 left-0 w-full h-full"
                                    />
                                </>
                            ) : (
                                <video
                                    src="/Loader/face.mp4"
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                />
                            )}
                        </div>
                    </div>

                    {/* TEXT + BUTTON */}
                    <div className="text-center lg:text-left w-full max-w-[450px] px-2">
                        <h1 className="bg-gradient-to-b from-green-200 to-cyan-400 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold">
                            Start the future of Surveillance
                        </h1>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-2">
                            <p className="text-xs sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">AI That Never Blinks</p>
                            <p className="text-xs sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">|</p>
                            <p className="text-xs sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">Smarter Eyes for Safer Places</p>
                        </div>

                        <button
                            onClick={toggleSystem}
                            className="cursor-pointer bg-gradient-to-b from-white to-cyan-400 rounded-full text-[14px] sm:text-[16px] px-8 py-3 sm:px-10 sm:py-3 relative text-white mt-5 mx-auto lg:mx-0"
                        >
                            {isCameraActive ? "Stop System" : "Start System"}
                        </button>
                    </div>

                    {/* POPUP */}
                    {showPopup && (
                        <Popup
                            open={showPopup}
                            title="Unknown Person Detected!"
                            subtitle="Security Alert"
                            message="An unrecognized face has been detected by the camera. Please verify the identity immediately."
                            onClose={handleClose}
                            onConfirm={handleConfirm}
                        />
                    )}

                </div>
            </div>

        </>
    );
};

export default Face;