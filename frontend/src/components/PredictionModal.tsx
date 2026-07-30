import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { aiModels } from "@/data/models";

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PredictionModal({ isOpen, onClose }: PredictionModalProps) {
  const router = useRouter();
  
  const allItems = [
    ...aiModels.map(m => ({ ...m, isComingSoon: false })),
    { id: "coming-soon", name: "Coming Soon", description: "More models will be added here", path: "#", isComingSoon: true }
  ];
  
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (!selected.isComingSoon) {
          router.push(selected.path);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, router, onClose, allItems.length]); // Added allItems.length instead of allItems to avoid infinite re-renders if allItems is redefined

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[500px] overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-white flex justify-between items-center z-10">
          <h2 className="text-base font-bold">Select Prediction</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500 leading-none"
          >
            ✕
          </button>
        </div>
        
        <div className="p-2 flex flex-col gap-1 overflow-y-auto">
          {allItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.isComingSoon) {
                  router.push(item.path);
                  onClose();
                }
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center gap-3 w-full h-11 px-3 rounded-md cursor-pointer transition-colors ${
                selectedIndex === index ? "bg-blue-50 border border-blue-200" : "hover:bg-neutral-50 border border-transparent"
              } ${item.isComingSoon ? "opacity-60" : ""}`}
            >
              <div className="w-7 h-7 rounded bg-neutral-200 flex items-center justify-center flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={28} height={28} className="object-cover rounded" />
                ) : (
                  <span className="text-xs">?</span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
