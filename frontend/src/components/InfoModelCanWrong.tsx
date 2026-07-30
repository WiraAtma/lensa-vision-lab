import { AlertTriangle } from "lucide-react";

export const InfoModelCanWrong = () => {
  return (
    <div className="w-full my-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-900">
          Model predictions are not always accurate. Please use the results as a reference only.
        </p>
      </div>
    </div>
  );
};