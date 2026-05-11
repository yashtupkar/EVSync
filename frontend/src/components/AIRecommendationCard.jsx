import React, { useState } from 'react';
import { Sparkles, Star, Zap, ChevronRight, ChevronLeft, EvCharger } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIRecommendationCard = ({ recommendations = [], stations = [], isLoading }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) return null;
  if (!recommendations || recommendations.length === 0) return null;

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  const rec = recommendations[currentIndex];
  const station = stations.find(s => String(s._id) === String(rec?.stationId));

  if (!station) return null;

  return (
    <div className="bg-white rounded-2xl p-3 shadow-xl shadow-purple-500/10 border border-purple-50 space-y-3 relative group">
      {/* Mini Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="text-white" size={14} fill="white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-900 tracking-tight">AI Smart Picks</h3>
            <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Recommendation {currentIndex + 1} of {recommendations.length}</p>
          </div>
        </div>
        
        {/* Navigation Controls */}
        <div className="flex gap-1.5">
          <button 
            onClick={handlePrev}
            className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={handleNext}
            className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Sliding Content */}
      <div 
        className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-purple-200 hover:bg-white transition-all cursor-pointer relative overflow-hidden"
        onClick={() => navigate(`/book-slot/${station._id}`)}
      >
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <EvCharger size={18} className="text-white" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="text-xs font-bold text-gray-900 truncate pr-2">{station.name}</h4>
              <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                <Star size={10} fill="currentColor" />
                <span className="text-[10px] font-black">{station.rating || 4.5}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
              <span>{station.distance?.toFixed(1) || "2.1"} km</span>
              <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
              <span className="text-emerald-500">{rec.waitTime || "No wait"}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 italic leading-relaxed">
              "{rec.reason}"
            </p>
          </div>
        </div>
        
        {/* Badges - Ultra Compact */}
        <div className="flex gap-1.5 mt-3">
          {rec.badges?.map((badge, bIdx) => (
            <span key={bIdx} className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 uppercase tracking-tighter">
              {badge}
            </span>
          ))}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1 mt-3">
          {recommendations.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-purple-500' : 'w-1 bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <button 
        onClick={() => navigate(`/book-slot/${station._id}`)}
        className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-purple-100 hover:shadow-purple-200 transition-all active:scale-[0.98]"
      >
        Book This Spot
      </button>
    </div>
  );
};

export default AIRecommendationCard;
