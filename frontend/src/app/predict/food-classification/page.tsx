"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PredictionResult from "@/components/predict/handwritten/PredictionResult";
import ProbabilityChart from "@/components/predict/handwritten/ProbabilityChart";
import { InfoModelCanWrong } from "@/components/InfoModelCanWrong";
import { ModelInfoCard } from "@/components/ModelInfoCard";
import { ModelClasses } from "@/components/ModelClasses";
import { FoodClasses } from "@/data/classes";
import { usePredictionFoodClassification } from "@/hooks/usePredictionFoodClassification";
import ParticleField from "@/components/ParticleField";
import { CounterPredict } from "@/components/CounterPredictCard";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function FoodClassificationPage() {
  const { prediction, isLoading, error, predict, reset } = usePredictionFoodClassification();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Make sure the camera is turned off when the component unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Unsupported format. Only JPG and PNG are allowed.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFileError(null);

    // Create a preview from the selected file
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    // Send to API
    predict(file);
  };

  const handleOpenCamera = async () => {
    setCameraError(null);
    setFileError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      // Wait for the video element to render, then attach the stream
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (err) {
      setCameraError(
        "Unable to access the camera. Please make sure camera permission is granted."
      );
    }
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Failed to capture photo. Please try again.");
          return;
        }

        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        // Create a preview from the captured photo
        const url = URL.createObjectURL(file);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });

        // Send to API
        predict(file);

        // Close the camera after a successful capture
        handleCloseCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  const handleClear = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileError(null);
    setCameraError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    reset();
  };

  return (
    <div>
      {prediction && (
        <>
          <ParticleField position="top" />
          <ParticleField position="bottom" />
        </>
      )}

      <h1 className="text-2xl font-bold mb-6">Food Classification</h1>

      <ModelInfoCard
        name="Food Classification"
        architecture="EfficientNet-B0"
        techstack="Python, PyTorch"
        datasets="Food 101"
        author="Wira Atmaja"
        version="1"
      />

      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <p className="text-sm text-neutral-500">Predicted Image</p>
          <div
            className={`w-full max-w-[500px] aspect-square border-2 border-neutral-300 rounded-lg bg-white flex items-center justify-center overflow-hidden ${
              isLoading ? "animate-blink" : ""
            }`}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Uploaded food"
                width={500}
                height={500}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-neutral-600 text-sm">
                Upload a food image →
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <p className="text-sm text-neutral-500">Upload Here</p>

          <div className="w-full max-w-[500px] aspect-square border-2 border-dashed border-neutral-300 rounded-lg bg-white flex flex-col items-center justify-center gap-4 p-6">
            {isCameraOpen ? (
              <>
                <div className="w-full aspect-square max-h-[380px] overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-2 text-white text-sm transition hover:bg-neutral-700"
                  >
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCamera}
                    className="rounded-lg border border-neutral-300 bg-white px-6 py-2 text-neutral-700 text-sm transition hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="food-upload-input"
                />

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="food-upload-input"
                    className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-3 text-white text-sm transition hover:bg-neutral-700"
                  >
                    Choose Image
                  </label>

                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="cursor-pointer rounded-lg border border-neutral-800 bg-white px-6 py-3 text-neutral-800 text-sm transition hover:bg-neutral-100"
                  >
                    Take Photo
                  </button>
                </div>

                <p className="text-xs text-neutral-500 text-center">
                  Format: JPG or PNG only. WEBP and other formats are not supported.
                </p>

                {fileError && (
                  <p className="text-xs text-red-600 text-center">{fileError}</p>
                )}

                {cameraError && (
                  <p className="text-xs text-red-600 text-center">{cameraError}</p>
                )}

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg border border-red-300 bg-red-50 px-6 py-2 text-red-600 text-sm transition hover:bg-red-100"
                  >
                    Remove Image
                  </button>
                )}
              </>
            )}
          </div>

          {/* Hidden canvas, only used to capture a frame from the video */}
          <canvas ref={canvasRef} className="hidden" />
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

      <div className="mt-10 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Model Information</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">EfficientNet-B0</h3>

            <p className="mt-2 leading-relaxed text-neutral-700">
              This application uses <strong>EfficientNet-B0</strong>, a modern
              Convolutional Neural Network (CNN) architecture developed by Google
              Research. Instead of manually designing every convolution layer, the
              model leverages the official implementation provided by
              <strong> torchvision.models</strong> together with pretrained ImageNet
              weights. The final classification layer is replaced and the network is
              fine-tuned to classify food images from the
              <strong> Food-101</strong> dataset.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Model Architecture</h3>

            <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <pre className="text-sm text-neutral-800">
                <code>{`
      from torchvision.models import (
          efficientnet_b0,
          EfficientNet_B0_Weights,
      )
      import torch.nn as nn

      # Load pretrained EfficientNet-B0
      model = efficientnet_b0(
          weights=EfficientNet_B0_Weights.DEFAULT
      )

      # Replace classifier
      in_features = model.classifier[1].in_features

      model.classifier = nn.Sequential(
          nn.Dropout(0.2),
          nn.Linear(
              in_features,
              len(class_names)
          )
      )
                `}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">How It Works</h3>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-700">
              <li>
                The uploaded or captured image is resized to <strong>224 × 224</strong>{" "}
                pixels, the standard input resolution for EfficientNet-B0.
              </li>

              <li>
                The image is normalized using the same preprocessing statistics as
                ImageNet to ensure compatibility with the pretrained model.
              </li>

              <li>
                EfficientNet-B0 extracts hierarchical visual features using
                convolutional layers and MBConv blocks with Squeeze-and-Excitation
                (SE) attention.
              </li>

              <li>
                The extracted feature representation is passed to a custom classifier
                that has been fine-tuned for the <strong>Food-101</strong> dataset.
              </li>

              <li>
                The classifier computes probabilities for each food category, and the
                class with the highest confidence score is returned as the final
                prediction.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <a
          href="https://github.com/WiraAtma/lensa-vision-lab/blob/main/experiments/food_efficientnet_b0.ipynb"
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