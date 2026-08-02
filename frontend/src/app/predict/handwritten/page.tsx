"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import DrawingCanvas from "@/components/predict/handwritten/DrawingCanvas";
import PredictionResult from "@/components/predict/handwritten/PredictionResult";
import ProbabilityChart from "@/components/predict/handwritten/ProbabilityChart";
import { InfoModelCanWrong } from "@/components/InfoModelCanWrong";
import { ModelInfoCard } from "@/components/ModelInfoCard";
import { ModelClasses } from "@/components/ModelClasses";
import { HandWrittenClasses } from "@/data/classes";
import { usePredictionHandwrittenDigit } from "@/hooks/usePredictionHandwrittenDigit";
import ParticleField from "@/components/ParticleField";
import { CounterPredict } from "@/components/CounterPredictCard";
import { ServerStatusIndicator } from "@/components/ServerStatusIndicator";

export default function HandwrittenPredictPage() {
  const { prediction, isLoading, error, predict, reset } = usePredictionHandwrittenDigit();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleCanvasChange = (blob: Blob) => {
    // Create preview URL from canvas blob
    const url = URL.createObjectURL(blob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    // Send to API
    predict(blob);
  };

  const handleClear = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    reset();
  };

  return (
    <div>
      <ServerStatusIndicator/>
      {prediction && (
        <>
          <ParticleField position="top" />
          <ParticleField position="bottom" />
        </>
      )}

      <h1 className="text-2xl font-bold mb-6">Handwritten Digit Prediction</h1>

      <ModelInfoCard
        name="Handwritten Digit Prediction"
        architecture="LeNet-5"
        techstack="Python, PyTorch"
        datasets="MNIST (pytorch), handwritten digits 0-9 by olafkrastovski (Kaggle)"
        author="Wira Atmaja"
        version="1"
      />

      {/* Top section: Preview + Canvas */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Predicted Image Preview */}
        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <p className="text-sm text-neutral-500">Predicted Image</p>
          <div
            className={`w-full max-w-125 aspect-square border-2 border-neutral-300 rounded-lg bg-white flex items-center justify-center overflow-hidden ${
              isLoading ? "animate-blink" : ""
            }`}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Drawn digit"
                width={500}
                height={500}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-neutral-600 text-sm">
                Draw something on the canvas →
              </span>
            )}
          </div>
        </div>

        {/* Drawing Canvas */}
        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <p className="text-sm text-neutral-500">Draw Here</p>
          <DrawingCanvas
            width={500}
            height={500}
            onChange={handleCanvasChange}
            onClear={handleClear}
          />
        </div>
      </div>

      <CounterPredict
        isLoading={isLoading}
        isError={!!error}
      />


      <div className="mb-8">
        <PredictionResult
          prediction={prediction?.prediction ?? null}
          confidence={prediction?.confidence ?? null}
          isLoading={isLoading}
          />
      </div>

      {prediction?.probabilities && (
        <div className="border border-neutral-200 rounded-lg p-4 bg-white">
          <ProbabilityChart probabilities={prediction.probabilities} />
        </div>
      )}

      <InfoModelCanWrong/>

      <ModelClasses classes={HandWrittenClasses} />

      <div className="mt-10 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl font-bold mb-6">Model Information</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">LeNet-5 Architecture</h3>
            <p className="mt-2 text-neutral-700 leading-relaxed">
              This application uses <strong>LeNet-5</strong>, one of the earliest
              Convolutional Neural Network (CNN) architectures introduced by Yann
              LeCun in 1998 for handwritten digit recognition. The network learns
              image features through convolution and pooling layers before classifying
              the input into one of ten digit classes (0–9). Despite its simple
              architecture, LeNet-5 remains a strong baseline for the MNIST dataset.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Model Architecture</h3>

      <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <pre className="text-sm text-neutral-800">
      {`
      #LeNet-5 Architecture Source : https://medium.com/codex/lenet-5-complete-architecture-84c6d08215f9

      from torch import nn

      class LeNet5(nn.Module):

          """
          LeNet-5 (Paper Style)

          Reference:
          LeCun et al. (1998)
          https://ieeexplore.ieee.org/document/726791
          """

          def __init__(self, num_classes=10):
              super().__init__()

              self.features = nn.Sequential(
                  nn.Conv2d(1, 6, kernel_size=5),
                  nn.Tanh(),
                  nn.AvgPool2d(2, 2),

                  nn.Conv2d(6, 16, kernel_size=5),
                  nn.Tanh(),
                  nn.AvgPool2d(2, 2),

                  nn.Conv2d(16, 120, kernel_size=5),
                  nn.Tanh(),
              )

              self.classifier = nn.Sequential(
                  nn.Flatten(),
                  nn.Linear(120, 84),
                  nn.Tanh(),
                  nn.Linear(84, num_classes)
              )

          def forward(self, x):
              x = self.features(x)
              x = self.classifier(x)
              return x`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">How It Works</h3>

            <ul className="mt-2 list-disc pl-5 space-y-2 text-neutral-700">
              <li>The input image is resized to <strong>32 × 32</strong> grayscale pixels.</li>
              <li>Convolution layers extract important visual features from the handwritten digit.</li>
              <li>Average Pooling reduces the feature map size while preserving important information.</li>
              <li>Fully Connected layers transform the extracted features into class predictions.</li>
              <li>The output layer predicts one of <strong>10 digit classes (0–9)</strong>.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <a
          href="https://github.com/WiraAtma/lensa-vision-lab/blob/main/experiments/mnist_lenet.ipynb"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-4 text-white transition hover:bg-neutral-700"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.33-1.78-1.33-1.78-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.31 3.48 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/>
          </svg>

          <span>Source Code On GitHub</span>
        </a>
      </div>
    </div>
  );
}
