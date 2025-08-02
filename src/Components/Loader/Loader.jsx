import React from "react";

const Loader = ({ onEnd }) => {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-black">
            <video
                autoPlay
                muted
                onEnded={onEnd}
                className="w-full h-full object-cover"
            >
                <source src="/Loader/loader.mp4" type="video/mp4" />
            </video>
        </div>
    );
};

export default Loader;
