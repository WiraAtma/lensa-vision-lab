"use client";

import { useState, useCallback } from "react";
import { PredictionResponse, predictFacialExpressionsClassification } from "@/lib/api";

export function usePredictionFacialExpressionsClassification() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (imageBlob: Blob) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await predictFacialExpressionsClassification(imageBlob);
      setPrediction(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Prediction failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  return { prediction, isLoading, error, predict, reset };
}
