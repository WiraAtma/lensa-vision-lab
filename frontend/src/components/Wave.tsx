"use client";

import Lottie from "lottie-react";
import WaveAnimation from "../../public/lotties/wave.json";

export function Wave() {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden -mb-9 mt-10">
      <Lottie
        animationData={WaveAnimation}
        loop
        autoplay
        className="w-[180vw] sm:w-[140vw] md:w-screen max-w-none"
      />
    </div>
  );
}