import { Sparkles } from 'lucide-react';

export default function CanvasLoadingState() {
  return (
    <div className="absolute inset-0 bg-[#1A1A2E] flex flex-col items-center justify-center">
      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center animate-pulse">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="text-[14px] text-gray-400 mt-3">Loading board...</div>
    </div>
  );
}
