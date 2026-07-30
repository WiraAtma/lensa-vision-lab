"use client"

import Link from "next/link";
import Image from "next/image";
import Lottie from "lottie-react";
import Developer from "../../../public/lotties/developer.json";

interface DashboardCardProps {
  title: string;
  description?: string;
  href: string;
  image?: string;
  onClick?: () => void;
  className?: string;
}

export default function DashboardCard({
  title,
  description,
  href,
  image,
  onClick,
  className = "",
}: DashboardCardProps) {
  return (
    <Link href={href} className={`block ${className}`} onClick={onClick}>
      <div className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
        <div className="aspect-video bg-neutral-100 flex items-center justify-center">
          {image ? (
            <Image
              src={image}
              alt={title}
              width={400}
              height={225}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-4xl text-neutral-400">
              <Lottie className="w-[140px] sm:w-[180px]" animationData={Developer} />
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-sm text-neutral-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
