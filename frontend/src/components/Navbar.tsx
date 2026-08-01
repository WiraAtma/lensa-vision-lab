"use client";

import { useState } from "react";
import Link from "next/link";
import PredictionModal from "./PredictionModal";
import { FaGithub } from "react-icons/fa";
import Lottie from "lottie-react";
import Labs from "../../public/lotties/labs.json";

export default function Navbar() {
  const repoUrl = "https://github.com/WiraAtma/lensa-vision-lab";
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center font-semibold text-lg"
      >
        <Lottie
          className="w-12.5 h-12.5 sm:w-15 sm:h-15"
          animationData={Labs}
        />
        <span>
          LensaVision Lab
        </span>
      </Link>
        <div className="flex gap-3 sm:gap-6 items-center text-xs sm:text-sm font-medium">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="hover:text-blue-600 transition-colors"
          >
            Search Models
          </button>
          <Link href="/about" className="hover:text-blue-600 transition-colors">
            About Us
          </Link>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={repoUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow"
            >
              <FaGithub className="text-xl" />
              Source Code
            </a>
          </div>
        </div>
      </nav>

      <PredictionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
