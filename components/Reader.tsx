
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Song, Theme } from '../types';
import { Play, Pause, Sparkles, ChevronLeft, Heart, Type as FontIcon, Share2, Check } from 'lucide-react';
import { generateReflection, speakLyrics, decodeBase64Audio, decodeAudioData } from '../services/geminiService';

interface ReaderProps {
  song: Song;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  theme: Theme;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Reader: React.FC<ReaderProps> = ({ song, onBack, isFavorite, onToggleFavorite, theme }) => {
  const [reflection, setReflection] = useState<string | null>(null);
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fontSize, setFontSize] = useState<number>(20);
  const [isShared, setIsShared] = useState(false);
  
  // Audio state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Pinch-to-zoom refs
  const initialDistRef = useRef<number | null>(null);
  const baseFontSizeRef = useRef<number>(20);

  const themeClasses = useMemo(() => {
    switch (theme) {
      case Theme.Dark: return 'bg-[#0f172a] text-[#f8fafc]';
      case Theme.Sepia: return 'bg-[#f4ecd8] text-[#5b4636]';
      default: return 'bg-[#fdfbf7] text-slate-800';
    }
  }, [theme]);

  const cardClasses = theme === Theme.Dark ? 'bg-slate-800 border-slate-700' : theme === Theme.Sepia ? 'bg-[#e9dfc4] border-[#dcd0b3]' : 'bg-white border-amber-100';

  const handleGetReflection = async () => {
    setIsLoadingReflection(true);
    const text = await generateReflection(song.title, song.lyrics);
    setReflection(text || "Unable to load reflection.");
    setIsLoadingReflection(false);
  };

