"use client";

import { useState } from "react";
import Link from "next/link";
import PredictionModal from "./PredictionModal";
import { FaGithub } from "react-icons/fa";
import { HiBars3, HiXMark } from "react-icons/hi2";
import Lottie from "lottie-react";
import Labs from "../../public/lotties/labs.json";

export default function Navbar() {
  const repoUrl = "https://github.com/WiraAtma/lensa-vision-lab";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-neutral-200">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center font-semibold text-lg">
            <Lottie
              className="w-12.5 h-12.5 sm:w-15 sm:h-15"
              animationData={Labs}
            />
            <span>LensaVision Lab</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="hover:text-blue-600 transition-colors"
            >
              Home
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              Search Models
            </button>

            <Link
              href="/about"
              className="hover:text-blue-600 transition-colors"
            >
              About Us
            </Link>

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

          {/* Mobile Burger */}
          <button
            className="md:hidden text-3xl"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <HiXMark /> : <HiBars3 />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            isMenuOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-4 px-6 pb-6 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-blue-600 transition-colors"
            >
              Home
            </Link>

            <button
              onClick={() => {
                setIsModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="text-left hover:text-blue-600 transition-colors"
            >
              Search Models
            </button>

            <Link
              href="/about"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-blue-600 transition-colors"
            >
              About Us
            </Link>

            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium transition-all"
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