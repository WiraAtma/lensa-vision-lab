import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  probabilities: {
    class: string;
    probability: number;
  }[];
}

export async function pingServer(): Promise<boolean> {
  const response = await api.get("/");
  return response.status === 200;
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

export async function predictFoodClassification(
  imageBlob: Blob
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", imageBlob, "food.png");

  const response = await api.post<PredictionResponse>(
    "/predict/food_classification",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}

export async function predictSignLanguangeClassification(
  imageBlob: Blob
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", imageBlob, "sign-languange.png");

  const response = await api.post<PredictionResponse>(
    "/predict/sign_languange_classification",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}

export async function predictFacialExpressionsClassification(
  imageBlob: Blob
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", imageBlob, "facial-expressions.png");

  const response = await api.post<PredictionResponse>(
    "/predict/facial_expressions_classification",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}

export default api;
