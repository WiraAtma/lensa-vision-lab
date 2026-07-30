"use client"

import { FaGithub, FaUsers } from "react-icons/fa";
import Lottie from "lottie-react";
import CollaborativeWork from "../../../public/lotties/collaborativeWork.json";
import ParticleField from "@/components/ParticleField";

export default function AboutUs() {
  const repoUrl = "https://github.com/WiraAtma/lensa-vision-lab";
  
  return (
    <div className="relative">
    <ParticleField position="top" />
    <ParticleField position="bottom" />
    <div className="max-w-2xl mx-auto py-12 px-6">
    <div className="flex flex-col md:flex-row items-center gap-10">
      <div className="flex justify-center md:w-1/2">
        <Lottie
          animationData={CollaborativeWork}
          className="w-64 h-64"
        />
      </div>
      <div className="md:w-1/2">
        <h1 className="text-3xl font-bold mb-6">
          About Us
        </h1>
        <p className="text-lg text-neutral-700 leading-relaxed">
          Welcome to LensaVision Lab. We are dedicated to exploring the boundaries
          of Artificial Intelligence and Computer Vision. This laboratory serves
          as a playground for experimenting with various AI models, including our
          handwritten digit prediction model.
        </p>
      </div>
    </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Our Contributors</h2>
        <p className="text-neutral-500 mb-8">Join the brilliant minds building LensaVision Lab.</p>
        
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="block mb-10 hover:opacity-90 transition-opacity">
          <img 
            src="https://contrib.rocks/image?repo=WiraAtma/lensa-vision-lab" 
            alt="LensaVision Lab Contributors" 
            className="mx-auto max-w-full"
          />
        </a>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href={`${repoUrl}/pulls`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-sm hover:shadow"
          >
            <FaUsers className="text-xl" />
            Open Collaborator
          </a>
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
    </div>
    </div>
  );
}
