import { Play, Pause, SkipForward, ListMusic } from "lucide-react";
import { Link, useLocation } from "wouter";
import coverSelfhelp from "@/assets/images/cover-selfhelp.png";
import { useState } from "react";

export default function MiniPlayer() {
  const [location] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Don't show on the main player page
  if (location.startsWith('/player')) return null;

  return (
    <div className="fixed bottom-[72px] left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#1c2a3d]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 w-full bg-white/5">
          <div className="h-full bg-amber-500 w-[35%]" />
        </div>
        
        <div className="flex items-center p-2 gap-3">
          <Link href="/player/current" className="flex flex-1 items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 shadow-lg">
              <img src={coverSelfhelp} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Organize-se</h4>
              <p className="text-[10px] text-slate-400 truncate">Capítulo 1 • 4h 28m restante</p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-300 hover:text-white transition-colors">
              <ListMusic className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsPlaying(!isPlaying);
              }}
              className="p-2 text-white hover:text-amber-500 transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button className="p-2 text-slate-300 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
