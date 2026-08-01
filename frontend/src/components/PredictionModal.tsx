import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { aiModels } from "@/data/models";

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PredictionModal({ isOpen, onClose }: PredictionModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  const allItems = [
    ...aiModels.map(m => ({ ...m, isComingSoon: false })),
    { id: "coming-soon", name: "Coming Soon", description: "More models will be added here", path: "#", isComingSoon: true }
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState("");

  const comingSoonItem = allItems[allItems.length - 1];

  // Filter berdasarkan search query, tidak peduli huruf besar/kecil.
  // "Coming Soon" tidak ikut difilter, selalu tampil di paling bawah.
  const filteredItems = [
    ...aiModels
      .map((m) => ({ ...m, isComingSoon: false }))
      .filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase())),
    comingSoonItem,
  ];

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      setSearch("");
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected && !selected.isComingSoon) {
          router.push(selected.path);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, router, onClose, filteredItems.length]);

  // Reset selectedIndex setiap kali hasil pencarian berubah, agar tidak out-of-range
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Klik di luar modal (backdrop) akan menutup modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg h-136 overflow-hidden flex flex-col"
      >
        <div className="p-3 bg-white flex justify-between items-center z-10">
          <h2 className="text-base font-bold">Select Models</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500 leading-none"
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div className="px-3 pb-3 bg-white">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model..."
              autoFocus
              className="w-full h-9 pl-9 pr-3 rounded-md border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>
        </div>

        <div className="p-2 flex flex-col gap-1 overflow-y-auto flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center text-sm text-neutral-400 py-6">
              No results found
            </div>
          ) : (
            filteredItems.map((item, index) => (
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
                <div className="w-7 h-7 rounded bg-neutral-200 flex items-center justify-center shrink-0">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}