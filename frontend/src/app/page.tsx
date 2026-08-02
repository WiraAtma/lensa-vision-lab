"use client"

import DashboardCard from "@/components/dashboard/DashboardCard";
import { aiModels } from "@/data/models";
import { HeaderCard } from "@/components/dashboard/HeaderCard";
import ParticleField from "@/components/ParticleField";
import { TechStackImageCard } from "@/components/dashboard/TechStackImageCard";
import Lottie from "lottie-react";
import Rocket from "../../public/lotties/rocket.json";
import { ServerStatusIndicator } from "@/components/ServerStatusIndicator";
import { Wave } from "@/components/Wave";

export default function Dashboard() {
  return (
    <div className="relative">
      <ServerStatusIndicator />
      
      <ParticleField position="top" />
      <ParticleField position="bottom" />

      <HeaderCard />

      <h1 className="text-2xl mt-10 font-bold mb-6">Models</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiModels.map((model) => (
          <DashboardCard
            key={model.id}
            title={model.name}
            description={model.description}
            href={model.path}
            image={model.image}
          />
        ))}

        {/* Placeholder cards - edit/tambah sendiri */}
        <DashboardCard
          title="Coming Soon"
          description="Feature in development"
          href="#"
          className="opacity-60 cursor-default"
        />
      </div>

      <div className="flex justify-center my-80">
        <Lottie
          animationData={Rocket}
          className="w-64 h-64"
        />
      </div>

      <TechStackImageCard
        items={[
          {
            name: "PyTorch",
            image: "/techstack/pytorch.png",
          },
          {
            name: "Python",
            image: "/techstack/python.webp",
          },
          {
            name: "NumPy",
            image: "/techstack/numpy.png",
          },
          {
            name: "Matplotlib",
            image: "/techstack/matplotlib.webp",
          },
          {
            name: "Pandas",
            image: "/techstack/pandas.png",
          },
          {
            name: "FastAPI",
            image: "/techstack/fastapi.svg",
          },
          {
            name: "Next.js",
            image: "/techstack/nextjs.png",
          },
          {
            name: "Mediapipe",
            image: "/techstack/mediapipe.png",
          },
          {
            name: "OpenCV",
            image: "/techstack/opencv.png",
          },
          {
            name: "YOLO",
            image: "/techstack/yolo.svg",
          },
        ]}
      />

      <Wave/>
    </div>
  );
}
