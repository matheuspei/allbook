import { ChevronDown, Share2, Bluetooth, MoreVertical, ListMusic, RotateCcw, RotateCw, SkipBack, SkipForward, Pause, Play, Timer, Bookmark, Car, Minus, Plus, BookOpen, CheckCircle, Settings, History, Library } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect, useRef } from "react";
import { catalog } from "@/lib/books";
import { readSettings } from "@/lib/settings";
import { readPlayback, savePlayback, showMiniPlayer } from "@/lib/playback";
import { getChapters, chaptersTotalSec, chapterStartSec } from "@/lib/chapters";

export default function AudioPlayer({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(true);

  /**
   * Qual livro tocar.
   *
   * Antes isto era um objeto fixo com "Organize-se": abrir qualquer livro no
   * player mostrava sempre o mesmo título. Agora vem do catálogo pelo id da
   * rota. `/player/current` é o atalho antigo que a barrinha usava — continua
   * valendo e cai no último livro ouvido.
   */
  const book = (() => {
    const fromRoute = catalog.find((item) => item.id === Number(params.id));
    if (fromRoute) return fromRoute;
    const saved = readPlayback();
    const fromSaved = saved && catalog.find((item) => item.id === saved.bookId);
    return fromSaved || catalog[0];
  })();

  // Retoma de onde parou, mas só se for o mesmo livro.
  const savedForThisBook = (() => {
    const saved = readPlayback();
    return saved && saved.bookId === book.id ? saved : null;
  })();

  // Capítulos estáveis do livro e duração total (soma dos capítulos) — a mesma
  // fonte que a tela do livro usa, para os dois concordarem.
  const chapters = getChapters(book.id);
  const durationSeconds = chaptersTotalSec(book.id);

  // Abrir "/player/:id?chapter=N" começa naquele capítulo. Sem o parâmetro,
  // retoma de onde a pessoa parou (ou do começo).
  const search = useSearch();
  const chapterParam = (() => {
    const n = Number(new URLSearchParams(search).get("chapter"));
    return Number.isInteger(n) && n >= 1 && n <= chapters.length ? n : null;
  })();

  const initialPosition = chapterParam
    ? chapterStartSec(book.id, chapterParam)
    : savedForThisBook?.positionSec ?? 0;

  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [progress, setProgress] = useState([(initialPosition / durationSeconds) * 100]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          setProgress([(next / durationSeconds) * 100]);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(Math.abs(seconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatRemaining = (totalSeconds: number, currentSeconds: number) => {
    const remaining = Math.max(0, totalSeconds - currentSeconds);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = Math.floor(remaining % 60);
    
    if (h > 0) {
      return `${h}h ${m}m ${s}s restantes`;
    }
    return `${m}m ${s}s restantes`;
  };
  // Começa na velocidade escolhida em Configurações; mudar aqui vale só para
  // esta sessão de audição, sem alterar a preferência.
  const [speed, setSpeed] = useState(() => readSettings().speed);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState("Desligado");
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("0");
  const [showCarModeEntry, setShowCarModeEntry] = useState(false);
  const [showBluetoothPermission, setShowBluetoothPermission] = useState(false);
  const [showSystemPermission, setShowSystemPermission] = useState(false);
  const [isCarModeActive, setIsCarModeActive] = useState(false);

  const [currentChapter, setCurrentChapter] = useState(
    chapterParam ?? savedForThisBook?.chapter ?? 1,
  );

  useEffect(() => {
    showMiniPlayer();
  }, [book.id]);

  /**
   * Guarda onde a pessoa está.
   *
   * Escrever a cada segundo é desperdício — `localStorage` é síncrono e trava a
   * tela por um instante. Mas a primeira versão disto salvava só quando o
   * segundo era múltiplo de 5, e isso tinha um buraco: quem adianta 30 segundos
   * e pausa cai num número que nunca mais bate na conta, e a posição não era
   * gravada nunca. Agora a régua é a *distância* desde o último salvamento, que
   * funciona igual depois de pular, arrastar ou trocar de capítulo.
   *
   * O `return` do efeito salva ao sair do player — assim fechar a tela guarda a
   * posição exata, não a de até 5 segundos atrás.
   */
  const lastSavedRef = useRef(-Infinity);
  const stateRef = useRef({ bookId: book.id, chapter: currentChapter, positionSec: currentTime });
  stateRef.current = { bookId: book.id, chapter: currentChapter, positionSec: currentTime };

  useEffect(() => {
    if (Math.abs(currentTime - lastSavedRef.current) < 5) return;
    lastSavedRef.current = currentTime;
    savePlayback({ ...stateRef.current, durationSec: durationSeconds });
  }, [currentTime, durationSeconds]);

  useEffect(() => {
    return () => {
      savePlayback({ ...stateRef.current, durationSec: durationSeconds });
    };
  }, []);

  const goToChapter = (target: number) => {
    const clamped = Math.min(Math.max(target, 1), chapters.length);
    const start = chapterStartSec(book.id, clamped);
    setCurrentChapter(clamped);
    setCurrentTime(start);
    setProgress([(start / durationSeconds) * 100]);
  };

  const nextChapter = () => goToChapter(currentChapter + 1);
  const prevChapter = () => goToChapter(currentChapter - 1);

  const adjustSpeed = (delta: number) => {
    setSpeed(prev => Math.max(0.5, Math.min(3.0, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleCarModeClick = () => {
    setShowCarModeEntry(true);
  };

  const proceedToBluetooth = () => {
    setShowCarModeEntry(false);
    setShowBluetoothPermission(true);
  };

  const proceedToSystemPermission = () => {
    setShowBluetoothPermission(false);
    setShowSystemPermission(true);
  };

  const activateCarMode = () => {
    setShowSystemPermission(false);
    setIsCarModeActive(true);
  };

  const speedPresets = [0.7, 1.0, 1.2, 1.5, 1.7, 2.0];

  if (isCarModeActive) {
    return (
      <div className="fixed inset-0 z-[200] bg-linear-to-b from-[#1a4d35] via-[#0a101f] to-[#0a101f] text-white flex flex-col p-6 animate-in fade-in duration-500">
        <header className="flex justify-between items-center mb-12">
          <button onClick={() => setIsCarModeActive(false)} className="p-2">
            <ChevronDown className="w-10 h-10" />
          </button>
          <div className="bg-white/10 rounded-full px-4 py-1 flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Conectado ao Carro</span>
          </div>
          <button className="p-2 opacity-0 pointer-events-none">
            <MoreVertical className="w-8 h-8" />
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-between py-10">
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold line-clamp-1">{book.title}</h1>
            <p className="text-primary font-medium">{book.author}</p>
          </div>

          <div className="w-full flex flex-col items-center gap-12">
            <div className="text-4xl font-black tracking-tighter text-slate-300">
              -02:28
            </div>

            <div className="w-full flex items-center justify-around">
              <button 
                onClick={() => setCurrentTime(prev => Math.max(0, prev - 30))}
                className="relative p-6 text-white active:scale-90 transition-transform"
              >
                <RotateCcw className="w-16 h-16" />
                <span className="absolute inset-0 flex items-center justify-center text-xl font-black mt-2">30</span>
              </button>

              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-32 h-32 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-16 h-16 fill-current" /> : <Play className="w-16 h-16 fill-current ml-2" />}
              </button>

              <button className="p-6 text-white active:scale-90 transition-transform">
                <Bookmark className="w-16 h-16" />
              </button>
            </div>
          </div>
        </main>

        <footer className="mt-auto py-8 text-center text-slate-500 text-sm font-medium">
          Mantenha os olhos na estrada.
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-linear-to-b from-[#1a4d35] via-[#0a101f] to-[#0a101f] text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronDown className="w-8 h-8" />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Bluetooth className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowMoreMenu(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 justify-center min-h-0 pb-4">
        <div className="w-full flex flex-col items-center space-y-4 max-w-md mx-auto">
          {/* Album Art */}
          <div className="relative w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/5 shrink-0 transition-transform duration-500 hover:scale-[1.02]">
            <img 
              src={book.cover} 
              alt={book.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 overflow-hidden w-20 h-20">
              <div className="absolute transform rotate-45 bg-[#f59e0b] text-black text-[9px] font-bold py-1 right-[-25px] top-[15px] w-32 text-center uppercase tracking-wider shadow-sm">
                AllBook<br/>Original
              </div>
            </div>
          </div>

          {/* Chapter Info */}
          <button className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors bg-white/5 py-1.5 px-5 rounded-full border border-white/10 shrink-0">
            <ListMusic className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-base">Capítulo {currentChapter}</span>
          </button>

          {/* Progress Section */}
          <div className="w-full space-y-2 px-2 shrink-0">
            <div className="relative pt-1">
              <Slider 
                value={progress} 
                onValueChange={(val) => {
                  setProgress(val);
                  setCurrentTime((val[0] / 100) * durationSeconds);
                }} 
                max={100} 
                step={0.1}
                className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-none [&_.relative]:h-1 [&_.bg-primary]:bg-slate-600 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium tracking-tight">
              <span className="text-slate-400">{formatTime(currentTime)}</span>
              <span className="text-slate-200">{formatRemaining(durationSeconds, currentTime)}</span>
              <span className="text-slate-400">-{formatTime(durationSeconds - currentTime)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="w-full flex items-center justify-around px-2 shrink-0">
            <button 
              onClick={prevChapter}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-7 h-7" />
            </button>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentTime(prev => Math.max(0, prev - 30))}
                className="relative p-2 text-white hover:text-amber-500 transition-colors group"
              >
                <RotateCcw className="w-8 h-8" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black mt-1">30</span>
              </button>
              
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button 
                onClick={() => setCurrentTime(prev => Math.min(durationSeconds, prev + 30))}
                className="relative p-2 text-white hover:text-amber-500 transition-colors group"
              >
                <RotateCw className="w-8 h-8" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black mt-1">30</span>
              </button>
            </div>

            <button 
              onClick={nextChapter}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-7 h-7" />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <footer className="px-4 py-4 flex items-center justify-between shrink-0 mb-4">
        <button 
          onClick={() => setShowSpeedMenu(true)}
          className="flex flex-col items-center gap-1 min-w-[70px] group"
        >
          <span className="text-xs font-bold group-hover:text-amber-500 transition-colors">{speed.toFixed(2).replace('.', ',')}x</span>
          <span className="text-[9px] font-bold uppercase text-slate-500 group-hover:text-slate-300 transition-colors tracking-tight">Velocidade</span>
        </button>
        
        <button 
          onClick={handleCarModeClick}
          className="flex flex-col items-center gap-1 min-w-[70px] group"
        >
          <Car className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          <span className="text-[9px] font-bold uppercase text-slate-500 group-hover:text-slate-300 transition-colors tracking-tight">Modo Carro</span>
        </button>

        <button 
          onClick={() => setShowTimerMenu(true)}
          className="flex flex-col items-center gap-1 min-w-[70px] group"
        >
          <Timer className={`w-5 h-5 ${selectedTimer !== "Desligado" ? "text-amber-500" : "text-slate-400"} group-hover:text-amber-500 transition-colors`} />
          <span className="text-[9px] font-bold uppercase text-slate-500 group-hover:text-slate-300 transition-colors tracking-tight">Timer</span>
        </button>

        <button className="flex flex-col items-center gap-1 min-w-[70px] group">
          <Bookmark className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          <span className="text-[9px] font-bold uppercase text-slate-500 group-hover:text-slate-300 transition-colors tracking-tight">+ Marcação</span>
        </button>
      </footer>

      {/* Speed Control Modal (Overlay) */}
      {showSpeedMenu && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-end animate-in fade-in duration-200" onClick={() => setShowSpeedMenu(false)}>
          <div 
            className="w-full bg-[#0d1626] rounded-t-[32px] p-8 space-y-10 animate-in slide-in-from-bottom duration-300 border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-2" />
            
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-display">Velocidade</h3>
              <span className="text-xl font-bold text-amber-500">{speed.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* Main Slider Control */}
            <div className="flex items-center gap-6 px-2">
              <button 
                onClick={() => adjustSpeed(-0.05)}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex-1 relative pt-2">
                <Slider 
                  value={[speed]} 
                  onValueChange={([val]) => setSpeed(val)} 
                  min={0.5}
                  max={3.0} 
                  step={0.05}
                  className="[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-none [&_.relative]:h-1.5 [&_.bg-primary]:bg-slate-700"
                />
              </div>

              <button 
                onClick={() => adjustSpeed(0.05)}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-4">
              {speedPresets.map(preset => (
                <button
                  key={preset}
                  onClick={() => setSpeed(preset)}
                  className={`py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    speed === preset 
                      ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                      : "border-white/10 text-slate-300 hover:border-white/30"
                  }`}
                >
                  <span className="text-base font-bold">{preset.toFixed(1).replace('.', ',')}</span>
                  {preset === 1.0 && <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Padrão</span>}
                </button>
              ))}
            </div>
            
            <div className="pb-4" />
          </div>
        </div>
      )}

      {/* More Options Menu (Overlay) */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-[160] animate-in fade-in duration-200" onClick={() => setShowMoreMenu(false)}>
          <div 
            className="absolute top-16 right-4 w-72 bg-[#1c2a3d] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col py-2">
              <Link href={params.id === 'current' ? '/book/5' : `/book/${params.id}`}>
                <button className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group w-full">
                  <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-white" />
                  <span className="text-sm font-medium">Detalhes do título</span>
                </button>
              </Link>
              
              <button className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group">
                <CheckCircle className="w-5 h-5 text-slate-400 group-hover:text-white" />
                <span className="text-sm font-medium">Marcar como concluído</span>
              </button>

              <button className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group">
                <Bookmark className="w-5 h-5 text-slate-400 group-hover:text-white" />
                <span className="text-sm font-medium">Marcações e notas</span>
              </button>

              <button className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group">
                <Settings className="w-5 h-5 text-slate-400 group-hover:text-white" />
                <span className="text-sm font-medium">Configurações do tocador</span>
              </button>

              <button className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group">
                <History className="w-5 h-5 text-slate-400 group-hover:text-white" />
                <span className="text-sm font-medium">Log de escuta</span>
              </button>

              <button className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left group">
                <Library className="w-5 h-5 text-slate-400 group-hover:text-white" />
                <span className="text-sm font-medium">Títulos recomendados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Configuration Modal (Overlay) */}
      {showTimerMenu && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-end animate-in fade-in duration-200" onClick={() => setShowTimerMenu(false)}>
          <div 
            className="w-full bg-[#0d1626] rounded-t-[32px] p-6 pb-10 space-y-6 animate-in slide-in-from-bottom duration-300 border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-2" />
            
            <div className="px-2">
              <h3 className="text-lg font-bold font-display mb-6">Configurações do Timer</h3>
              
              <div className="space-y-1">
                {[
                  "Desligado", 
                  "5 minutos", 
                  "10 minutos", 
                  "15 minutos", 
                  "30 minutos", 
                  "45 minutos", 
                  "60 minutos", 
                  "Fim do capítulo"
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedTimer(option);
                      setShowTimerMenu(false);
                    }}
                    className="w-full flex items-center justify-between py-4 px-2 hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <span className={`text-base ${selectedTimer === option ? "text-white font-semibold" : "text-slate-300"}`}>
                      {option}
                    </span>
                    <div className="flex items-center gap-2">
                      {option === "Fim do capítulo" && (
                        <div className="flex items-center gap-2 mr-4">
                          <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <Minus className="w-4 h-4" />
                          </button>
                          <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {selectedTimer === option && (
                        <div className="w-5 h-5 text-white">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => {
                    setShowTimerMenu(false);
                    setShowCustomTimer(true);
                  }}
                  className="w-full py-4 px-2 text-left hover:bg-white/5 rounded-xl transition-colors"
                >
                  <span className="text-base text-slate-300">Personalizar</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowTimerMenu(false)}
                className="w-full py-2 text-center text-base font-bold text-white hover:text-amber-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Timer Dialog */}
      {showCustomTimer && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#3d3d3d] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-8">
              <h3 className="text-xl font-medium text-white">Personalizar duração</h3>
              
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  <input 
                    type="number" 
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="w-16 bg-transparent border-b-2 border-slate-400 text-center text-2xl font-medium focus:border-white outline-none transition-colors"
                  />
                  <span className="text-sm text-slate-300">Horas</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <input 
                    type="number" 
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-16 bg-transparent border-b-2 border-slate-400 text-center text-2xl font-medium focus:border-white outline-none transition-colors"
                  />
                  <span className="text-sm text-slate-300">Minutos</span>
                </div>
              </div>

              <p className="text-center text-sm text-slate-400">
                (máx: 24 horas, mín: 1 minuto)
              </p>

              <div className="flex justify-end gap-6 pt-2">
                <button 
                  onClick={() => setShowCustomTimer(false)}
                  className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider px-2 py-1"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setSelectedTimer(`${customHours}h ${customMinutes}m`);
                    setShowCustomTimer(false);
                  }}
                  className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider px-2 py-1"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Car Mode Safety Note Modal */}
      {showCarModeEntry && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0d1626] rounded-[24px] p-8 space-y-6 shadow-2xl border border-white/10 relative">
            <button onClick={() => setShowCarModeEntry(false)} className="absolute right-6 top-6 text-slate-400">
              <ChevronDown className="w-6 h-6 rotate-180" />
            </button>
            <div className="text-center space-y-4 pt-4">
              <h3 className="text-xl font-bold font-display">Nota de segurança</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Não interaja com este aplicativo enquanto dirige. Use este aplicativo somente quando permitido por lei e pelas regras de trânsito aplicáveis e quando for seguro fazê-lo.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed font-semibold italic">
                Usar o aplicativo AllBook durante a condução é perigoso e pode resultar em ferimentos graves, morte ou danos à propriedade.
              </p>
              <Button 
                onClick={proceedToBluetooth}
                className="w-full bg-white text-black hover:bg-slate-200 font-bold py-6 rounded-full mt-4"
              >
                Ouça em seu carro
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bluetooth Connection Modal */}
      {showBluetoothPermission && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0d1626] rounded-[24px] p-8 space-y-6 shadow-2xl border border-white/10 relative text-center">
            <button onClick={() => setShowBluetoothPermission(false)} className="absolute right-6 top-6 text-slate-400">
              <ChevronDown className="w-6 h-6 rotate-180" />
            </button>
            
            <div className="flex justify-center pt-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/50">
                <Bluetooth className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold leading-tight">
                Isso permite que a AllBook se conecte automaticamente a dispositivos Bluetooth próximos.
              </h3>
              <p className="text-sm text-slate-400">
                Isso permite que a AllBook se conecte automaticamente a dispositivos Bluetooth próximos.
              </p>
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={proceedToSystemPermission}
                  variant="outline"
                  className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-full py-6 font-bold"
                >
                  Conexão automática
                </Button>
                <button 
                  onClick={() => setShowBluetoothPermission(false)}
                  className="text-sm font-bold text-slate-300 hover:text-white pt-2 block w-full"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Permission Modal (Android/iOS Style) */}
      {showSystemPermission && (
        <div className="fixed inset-0 z-[140] bg-black/40 flex items-center justify-center p-8 animate-in zoom-in duration-200">
          <div className="w-full max-w-[280px] bg-[#2a2a2a] rounded-[28px] overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 text-center space-y-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto border border-blue-500/30">
                <div className="w-4 h-4 bg-blue-500 rotate-45 flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full -rotate-45" />
                </div>
              </div>
              <p className="text-sm font-medium leading-snug">
                Permitir que <span className="font-bold">AllBook</span> encontre, conecte-se e determine a posição relativa de dispositivos por perto?
              </p>
            </div>
            <div className="flex flex-col border-t border-white/10">
              <button 
                onClick={activateCarMode}
                className="py-4 font-bold text-blue-400 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                Permitir
              </button>
              <button 
                onClick={() => setShowSystemPermission(false)}
                className="py-4 font-bold text-white/70 hover:bg-white/5 active:bg-white/10 border-t border-white/10 transition-colors"
              >
                Não permitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}