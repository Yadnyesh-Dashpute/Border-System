import { useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";

function Beam({ index }) {
    const flag = index % 8 === 0;
    return (
        <div
            className={cn("h-full animate-meteor", {
                "[--duration:7s]": flag,
                "[--duration:11s]": !flag,
            })}
            style={{
                width: "10px",
                transform: "translateY(-20%)",
                "--delay": `${index * 0.5}s`,
            }}
        >
            <div
                style={{
                    clipPath: "polygon(54% 0, 54% 0, 60% 100%, 40% 100%)",
                }}
                className={cn("w-full", {
                    "h-8": flag,
                    "h-12": !flag,
                })}
            >
                <div className="h-full w-full bg-gradient-to-b from-neutral-50/50 via-neutral-100 via-75% to-neutral-50" />

            </div>
        </div>
    );
}

function useGridCount() {
    const containerRef = useRef(null);
    const [verticalCount, setVerticalCount] = useState(0);
    const [horizontalCount, setHorizontalCount] = useState(0);

    useEffect(() => {
        const updateCount = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const width = rect.width;
            const height = rect.height;
            const cellSize = 60;
            setVerticalCount(Math.ceil(width / cellSize));
            setHorizontalCount(Math.ceil(height / cellSize));
        };

        updateCount();
        window.addEventListener("resize", updateCount);
        return () => window.removeEventListener("resize", updateCount);
    }, []);

    return {
        verticalCount,
        horizontalCount,
        containerRef,
    };
}

function Background() {
    const { verticalCount, horizontalCount, containerRef } = useGridCount();

    return (
        <div
            ref={containerRef}
            className="z-[-1] absolute inset-0 flex h-full w-full flex-row justify-between"
            style={{ background: "linear-gradient(to bottom, black 5%, #222 60%, black 100%)" }}

        >
            {/* Radial glow overlay */}
            <div
                style={{
                    background:
                        "radial-gradient(50% 50% at 50% 50%, #072a39 0%, rgb(7,42,57) 50%, rgba(7,42,57,0) 100%)",
                }}
                className="absolute inset-0 top-1/2 h-full w-full rounded-full opacity-40"
            />
            {/* Vertical lines + beams */}
            {Array.from({ length: verticalCount }, (_, i) => (
                <div key={`v-${i}`} className="relative h-full w-px bg-black/80 bg-opacity-10">
                    {(1 + i) % 4 === 0 && <Beam index={i + 1} />}
                </div>
            ))}
            {/* Horizontal lines */}
            {Array.from({ length: horizontalCount }, (_, i) => (
                <div
                    key={`h-${i}`}
                    className="absolute top-0 left-0 h-px w-full bg-black/80 bg-opacity-10"
                    style={{ top: `${(i / horizontalCount) * 100}%` }}
                />
            ))}
        </div>
    );
}

export default function AnimatedBeam({ children, className }) {
    return (
        <div className={cn("storybook-fix relative w-full min-h-screen overflow-hidden", className)}>
            <Background />
            <div className="relative h-full w-full">{children}</div>
        </div>
    );
}
