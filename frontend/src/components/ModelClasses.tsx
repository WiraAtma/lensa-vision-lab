interface ModelClassesProps {
  classes: string[];
}

export const ModelClasses = ({ classes }: ModelClassesProps) => {
  return (
    <div className="w-full my-10 border p-5 border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">
        Class Names
      </h3>

      <div className="flex flex-wrap gap-2">
        {classes.map((item) => (
          <span
            key={item}
            className="rounded-md bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};