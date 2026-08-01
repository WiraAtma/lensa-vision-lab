"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import Image from "next/image";
import PredictionResult from "@/components/predict/handwritten/PredictionResult";
import ProbabilityChart from "@/components/predict/handwritten/ProbabilityChart";
import { InfoModelCanWrong } from "@/components/InfoModelCanWrong";
import { ModelInfoCard } from "@/components/ModelInfoCard";
import { ModelClasses } from "@/components/ModelClasses";
import { SignLanguangeClasses } from "@/data/classes";
import ParticleField from "@/components/ParticleField";
import { usePredictionSignLanguangeClassification } from "@/hooks/usePredictionSignLanguangeClassification";
import { CounterPredict } from "@/components/CounterPredictCard";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function FoodClassificationPage() {
  const { prediction, isLoading, error, predict, reset } = usePredictionSignLanguangeClassification();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Realtime state
  const [isRealtimeOpen, setIsRealtimeOpen] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const realtimeVideoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const realtimeStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPredictTimeRef = useRef<number>(0);
  const isPredictingRef = useRef<boolean>(false);

  const HAND_CONNECTIONS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // ibu jari
    [0, 5], [5, 6], [6, 7], [7, 8],       // telunjuk
    [5, 9], [9, 10], [10, 11], [11, 12],  // tengah
    [9, 13], [13, 14], [14, 15], [15, 16],// manis
    [13, 17], [17, 18], [18, 19], [19, 20], // kelingking
    [0, 17],                              // dasar telapak
  ];


  useEffect(() => {
    return () => {
      stopCameraStream();
      handleCloseRealtime();
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

  const handleOpenRealtime = async () => {
    setRealtimeError(null);
    setFileError(null);
    handleCloseCamera(); // pastikan mode "Take Photo" ketutup dulu

    if (!navigator.mediaDevices?.getUserMedia) {
      setRealtimeError("Camera is not supported on this device/browser.");
      return;
    }

    try {
      if (!landmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      realtimeStreamRef.current = stream;
      setIsRealtimeOpen(true);

      requestAnimationFrame(() => {
        if (realtimeVideoRef.current) {
          realtimeVideoRef.current.srcObject = stream;
          realtimeVideoRef.current.onloadedmetadata = () => {
            realtimeVideoRef.current?.play();
            realtimeLoop();
          };
        }
      });
    } catch (err) {
      setRealtimeError(
        "Unable to access the camera. Please make sure camera permission is granted."
      );
    }
  };

  const handleCloseRealtime = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (realtimeStreamRef.current) {
      realtimeStreamRef.current.getTracks().forEach((track) => track.stop());
      realtimeStreamRef.current = null;
    }
    setIsRealtimeOpen(false);
  };

  const realtimeLoop = useCallback(() => {
    const video = realtimeVideoRef.current;
    const overlay = overlayCanvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !overlay || !landmarker || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(realtimeLoop);
      return;
    }

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const result = landmarker.detectForVideo(video, performance.now());

    if (result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      const xs = landmarks.map((p) => p.x * overlay.width);
      const ys = landmarks.map((p) => p.y * overlay.height);

      // gambar garis penghubung antar landmark
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      HAND_CONNECTIONS.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(xs[start], ys[start]);
        ctx.lineTo(xs[end], ys[end]);
        ctx.stroke();
      });

      // gambar titik di tiap sendi
      ctx.fillStyle = "#ef4444";
      landmarks.forEach((_, i) => {
        ctx.beginPath();
        ctx.arc(xs[i], ys[i], 4, 0, Math.PI * 2);
        ctx.fill();
      });

      const pad = 20;
      const x1 = Math.max(Math.min(...xs) - pad, 0);
      const y1 = Math.max(Math.min(...ys) - pad, 0);
      const x2 = Math.min(Math.max(...xs) + pad, overlay.width);
      const y2 = Math.min(Math.max(...ys) + pad, overlay.height);

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const now = performance.now();
      if (!isPredictingRef.current && now - lastPredictTimeRef.current > 1500) {
        lastPredictTimeRef.current = now;
        sendRealtimeCrop(video, x1, y1, x2 - x1, y2 - y1);
      }
    }

    animationFrameRef.current = requestAnimationFrame(realtimeLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendRealtimeCrop = async (
    video: HTMLVideoElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const cropCanvas = cropCanvasRef.current;
    if (!cropCanvas || w <= 0 || h <= 0) return;

    cropCanvas.width = w;
    cropCanvas.height = h;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, x, y, w, h, 0, 0, w, h);

    cropCanvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `realtime-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        isPredictingRef.current = true;
        try {
          await predict(file);
        } finally {
          isPredictingRef.current = false;
        }
      },
      "image/jpeg",
      0.9
    );
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

      <h1 className="text-2xl font-bold mb-6">Hand Sign Languange Classification</h1>

      <ModelInfoCard
        name="Hand Sign Languange Classification"
        architecture="EfficientNet-B0"
        techstack="Python, PyTorch, MediaPipe, OpenCV"
        datasets="American Sign Languange (Kaggle)"
        author="Wira Atmaja"
        version="1"
      />

      <div className="flex flex-col lg:flex-row gap-8 mb-8">
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
                alt="Uploaded Hand Sign Languange"
                width={500}
                height={500}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-neutral-600 text-sm">
                Upload a Hand Sign Languange image →
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <p className="text-sm text-neutral-500">Upload Here</p>

          <div className="w-full max-w-125 aspect-square border-2 border-dashed border-neutral-300 rounded-lg bg-white flex flex-col items-center justify-center gap-4 p-6">
            {isCameraOpen ? (
              <>
                <div className="w-full aspect-square max-h-95 overflow-hidden rounded-lg bg-black">
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
            )  : isRealtimeOpen ? (
              <>
                <div className="relative w-full aspect-square max-h-95 overflow-hidden rounded-lg bg-black">
                  <video
                    ref={realtimeVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />

                  {prediction && (
                    <div className="absolute top-2 left-2 rounded bg-black/70 px-3 py-1 text-sm text-lime-400">
                      {prediction.prediction} ({prediction.confidence}%)
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCloseRealtime}
                  className="rounded-lg border border-neutral-300 bg-white px-6 py-2 text-neutral-700 text-sm transition hover:bg-neutral-100"
                >
                  Stop Realtime
                </button>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="sign-languange-upload-input"
                />

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="sign-languange-upload-input"
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

                  <button
                    type="button"
                    onClick={handleOpenRealtime}
                    className="cursor-pointer rounded-lg border border-neutral-800 bg-white px-6 py-3 text-neutral-800 text-sm transition hover:bg-neutral-100"
                  >
                    Realtime Predict Webcam
                  </button>
                </div>

                <p className="text-xs text-neutral-500 text-center">
                  Format: JPG or PNG only.
                </p>

                {fileError && (
                  <p className="text-xs text-red-600 text-center">{fileError}</p>
                )}

                {cameraError && (
                  <p className="text-xs text-red-600 text-center">{cameraError}</p>
                )}

                {realtimeError && (
                  <p className="text-xs text-red-600 text-center">{realtimeError}</p>
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
          <canvas ref={cropCanvasRef} className="hidden" />
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
      
      <ModelClasses classes={SignLanguangeClasses} />

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
              <strong> American Sign Languange</strong> dataset.
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
                that has been fine-tuned for the <strong>American Sign Languange</strong> dataset.
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
          href="https://github.com/WiraAtma/lensa-vision-lab/blob/main/experiments/sign_languange_efficientnet_b0.ipynb"
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