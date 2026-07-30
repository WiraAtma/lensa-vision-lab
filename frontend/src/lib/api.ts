import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  probabilities: {
    class: string;
    probability: number;
  }[];
}

export async function predictHandwrittenDigit(
  imageBlob: Blob
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", imageBlob, "digit.png");

  const response = await api.post<PredictionResponse>(
    "/predict/handwritten_digit",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}

export default api;
