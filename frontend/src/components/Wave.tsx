"use client";

import Lottie from "lottie-react";
import WaveAnimation from "../../public/lotties/wave.json";

export function Wave() {
  return (
    <div className="w-screen overflow-hidden relative left-1/2 right-1/2 ml-[-50.5vw] -mb-9 mr-[-50vw] mt-10">
      <Lottie animationData={WaveAnimation} loop autoplay className="w-full" />
    </div>
  );
}