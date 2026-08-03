import { AlertTriangle } from "lucide-react";

export const InfoModelCanWrong = () => {
  return (
    <div className="w-full my-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />

        <div>
          <p className="text-sm text-amber-900">
            Predictions may not always be accurate. Use as a reference only.
          </p>

          <p className="text-sm text-amber-900">
            Images are not stored or used for training.
          </p>
        </div>
      </div>
    </div>
  );
};