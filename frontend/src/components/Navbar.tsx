"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PredictionModal from "./PredictionModal";
import { FaGithub } from "react-icons/fa";
import { HiBars3, HiXMark } from "react-icons/hi2";
import Lottie from "lottie-react";
import Labs from "../../public/lotties/labs.json";
import { FiSearch } from "react-icons/fi";

export default function Navbar() {
  const repoUrl = "https://github.com/WiraAtma/lensa-vision-lab";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isApple = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isShortcut =
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k";

      if (!isShortcut) return;

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) return;

      e.preventDefault();
      setIsModalOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
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
              Dashboard
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-neutral-100 hover:text-blue-600"
            >
              <FiSearch className="h-4 w-4 text-neutral-500" />

              <span>Search Models</span>

              <kbd className="ml-1 rounded-md border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                {isApple ? "⌘ K" : "Ctrl + K"}
              </kbd>
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