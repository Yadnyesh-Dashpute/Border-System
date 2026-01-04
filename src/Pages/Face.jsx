import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { loadModels, detectFaces, resetUnknownLock } from "../../public/FaceJs/script";
import Popup from "../Components/Popup";
import Form from "../Components/Form";
import { sendIntruderAlert } from "../../public/Services/emailService";
import { uploadToCloudinary } from "../../public/Services/uploadToCloudinary";
import { toastSuccess, toastError } from "./ToastifyComponent";



const Face = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [detectedImage, setDetectedImage] = useState(null);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);


    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const alarmRef = useRef(null);
    const unknownAlarmRef = useRef(null);
    const criticalAlarmRef = useRef(null);

    const [isCameraActive, setIsCameraActive] = useState(false);

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        const handleAlert = (e) => {
            setDetectedImage(e.detail.image);
            setShowPopup(true);

            unknownAlarmRef.current = new Audio("/unknown-person.mp3");
            unknownAlarmRef.current.loop = true;
            unknownAlarmRef.current.volume = 0.8;

            unknownAlarmRef.current.play().catch(() => {
                console.warn("Unknown alarm blocked until user interaction");
            });
        };

        window.addEventListener("unknown-face-detected", handleAlert);
        return () => window.removeEventListener("unknown-face-detected", handleAlert);
    }, []);

    const base64ToFile = async (base64, filename = "intruder.jpg") => {
        const res = await fetch(base64);
        const blob = await res.blob();
        return new File([blob], filename, { type: "image/jpeg" });
    };


    const handleClose = () => {
        setShowPopup(false);

        if (alarmRef.current) {
            alarmRef.current.pause();
            alarmRef.current.currentTime = 0;
        }
    };

    const handleAllow = () => {
        setShowPopup(false);
        setShowSaveConfirm(true);

        unknownAlarmRef.current?.pause();
        unknownAlarmRef.current.currentTime = 0;
    };

    const handleSaveYes = () => {
        setShowSaveConfirm(false);
        setShowForm(true);
    };

    const handleSaveNo = () => {
        setShowSaveConfirm(false);

        resetUnknownLock();
    };



    const handleDisallow = async () => {
        setShowPopup(false);

        unknownAlarmRef.current?.pause();
        unknownAlarmRef.current.currentTime = 0;

        criticalAlarmRef.current = new Audio("/alert-sound.mp3");
        criticalAlarmRef.current.play().catch(() => { });

        const timestamp = new Date().toLocaleString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });


        try {
            if (!detectedImage) {
                console.warn("No intruder image available");
                resetUnknownLock();
                return;
            }


            const file = await base64ToFile(detectedImage);


            const imageUrl = await uploadToCloudinary(file);


            await sendIntruderAlert({
                imageUrl,
                timestamp,
            });

            toastSuccess("Intruder alert email sent");
        } catch (err) {
            toastError("Failed to send intruder alert", err);
        }



        resetUnknownLock();
    };


    const handleConfirm = () => {
        setShowPopup(false);
        setShowForm(true);
        toastSuccess("User denied notification or closed alert");

        alarmRef.current = new Audio("/alert-sound.mp3");
        alarmRef.current.play().catch(() => {
            console.warn("Audio blocked until user interaction");
        });
        resetUnknownLock();
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
            <div className="relative flex sm:flex-row flex-col lg:flex-row items-center justify-center sm:h-screen min-h-screen overflow-hidden bg-gradient-to-b from-[#0b0c10] via-[#0f1115] to-[#050608] text-white px-4">

                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1c1c_1px,transparent_1px),linear-gradient(to_bottom,#1c1c1c_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

                <div className="absolute  w-[300px] h-[300px] md:h-[400px] lg:w-[500px] lg:h-[500px] sm:w-[500px] sm:h-[500px] rounded-full bg-green-500/10 blur-3xl top-[-80px] left-[-120px] lg:top-[-100px] lg:left-[-200px]" />
                <div className="absolute lg:w-[600px] lg:h-[600px] md:w-[450px] md:h-[450px] w-[350px] h-[350px]  rounded-full bg-cyan-500/10 blur-3xl lg:bottom-[-150px] lg:right-[-200px] bottom-[-100px] right-[-150px]" />



                <div className="relative z-10 gap-10 sm:flex flex flex-col-reverse items-center sm:flex-col lg:flex-row sm:items-center px-2  lg:text-left  sm:max-w-full text-center sm:mr-6 ">
                    <div className="h-full hidden sm:block w-[600px] bg-gradient-to-b from-green-200 to-cyan-400 bg-clip-text py-8 text-xl font-extrabold text-transparent sm:text-6xl">

                        <h1>Start the future of Surveillance</h1>


                        <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-2">
                            <p className="text-xs sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">AI That Never Blinks</p>
                            <p className="text-xs sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">|</p>

                            <p className="text-xs sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">Smarter Eyes for Safer Places</p>
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


                    <div className="text-center sm:hidden  lg:text-left w-full max-w-[450px] px-2">
                        <h1 className="bg-gradient-to-b from-green-200 to-cyan-400 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold">
                            Start the future of Surveillance
                        </h1>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-2">
                            <p className="text-[11px] sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">AI That Never Blinks</p>
                            <p className="text-[10px] sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">|</p>
                            <p className="text-[11px] sm:text-sm uppercase bg-gradient-to-b from-white to-cyan-400 bg-clip-text text-transparent">Smarter Eyes for Safer Places</p>
                        </div>

                        <button
                            onClick={toggleSystem}
                            className="cursor-pointer bg-gradient-to-b from-white to-cyan-400 rounded-full text-[14px] sm:text-[16px] px-8 py-3 sm:px-10 sm:py-3 relative text-white mt-5 mx-auto lg:mx-0"
                        >
                            {isCameraActive ? "Stop System" : "Start System"}
                        </button>
                    </div>


                    <div className="sm:w-[700px] w-full max-w-[300px] sm:h-full h-[300px] sm:max-w-none 
                aspect-video relative flex items-center justify-center">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-600/50">

                            {isCameraActive && (
                                <>
                                    <video
                                        ref={videoRef}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        autoPlay
                                        muted
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0 w-full h-full"
                                    />
                                </>
                            )}

                            {!isCameraActive && (
                                <video
                                    src="/Loader/face.mp4"
                                    className="absolute inset-0 w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                />
                            )}

                        </div>
                    </div>

                    {showPopup && (
                        <Popup
                            open={showPopup}
                            title="Unknown Person Detected!"
                            subtitle="Security Alert"
                            message="An unrecognized face has been detected by the camera. Please verify the identity immediately."
                            onClose={handleClose}
                            onAllow={handleAllow}
                            onDisallow={handleDisallow}
                            onConfirm={handleConfirm}
                        />
                    )}

                    {showSaveConfirm && (
                        <Popup
                            open={showSaveConfirm}
                            title="Save Person Details?"
                            subtitle="Optional Action"
                            message="Do you want to save this person's details for future recognition?"
                            onAllow={handleSaveYes}
                            onDisallow={handleSaveNo}
                            onClose={handleSaveNo}
                        />
                    )}


                    <Form
                        open={showForm}
                        detectedImage={detectedImage}
                        onClose={() => {
                            setShowForm(false);
                            resetUnknownLock();
                        }}
                        onSubmit={() => {
                            setShowForm(false);
                            resetUnknownLock();
                        }}
                    />

                </div>
            </div>

        </>
    );
};

export default Face;