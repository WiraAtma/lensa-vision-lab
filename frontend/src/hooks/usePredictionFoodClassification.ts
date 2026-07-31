"use client";

import { useState, useCallback } from "react";
import { predictFoodClassification, PredictionResponse } from "@/lib/api";

export function usePredictionFoodClassification() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (imageBlob: Blob) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await predictFoodClassification(imageBlob);
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
