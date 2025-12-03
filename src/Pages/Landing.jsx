import TextType from "../Components/Loader/Text/TextType";
import TrueFocus from "../Components/Loader/Text/TrueFocus";
import Lottie from "lottie-react";
import borderAnimation from "../assets/Chat-Bot.json";
import GridBackground from "../Components/Background/GridBackground";
import { ArrowRight } from "lucide-react";


const Landing = () => {
    return (
        <div className="relative h-screen w-full overflow-hidden">


            <GridBackground />

            <>
                <div className="absolute top-0 z-10  h-full sm:flex items-center justify-center hidden">
                    <div className="flex flex-col lg:flex-row gap-10 px-60  text-start font-extrabold text-4xl  md:text-7xl w-full ">


                        <div className="flex-1 mt-10">
                            <div className="w-[700px]">
                                <div className="h-50 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text py-8 text-4xl font-extrabold text-transparent sm:text-7xl">

                                    <TextType
                                        text={["Welcome To Border \n Surveillance System", "AI-Powered Border \n Protection System"]}
                                        typingSpeed={225}
                                        pauseDuration={2500}
                                        showCursor={true}
                                        cursorCharacter=""
                                    />
                                </div>
                                <div className="w-fit">
                                    <TrueFocus
                                        sentence=" Watch, Verify, Secure."
                                        manualMode={false}
                                        blurAmount={5}
                                        borderColor="red"
                                        animationDuration={2}
                                        pauseBetweenAnimations={1}
                                    />
                                </div>
                            </div>
                            <div className="w-full flex justify-start mt-10">
                                <div className="flex gap-4 flex-col sm:flex-row justify-center text-xl">
                                    <a href="/face" className="cursor-pointer">
                                        <button

                                            className="cursor-pointer animated-border text-[16px]  px-10 py-3 relative text-white rounded-md"
                                        >

                                            <span className="flex gap-3">Try Now <ArrowRight /></span>

                                        </button>
                                    </a>
                                </div>
                            </div>
                        </div>



                        <div className=" flex-1">
                            <div className="flex-1 flex h-full mt-10 justify-center items-center">
                                <div className="w-80 h-80 flex items-center justify-center rounded-lg">
                                    <Lottie animationData={borderAnimation} loop={true} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </>

            <div className="absolute top-0 z-10 w-full h-full flex items-center justify-center sm:hidden">
                <div className="flex flex-col lg:flex-row gap-10 px-60 items-center text-center  font-extrabold text-4xl  md:text-7xl w-full ">


                    <div className="flex-1 ">
                        <div className="w-[700px]">
                            <div className="h-40 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text py-8 text-4xl font-extrabold text-transparent sm:text-7xl">

                                <TextType
                                    text={["Welcome To Border \n Surveillance System", "AI-Powered Border \n Protection System"]}
                                    typingSpeed={225}
                                    pauseDuration={2500}
                                    showCursor={true}
                                    cursorCharacter=""
                                />
                            </div>
                            <div className="w-full flex items-center justify-center">
                                <TrueFocus
                                    sentence=" Watch, Verify, Secure."
                                    manualMode={false}
                                    blurAmount={5}
                                    borderColor="red"
                                    animationDuration={2}
                                    pauseBetweenAnimations={1}
                                />
                            </div>
                        </div>
                    </div>

                    <div className=" flex-1">
                        <div className="flex-1 flex h-full mt-5 justify-center items-center">
                            <div className="w-80 h-80 flex items-center justify-center rounded-lg">
                                <Lottie animationData={borderAnimation} loop={true} />
                            </div>
                        </div>
                        <div className="w-full flex justify-center mt-10">
                            <div className="flex gap-4 flex-col sm:flex-row justify-center text-xl">
                                <a href="/face" className="cursor-pointer">
                                    <button

                                        className="cursor-pointer animated-border text-[16px]  px-10 py-3 relative text-white rounded-md"
                                    >

                                        <span className="flex gap-3">Try Now <ArrowRight /></span>

                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Landing;