  const handleShareSong = async () => {
    const shareText = `Sacred Melodies - ${song.title}\n\n${song.lyrics.join('\n')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: song.title, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (err) { console.error("Error sharing:", err); }
  };

  const stopAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    sourceNodeRef.current?.stop();
    setIsSpeaking(false);
    setCurrentTime(0);
  };

  const updateProgress = () => {
    if (!audioContextRef.current || !isSpeaking) return;
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
    setCurrentTime(Math.min(elapsed, duration));
    if (elapsed < duration) animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handlePlayAudio = async () => {
    if (isSpeaking) { stopAudio(); return; }
    setIsSpeaking(true);
    const base64 = await speakLyrics(song.lyrics.join(' '));
    if (!base64) { setIsSpeaking(false); return; }
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioData = decodeBase64Audio(base64);
    const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
    setDuration(audioBuffer.duration);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => { setIsSpeaking(false); setCurrentTime(0); };
    startTimeRef.current = audioContextRef.current.currentTime;
    source.start();
    sourceNodeRef.current = source;
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistRef.current = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      baseFontSizeRef.current = fontSize;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistRef.current !== null) {
      const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      const delta = dist - initialDistRef.current;
      setFontSize(Math.min(Math.max(14, baseFontSizeRef.current + delta * 0.15), 56));
    }
  };

  useEffect(() => {
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); sourceNodeRef.current?.stop(); };
  }, []);

  return (
    <div 
      className={`flex flex-col h-full transition-colors duration-500 overflow-hidden relative ${themeClasses}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => { initialDistRef.current = null; }}
    >
      {/* Animated Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {theme === Theme.Dark && (
          <div className="absolute inset-0">
            <style>{`
              @keyframes drift {
                from { transform: translateY(0) rotate(0deg); }
                to { transform: translateY(-100px) rotate(360deg); }
              }
            `}</style>
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-indigo-500/10 blur-3xl animate-pulse"
                style={{
                  width: `${200 + i * 50}px`,
                  height: `${200 + i * 50}px`,
                  left: `${Math.random() * 80}%`,
                  top: `${Math.random() * 80}%`,
                  animation: `drift ${20 + i * 5}s linear infinite alternate`,
                  opacity: 0.3 + i * 0.05
                }}
              />
            ))}
          </div>
        )}
        {theme === Theme.Sepia && (
          <div className="absolute inset-0">
            <style>{`
              @keyframes lightRay {
                0% { opacity: 0.1; transform: translateX(-10%) rotate(-5deg); }
                50% { opacity: 0.3; transform: translateX(10%) rotate(5deg); }
                100% { opacity: 0.1; transform: translateX(-10%) rotate(-5deg); }
              }
            `}</style>
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-amber-200/5 via-transparent to-amber-100/10"
              style={{ animation: 'lightRay 15s ease-in-out infinite' }}
            />
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/10 blur-[120px] rounded-full" />
          </div>
        )}
        {theme === Theme.Light && (
          <div className="absolute inset-0">
            <style>{`
              @keyframes waveFlow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(270deg, #60a5fa, #fbbf24, #60a5fa)',
                backgroundSize: '400% 400%',
                animation: 'waveFlow 20s ease infinite'
              }}
            />
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-100/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-50/30 blur-[100px] rounded-full" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className={`flex flex-col border-b backdrop-blur-md sticky top-0 z-20 ${theme === Theme.Dark ? 'bg-slate-900/80 border-slate-800' : theme === Theme.Sepia ? 'bg-[#f4ecd8]/80 border-[#dcd0b3]' : 'bg-[#fdfbf7]/80 border-amber-100/50'}`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme === Theme.Dark ? 'hover:bg-slate-800' : 'hover:bg-amber-50'}`}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => onToggleFavorite(song.id)} className={`p-2 rounded-full transition-all ${isFavorite ? 'text-rose-500 scale-110' : 'opacity-40'}`}>
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="text-center overflow-hidden max-w-[40%]">
            <h1 className="text-sm font-bold leading-none truncate">{song.title}</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1 truncate">{song.reference}</p>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={handleShareSong} className={`p-2 rounded-full transition-colors ${theme === Theme.Dark ? 'hover:bg-slate-800' : 'hover:bg-amber-50'}`}>
              {isShared ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button onClick={() => setFontSize(prev => prev >= 32 ? 16 : prev + 4)} className={`p-2 rounded-full transition-colors ${theme === Theme.Dark ? 'hover:bg-slate-800' : 'hover:bg-amber-50'}`}>
              <FontIcon className="w-5 h-5" />
            </button>
            <button onClick={handlePlayAudio} className={`p-2 rounded-full transition-all ${isSpeaking ? (theme === Theme.Dark ? 'bg-slate-700' : 'bg-amber-100 text-amber-700') : (theme === Theme.Dark ? 'hover:bg-slate-800' : 'hover:bg-amber-50')}`}>
              {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isSpeaking && (
          <div className="px-6 pb-2 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold w-8 opacity-60">{formatTime(currentTime)}</span>
              <div className={`flex-1 h-1 rounded-full overflow-hidden ${theme === Theme.Dark ? 'bg-slate-800' : 'bg-amber-100'}`}>
                <div className="h-full bg-amber-500 transition-all duration-100 ease-linear" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
              <span className="text-[9px] font-bold w-8 text-right opacity-40">{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-10 selection:bg-amber-100 z-10">
        <div className="max-w-md mx-auto">
          <div className="space-y-6">
            {song.lyrics.map((line, idx) => (
              <p 
                key={idx} 
                className={`font-serif leading-relaxed text-center transition-all duration-300 ${line === "" ? "py-4" : ""}`}
                style={{ fontSize: `${Math.round(fontSize)}px`, color: theme === Theme.Dark ? '#cbd5e1' : theme === Theme.Sepia ? '#433422' : '#1e293b' }}
              >
                {line}
              </p>
            ))}
          </div>

          <div className="mt-16 pb-20">
            {!reflection && !isLoadingReflection ? (
              <button onClick={handleGetReflection} className={`w-full py-4 px-6 border rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm font-semibold ${theme === Theme.Dark ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-amber-50/30 border-amber-200 text-amber-800 hover:bg-amber-50'}`}>
                <Sparkles className="w-4 h-4" /> Spiritual Reflection
              </button>
            ) : (
              <div className={`rounded-3xl p-6 shadow-sm border animate-in fade-in zoom-in-95 duration-500 ${cardClasses}`}>
                <div className="flex items-center gap-2 mb-3 text-amber-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Divine Insight</span>
                </div>
                {isLoadingReflection ? (
                  <div className="space-y-2 animate-pulse">
                    <div className={`h-3 rounded w-full ${theme === Theme.Dark ? 'bg-slate-700' : 'bg-amber-50'}`}></div>
                    <div className={`h-3 rounded w-5/6 ${theme === Theme.Dark ? 'bg-slate-700' : 'bg-amber-50'}`}></div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed italic opacity-80">{reflection}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;
