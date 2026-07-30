interface ModelInfoCardProps {
  name: string;
  architecture: string;
  techstack: string;
  datasets: string;
  author: string;
  version: string;
}

export const ModelInfoCard = ({
  name,
  architecture,
  techstack,
  datasets,
  author,
  version,
}: ModelInfoCardProps) => {
  const items = [
    { label: "Name", value: name },
    { label: "Architecture Model", value: architecture },
    { label: "Techstack", value: techstack },
    { label: "Datasets", value: datasets },
    { label: "Author", value: author },
    { label: "Version", value: version },
  ];

  return (
    <div className="w-full my-10 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 sm:flex-row sm:items-center"
          >
            <span className="w-52 text-sm font-medium text-neutral-500">
              {item.label}
            </span>

            <span className="text-sm font-semibold text-neutral-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};