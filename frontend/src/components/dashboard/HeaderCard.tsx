"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import LittlePowerRobot from "../../../public/lotties/littlePowerRobot.json";

export const HeaderCard = () => {
  const fullText = "Welcome To LensaVision Lab";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let currentText = "";
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentText += fullText[currentIndex];
      setDisplayedText(currentText);
      currentIndex++;

      if (currentIndex === fullText.length) {
        clearInterval(interval);
      }
    }, 100); // Adjust typing speed here

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
      <div className="flex-shrink-0">
        <Lottie className="w-[140px] sm:w-[180px]" animationData={LittlePowerRobot} />
      </div>
      <div className="flex flex-col text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 min-h-[40px] sm:min-h-[60px] flex items-center justify-center sm:justify-start">
          {displayedText}
          <span className="inline-block w-[3px] h-[32px] sm:h-[40px] md:h-[48px] ml-2 bg-blue-500 animate-cursor-blink rounded-full"></span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
          Open-source model experiments. Test different AI models, explore predictions, and learn from real-world model performance.
        </p>
      </div>
    </div>
  );
};