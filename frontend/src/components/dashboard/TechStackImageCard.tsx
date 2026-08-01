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
    <div className="w-full mt-25">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">
          Technologies We Use
        </h2>

        <p className="mt-2 text-neutral-600">
          Built with modern tools and frameworks for developing,
          training, and deploying computer vision experiments.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 max-w-225 mx-auto">
        {items.map((tech) => (
          <div
            key={tech.name}
            className="w-24 flex flex-col items-center"
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