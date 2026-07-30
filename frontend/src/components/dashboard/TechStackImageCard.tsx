import Image from "next/image";

interface TechStack {
  name: string;
  image: string;
}

interface TechStackImageCardProps {
  items: TechStack[];
}

export const TechStackImageCard = ({
  items,
}: TechStackImageCardProps) => {
  return (
    <div className="w-full mt-[100px]">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">
          Technologies We Use
        </h2>

        <p className="mt-2 text-neutral-600">
          Built with modern tools and frameworks for developing,
          training, and deploying computer vision experiments.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
        {items.map((tech) => (
          <div
            key={tech.name}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative h-14 w-14">
              <Image
                src={tech.image}
                alt={tech.name}
                fill
                className="object-contain grayscale opacity-70 hover:opacity-100 transition"
              />
            </div>

            <span className="mt-3 text-sm text-neutral-600">
              {tech.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};