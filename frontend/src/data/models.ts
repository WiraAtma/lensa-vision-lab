export interface AIModel {
  id: string;
  name: string;
  description: string;
  path: string;
  image?: string;
}

export const aiModels: AIModel[] = [
  {
    id: "handwritten-digit",
    name: "Handwritten Prediction",
    description: "Draw a digit and predict",
    path: "/predict/handwritten",
    image: "/image/handwritten.png"
  },
  {
    id: "food-classification",
    name: "Food Classification",
    description: "Upload your favorite food and predict",
    path: "/predict/food-classification",
    image: "/image/food_classification.jpg"
  },
  {
    id: "sign-languange-classification",
    name: "Hand Sign Languange",
    description: "Upload Hand Sign Languange and predict",
    path: "/predict/sign-languange-classification",
    image: "/image/sign_languange_classification.jpg"
  },
];
