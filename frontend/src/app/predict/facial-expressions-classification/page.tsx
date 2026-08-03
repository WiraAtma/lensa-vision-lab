"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import Image from "next/image";
import PredictionResult from "@/components/predict/handwritten/PredictionResult";
import ProbabilityChart from "@/components/predict/handwritten/ProbabilityChart";
import { InfoModelCanWrong } from "@/components/InfoModelCanWrong";
import { ModelInfoCard } from "@/components/ModelInfoCard";
import { ModelClasses } from "@/components/ModelClasses";
import { FacialExpressionsClasses } from "@/data/classes";
import ParticleField from "@/components/ParticleField";
import { CounterPredict } from "@/components/CounterPredictCard";
import { usePredictionFacialExpressionsClassification } from "@/hooks/usePredictionFacialExpressionsClassification";
import { ServerStatusIndicator } from "@/components/ServerStatusIndicator";
import { Wave } from "@/components/Wave";
import Lottie from "lottie-react";
import ThinkingAnimation from "../../../../public/lotties/thinking.json";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiRefreshCw } from "react-icons/fi";
import { MdSwitchCamera } from "react-icons/md";
import { IoCameraReverse } from "react-icons/io5";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function FacialExpressionsClassificationPage() {
  const { prediction, isLoading, error, predict, reset } = usePredictionFacialExpressionsClassification();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoFacingMode, setPhotoFacingMode] = useState<"user" | "environment">("user");
  const [isSwitchingPhotoCamera, setIsSwitchingPhotoCamera] = useState(false);

  // Realtime state
  const [isRealtimeOpen, setIsRealtimeOpen] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Button-level loading state, buat kasih feedback visual di device yang
  // lemot pas nunggu file dialog / permission kamera / model face detector.
  // isOpeningGallery: dari saat tombol "Choose Image" diklik sampai popup
  // galeri native benar-benar kebuka & ketutup (di-approx pakai window focus,
  // karena browser bakal blur window pas file picker OS kebuka).
  const [isChoosingImage, setIsChoosingImage] = useState(false);
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [isOpeningRealtime, setIsOpeningRealtime] = useState(false);

  const isAnyButtonBusy =
    isChoosingImage || isOpeningGallery || isOpeningCamera || isOpeningRealtime;

  const galleryFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryOpenDeferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const realtimeVideoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const imageFaceDetectorRef = useRef<FaceDetector | null>(null);
  const realtimeStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPredictTimeRef = useRef<number>(0);
  const isPredictingRef = useRef<boolean>(false);

  // Simpan file terakhir yang dikirim ke API supaya tombol "Restart Predict"
  // bisa langsung coba ulang tanpa minta user upload/ambil foto lagi.
  const lastFileRef = useRef<File | null>(null);

  // Detector khusus untuk gambar statis (upload / take photo), terpisah dari
  // detector realtime karena running mode-nya beda ("IMAGE" vs "VIDEO").
  const getImageFaceDetector = async (): Promise<FaceDetector> => {
    if (imageFaceDetectorRef.current) return imageFaceDetectorRef.current;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    imageFaceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });
    return imageFaceDetectorRef.current;
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        resolve(img);
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    });
  };

  const canvasToFile = (canvas: HTMLCanvasElement, prefix: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to convert canvas to blob"));
            return;
          }
          resolve(new File([blob], `${prefix}-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92
      );
    });
  };

  // Deteksi wajah pada gambar statis lalu crop. Return null kalau tidak ada
  // wajah terdeteksi, supaya caller bisa fallback ke gambar aslinya.
  const cropFaceToFile = async (
    detector: FaceDetector,
    source: HTMLImageElement | HTMLCanvasElement,
    sourceWidth: number,
    sourceHeight: number,
    prefix: string
  ): Promise<File | null> => {
    const result = detector.detect(source);
    if (!result.detections.length) return null;

    // Ambil wajah dengan skor confidence tertinggi kalau ada lebih dari satu
    const detection = result.detections.reduce((best, current) => {
      const bestScore = best.categories?.[0]?.score ?? 0;
      const currentScore = current.categories?.[0]?.score ?? 0;
      return currentScore > bestScore ? current : best;
    });

    const box = detection.boundingBox;
    if (!box) return null;

    const pad = box.width * 0.2;
    const x1 = Math.max(box.originX - pad, 0);
    const y1 = Math.max(box.originY - pad, 0);
    const x2 = Math.min(box.originX + box.width + pad, sourceWidth);
    const y2 = Math.min(box.originY + box.height + pad, sourceHeight);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = x2 - x1;
    cropCanvas.height = y2 - y1;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(source, x1, y1, x2 - x1, y2 - y1, 0, 0, x2 - x1, y2 - y1);

    return canvasToFile(cropCanvas, prefix);
  };

  // Make sure the camera is turned off when the component unmounts
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

  // Saat popup "pilih foto" bawaan OS kebuka, window ini bakal kehilangan
  // focus. Pas popup itu ditutup (baik user pilih file ataupun cancel),
  // window dapat focus lagi — momen itu kita pakai buat matiin spinner.
  useEffect(() => {
    const handleWindowFocus = () => {
      setIsOpeningGallery(false);
      if (galleryFallbackTimeoutRef.current) {
        clearTimeout(galleryFallbackTimeoutRef.current);
        galleryFallbackTimeoutRef.current = null;
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      if (galleryFallbackTimeoutRef.current) {
        clearTimeout(galleryFallbackTimeoutRef.current);
      }
      if (galleryOpenDeferTimeoutRef.current) {
        clearTimeout(galleryOpenDeferTimeoutRef.current);
      }
    };
  }, []);

  // Dipanggil pas label "Choose Image" diklik, SEBELUM browser benar-benar
  // membuka file picker native.
  //
  // FIX: sebelumnya `setIsOpeningGallery(true)` dipanggil di sini secara
  // SYNCHRONOUS. Karena `isOpeningGallery` dipakai untuk men-disable
  // `<input type="file">` (lewat `isAnyButtonBusy`), React sempat flush
  // state update itu SEBELUM browser menjalankan default action dari
  // <label htmlFor="..."> (yaitu men-trigger klik ke input file-nya).
  // Akibatnya input keburu ke-disable dan file picker OS gagal terbuka
  // secara diam-diam (tanpa error). Fix-nya: tunda update state ini ke
  // task berikutnya (setTimeout 0) supaya default action label sudah
  // sempat jalan & file picker sudah sempat kebuka duluan.
  const handleChooseImageClick = () => {
    if (galleryFallbackTimeoutRef.current) {
      clearTimeout(galleryFallbackTimeoutRef.current);
      galleryFallbackTimeoutRef.current = null;
    }
    if (galleryOpenDeferTimeoutRef.current) {
      clearTimeout(galleryOpenDeferTimeoutRef.current);
    }

    galleryOpenDeferTimeoutRef.current = setTimeout(() => {
      setIsOpeningGallery(true);
      galleryFallbackTimeoutRef.current = setTimeout(() => {
        setIsOpeningGallery(false);
      }, 8000);
    }, 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsOpeningGallery(false);
    if (galleryFallbackTimeoutRef.current) {
      clearTimeout(galleryFallbackTimeoutRef.current);
      galleryFallbackTimeoutRef.current = null;
    }
    setIsChoosingImage(true);

    let fileToSend = file;

    try {
      const detector = await getImageFaceDetector();
      const img = await loadImageFromFile(file);
      const cropped = await cropFaceToFile(
        detector,
        img,
        img.naturalWidth,
        img.naturalHeight,
        "upload"
      );
      if (cropped) {
        fileToSend = cropped;
      }
      // Kalau tidak ada wajah terdeteksi, tetap kirim gambar aslinya
      // supaya user tidak diblok hanya karena deteksi wajah meleset.
    } catch (err) {
      console.error("Face crop failed, sending original image instead:", err);
    }

    // Create a preview from the file that will actually be sent
    const url = URL.createObjectURL(fileToSend);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    // Send to API
    lastFileRef.current = fileToSend;
    setIsChoosingImage(false);
    predict(fileToSend);
  };

  const handleOpenCamera = async () => {
    setCameraError(null);
    setFileError(null);
    setIsOpeningCamera(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      setIsOpeningCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: photoFacingMode },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      // Wait for the video element to render, then attach the stream
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsOpeningCamera(false);
      });
    } catch (err) {
      setCameraError(
        "Unable to access the camera. Please make sure camera permission is granted."
      );
      setIsOpeningCamera(false);
    }
  };

  const handleOpenRealtime = async () => {
    setRealtimeError(null);
    setFileError(null);
    setIsOpeningRealtime(true);
    handleCloseCamera(); // pastikan mode "Take Photo" ketutup dulu

    if (!navigator.mediaDevices?.getUserMedia) {
      setRealtimeError("Camera is not supported on this device/browser.");
      setIsOpeningRealtime(false);
      return;
    }

    // 1) Minta izin kamera duluan, sama seperti tombol "Take Photo"
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
    } catch (err) {
      setRealtimeError(
        "Unable to access the camera. Please make sure camera permission is granted."
      );
      setIsOpeningRealtime(false);
      return;
    }

    realtimeStreamRef.current = stream;
    setIsRealtimeOpen(true);

    requestAnimationFrame(() => {
      if (realtimeVideoRef.current) {
        realtimeVideoRef.current.srcObject = stream;
        realtimeVideoRef.current.onloadedmetadata = () => {
          realtimeVideoRef.current?.play();
        };
      }
    });

    // 2) Setelah izin kamera didapat, baru load model face detector-nya.
    // Kalau ini gagal, jangan biarkan layar realtime "nyangkut" kosong —
    // tutup realtime-nya dan tampilkan pesan error yang jelas.
    try {
      if (!faceDetectorRef.current) {
        setIsModelLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
      }

      setIsModelLoading(false);
      setIsOpeningRealtime(false);
      realtimeLoop();
    } catch (err) {
      console.error("Failed to load face detector model:", err);
      setIsModelLoading(false);
      setIsOpeningRealtime(false);
      handleCloseRealtime();
      setRealtimeError(
        "Failed to load the face detection model. Please check your internet connection and try again."
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
    setIsModelLoading(false);
    setIsSwitchingCamera(false);
    setFacingMode("user"); // reset ke kamera depan buat sesi berikutnya
  };

  // Helper: minta stream kamera baru. Coba pakai facingMode EXACT dulu
  // supaya browser DIPAKSA pindah ke kamera fisik yang berbeda (bukan cuma
  // "preferensi" yang bisa diabaikan). Kalau device/browser tidak support
  // constraint "exact" (throw OverconstrainedError), fallback ke facingMode
  // biasa.
  const getCameraStream = async (
    mode: "user" | "environment"
  ): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: mode } },
        audio: false,
      });
    } catch (err) {
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
    }
  };

  // Toggle antara kamera depan ("user") dan belakang ("environment") untuk
  // mode Realtime.
  //
  // FIX: sebelumnya stream baru diminta SEBELUM stream lama dimatikan.
  // Banyak HP (terutama iOS Safari, dan sejumlah Android/Chrome) cuma
  // mengizinkan SATU stream kamera aktif dalam satu waktu — jadi request
  // kedua bakal gagal atau malah balikin kamera yang SAMA lagi (karena
  // facingMode cuma dianggap preferensi, bukan constraint mutlak), sehingga
  // kelihatan seperti "tombol switch tidak berfungsi". Fix-nya: matikan
  // stream lama dulu, baru request stream baru, dan minta pakai facingMode
  // "exact" supaya benar-benar dipaksa pindah kamera.
  const handleSwitchCamera = async () => {
    if (!realtimeStreamRef.current || isSwitchingCamera) return;

    const nextFacingMode = facingMode === "user" ? "environment" : "user";
    setIsSwitchingCamera(true);
    setRealtimeError(null);

    // Lepas kamera lama dulu supaya hardware-nya bebas dipakai stream baru.
    realtimeStreamRef.current.getTracks().forEach((track) => track.stop());
    realtimeStreamRef.current = null;

    try {
      const newStream = await getCameraStream(nextFacingMode);

      realtimeStreamRef.current = newStream;
      setFacingMode(nextFacingMode);

      if (realtimeVideoRef.current) {
        realtimeVideoRef.current.srcObject = newStream;
        realtimeVideoRef.current.onloadedmetadata = () => {
          realtimeVideoRef.current?.play();
        };
      }
    } catch (err) {
      console.error("Failed to switch camera:", err);
      setRealtimeError(
        "Unable to switch camera. This device might only have one camera."
      );

      // Kita sudah terlanjur matiin stream lama, jadi coba pulihkan supaya
      // user tidak ditinggal dengan layar kamera mati total.
      try {
        const restoredStream = await getCameraStream(facingMode);
        realtimeStreamRef.current = restoredStream;
        if (realtimeVideoRef.current) {
          realtimeVideoRef.current.srcObject = restoredStream;
          realtimeVideoRef.current.onloadedmetadata = () => {
            realtimeVideoRef.current?.play();
          };
        }
      } catch (restoreErr) {
        console.error("Failed to restore previous camera:", restoreErr);
      }
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const realtimeLoop = useCallback(() => {
    const video = realtimeVideoRef.current;
    const overlay = overlayCanvasRef.current;
    const detector = faceDetectorRef.current;

    if (!video || !overlay || !detector || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(realtimeLoop);
      return;
    }

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const result = detector.detectForVideo(video, performance.now());

    if (result.detections.length > 0) {
      // Ambil wajah dengan skor tertinggi
      const detection = result.detections.reduce((best, current) => {
        const bestScore = best.categories?.[0]?.score ?? 0;
        const currentScore = current.categories?.[0]?.score ?? 0;
        return currentScore > bestScore ? current : best;
      });

      const box = detection.boundingBox;
      if (box) {
        const pad = box.width * 0.2;
        const x1 = Math.max(box.originX - pad, 0);
        const y1 = Math.max(box.originY - pad, 0);
        const x2 = Math.min(box.originX + box.width + pad, overlay.width);
        const y2 = Math.min(box.originY + box.height + pad, overlay.height);

        // gambar kotak wajah
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        // gambar keypoints (mata, hidung, mulut, telinga)
        ctx.fillStyle = "#ef4444";
        detection.keypoints?.forEach((kp) => {
          ctx.beginPath();
          ctx.arc(kp.x * overlay.width, kp.y * overlay.height, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        const now = performance.now();
        if (!isPredictingRef.current && now - lastPredictTimeRef.current > 2000) {
          lastPredictTimeRef.current = now;
          sendRealtimeCrop(video, x1, y1, x2 - x1, y2 - y1);
        }
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

        // Tampilkan juga foto yang dikirim ke BE di kotak "Predicted Image"
        const url = URL.createObjectURL(file);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });

        lastFileRef.current = file;
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
    setIsSwitchingPhotoCamera(false);
    setPhotoFacingMode("user"); // reset ke kamera depan buat sesi berikutnya
  };

  // Toggle antara kamera depan/belakang untuk mode "Take Photo" (non-realtime).
  // Sama seperti versi realtime: kamera lama dimatikan DULU sebelum minta
  // stream baru, dan facingMode diminta dengan "exact" (fallback ke
  // non-exact) supaya benar-benar pindah kamera fisik, bukan cuma preferensi
  // yang bisa diabaikan oleh browser.
  const handleSwitchPhotoCamera = async () => {
    if (!streamRef.current || isSwitchingPhotoCamera) return;

    const nextFacingMode = photoFacingMode === "user" ? "environment" : "user";
    setIsSwitchingPhotoCamera(true);
    setCameraError(null);

    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    try {
      const newStream = await getCameraStream(nextFacingMode);

      streamRef.current = newStream;
      setPhotoFacingMode(nextFacingMode);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Failed to switch camera:", err);
      setCameraError(
        "Unable to switch camera. This device might only have one camera."
      );

      try {
        const restoredStream = await getCameraStream(photoFacingMode);
        streamRef.current = restoredStream;
        if (videoRef.current) {
          videoRef.current.srcObject = restoredStream;
        }
      } catch (restoreErr) {
        console.error("Failed to restore previous camera:", restoreErr);
      }
    } finally {
      setIsSwitchingPhotoCamera(false);
    }
  };

  const handleCapturePhoto = async () => {
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

    let fileToSend: File;
    try {
      const detector = await getImageFaceDetector();
      const cropped = await cropFaceToFile(detector, canvas, width, height, "camera");
      fileToSend = cropped ?? (await canvasToFile(canvas, "camera"));
    } catch (err) {
      console.error("Face crop failed, sending full frame instead:", err);
      try {
        fileToSend = await canvasToFile(canvas, "camera");
      } catch {
        setCameraError("Failed to capture photo. Please try again.");
        return;
      }
    }

    // Create a preview from the file that will actually be sent
    const url = URL.createObjectURL(fileToSend);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    // Send to API
    lastFileRef.current = fileToSend;
    predict(fileToSend);

    // Close the camera after a successful capture
    handleCloseCamera();
  };

  const handleClear = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileError(null);
    setCameraError(null);
    lastFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    reset();
  };

  // Coba ulang prediksi pakai file terakhir yang berhasil dikirim, tanpa
  // perlu user upload/ambil foto lagi. Kalau file terakhir sudah tidak ada
  // (misalnya baru pertama kali buka halaman), fallback ke handleClear.
  const handleRestartPredict = () => {
    if (lastFileRef.current) {
      predict(lastFileRef.current);
    } else {
      handleClear();
    }
  };

  return (
    <div>
      <ServerStatusIndicator />
      {prediction && (
        <>
          <ParticleField position="top" />
          <ParticleField position="bottom" />
        </>
      )}

      <h1 className="text-2xl font-bold mb-6">Facial Expressions Classification</h1>

      <ModelInfoCard
        name="Facial Expressions Classification"
        architecture="EfficientNet-B0"
        techstack="Python, PyTorch, MediaPipe, OpenCV"
        datasets="FER-2013 (Kaggle)"
        author="Wira Atmaja"
        version="1"
      />

      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <p className="text-sm text-neutral-500">Predicted Image</p>
          <div className="relative w-full max-w-125 aspect-square border-2 border-neutral-300 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Uploaded Hand Sign Languange"
                width={500}
                height={500}
                className={`object-contain w-full h-full transition-all duration-300 ${
                  isLoading ? "blur-sm scale-105" : ""
                }`}
                unoptimized
              />
            ) : (
              <span className="text-neutral-600 text-sm">
                Upload a facial expressions image
              </span>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                <Lottie
                  animationData={ThinkingAnimation}
                  loop
                  autoplay
                  className="w-50 h-50"
                />
              </div>
            )}

            {/* Restart Predict overlay, muncul di tengah gambar kalau prediksi gagal */}
            {!isLoading && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 px-4 text-center">
                <p className="text-sm text-red-600">
                  Failed to get a prediction. Please try again.
                </p>
                <button
                  type="button"
                  onClick={handleRestartPredict}
                  className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-5 py-2 text-white text-sm transition hover:bg-neutral-700"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Restart Predict
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <p className="text-sm text-neutral-500">Upload Here</p>

          <div className="w-full max-w-125 aspect-square border-2 border-dashed border-neutral-300 rounded-lg bg-white flex flex-col items-center justify-center gap-4 p-6">
            {isCameraOpen ? (
              <>
                <div className="relative w-full aspect-square max-h-95 overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={handleSwitchPhotoCamera}
                    disabled={isSwitchingPhotoCamera}
                    aria-label="Switch camera"
                    title={
                      photoFacingMode === "user"
                        ? "Switch to back camera"
                        : "Switch to front camera"
                    }
                    className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSwitchingPhotoCamera ? (
                      <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                    ) : (
                      <IoCameraReverse className="h-5 w-5" />
                    )}
                  </button>
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
            ) : isRealtimeOpen ? (
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

                  {isModelLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <AiOutlineLoading3Quarters className="mr-2 h-4 w-4 animate-spin text-white" />
                      <span className="text-sm text-white">
                        Loading face detection model...
                      </span>
                    </div>
                  )}

                  {!isModelLoading && prediction && (
                    <div className="absolute top-2 left-2 rounded bg-black/70 px-3 py-1 text-sm text-lime-400">
                      {prediction.prediction} ({prediction.confidence}%)
                    </div>
                  )}

                  {!isModelLoading && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      disabled={isSwitchingCamera}
                      aria-label="Switch camera"
                      title={
                        facingMode === "user"
                          ? "Switch to back camera"
                          : "Switch to front camera"
                      }
                      className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSwitchingCamera ? (
                        <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                      ) : (
                        <IoCameraReverse className="h-5 w-5" />
                      )}
                    </button>
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
                  id="face-upload-input"
                  disabled={isAnyButtonBusy}
                />

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="face-upload-input"
                    onClick={handleChooseImageClick}
                    aria-disabled={isAnyButtonBusy}
                    className={`flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-3 text-white text-sm transition ${
                      isAnyButtonBusy
                        ? "cursor-not-allowed opacity-60 pointer-events-none"
                        : "cursor-pointer hover:bg-neutral-700"
                    }`}
                  >
                    {(isOpeningGallery || isChoosingImage) && (
                      <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                    )}
                    {isChoosingImage
                      ? "Processing..."
                      : isOpeningGallery
                      ? "Opening Gallery..."
                      : "Choose Image"}
                  </label>

                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    disabled={isAnyButtonBusy}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800 bg-white px-6 py-3 text-neutral-800 text-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isOpeningCamera && (
                      <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                    )}
                    {isOpeningCamera ? "Opening Camera..." : "Take Photo"}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenRealtime}
                    disabled={isAnyButtonBusy}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-800 bg-white px-6 py-3 text-sm text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isOpeningRealtime ? (
                      <>
                        <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                        Opening Webcam...
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                        </span>
                        Realtime Predict Webcam
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-neutral-500 text-center">
                  Format: JPG or PNG only
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
          label="Upload your facial expression"
          />
      </div>

      {prediction?.probabilities && (
        <div className="border border-neutral-200 rounded-lg p-4 bg-white">
          <ProbabilityChart probabilities={prediction.probabilities} />
        </div>
      )}

      <InfoModelCanWrong/>

      <ModelClasses classes={FacialExpressionsClasses} />

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
              fine-tuned to classify facial expression images from the
              <strong> FER-2013</strong> dataset.
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
                A <strong>MediaPipe Face Detector</strong> (BlazeFace) runs in the
                browser to locate the face in real time, so only the cropped face
                region is sent for prediction instead of the full frame.
              </li>

              <li>
                The cropped image is resized to <strong>224 × 224</strong>{" "}
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
                that has been fine-tuned for the <strong>FER-2013</strong> dataset.
              </li>

              <li>
                The classifier computes probabilities for each facial expression category, and the
                class with the highest confidence score is returned as the final
                prediction.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <a
          href="https://github.com/WiraAtma/lensa-vision-lab/blob/main/experiments/facial_expression_classification_efficient_b0.ipynb"
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
      <Wave/>
    </div>
  );
}