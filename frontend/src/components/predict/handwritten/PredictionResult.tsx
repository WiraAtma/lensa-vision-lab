interface PredictionResultProps {
  prediction: string | null;
  confidence: number | null;
  isLoading: boolean;
}

export default function PredictionResult({
  prediction,
  confidence,
  isLoading,
}: PredictionResultProps) {
  if (!isLoading && prediction === null) {
    return (
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-center gap-3 text-neutral-400">
          <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
            ?
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-700">
              Waiting for input
            </p>
            <p className="text-sm text-neutral-500">
              Draw a handwritten digit to start prediction.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-center">
      <div className="text-center">
        <p className="text-sm text-neutral-500 mb-1">Prediction</p>
        <div
          className={`text-6xl font-bold ${
            isLoading ? "animate-blink" : ""
          }`}
        >
          {prediction}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-neutral-500 mb-1">Confidence</p>
        <div
          className={`text-2xl font-semibold ${
            isLoading ? "animate-blink" : ""
          }`}
        >
          {confidence?.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}