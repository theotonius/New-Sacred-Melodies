import React, { useState, useMemo, useEffect } from 'react';
import { BIBLE_SONGS, PRE_CACHED_STUDIES } from './constants';
import { Song, AppTab, UserProfile, SavedStudy, Theme } from './types';
import SongCard from './components/SongCard';
import Reader from './components/Reader';
// Fix: Added missing CloudOff and X icons to the lucide-react import
import { Music, Search, Heart, User, Sparkles, Loader2, BookOpen, LogOut, ShieldCheck, Bookmark, Trash2, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, AlertCircle, Clock, Moon, Sun, Coffee, Code2, Github, Globe, Linkedin, Mail, Smartphone, Award, CloudOff, X } from 'lucide-react';
import { fetchSongFromAI, explainVerse } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Library);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showOnlyFavoritesInLibrary, setShowOnlyFavoritesInLibrary] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('sm_theme');
    return (saved as Theme) || Theme.Light;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sm_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [savedStudies, setSavedStudies] = useState<SavedStudy[]>(() => {
    const saved = localStorage.getItem('sm_saved_studies');
    const userStudies: SavedStudy[] = saved ? JSON.parse(saved) : [];
    // Ensure pre-cached studies are present if not already in user studies
    const combined = [...userStudies];
    PRE_CACHED_STUDIES.forEach(pre => {
      if (!combined.some(s => s.reference.toLowerCase() === pre.reference.toLowerCase())) {
        combined.push(pre);
      }
    });
    return combined;
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('sm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<{reference: string, content: string} | null>(null);
  
  const [customSongs, setCustomSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('sm_custom_songs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('sm_favorites', JSON.stringify(favorites));
    localStorage.setItem('sm_saved_studies', JSON.stringify(savedStudies));
    localStorage.setItem('sm_custom_songs', JSON.stringify(customSongs));
    localStorage.setItem('sm_theme', theme);
    document.documentElement.className = theme;
  }, [favorites, savedStudies, customSongs, theme]);

  const allSongs = useMemo(() => [...BIBLE_SONGS, ...customSongs], [customSongs]);

  const filteredSongs = useMemo(() => {
    let list = allSongs;
    if (activeCategory !== 'All') {
      list = list.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (showOnlyFavoritesInLibrary) {
      list = list.filter(s => favorites.includes(s.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.reference.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, allSongs, favorites, activeCategory, showOnlyFavoritesInLibrary]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    if (!isOnline) {
      alert("AI সার্চের জন্য ইন্টারনেট প্রয়োজন।");
      return;
    }
    setIsSearchingAI(true);
    const result = await fetchSongFromAI(searchQuery);
    if (result) {
      const newSong: Song = {
        ...result,
        id: `ai-${Date.now()}`,
        image: `https://picsum.photos/seed/${encodeURIComponent(result.title)}/800/600`
      };
      setCustomSongs(prev => [newSong, ...prev]);
      setSelectedSong(newSong);
      setActiveTab(AppTab.Reader);
    } else {
      alert("দুঃখিত, গানটি পাওয়া যায়নি। অনুগ্রহ করে অন্যভাবে চেষ্টা করুন।");
    }
    setIsSearchingAI(false);
  };

  const handleVerseExplain = async (ref?: string) => {
    const targetRef = ref || searchQuery;
    if (!targetRef.trim()) return;

    // Check if we have it offline
    const existing = savedStudies.find(s => s.reference.toLowerCase() === targetRef.toLowerCase());
    
    if (!isOnline && !existing) {
      alert("অফলাইনে এই ব্যাখ্যাটি নেই। অনুগ্রহ করে ইন্টারনেট কানেক্ট করুন।");
      return;
    }

    if (!isOnline && existing) {
      setCurrentExplanation({ reference: existing.reference, content: existing.content });
      return;
    }

    setIsExplaining(true);
    setCurrentExplanation(null);
    const result = await explainVerse(targetRef);
    if (result) {
      setCurrentExplanation({ reference: targetRef, content: result });
    } else if (existing) {
      setCurrentExplanation({ reference: existing.reference, content: existing.content });
      alert("নতুন ব্যাখ্যা লোড করা যায়নি, সংরক্ষিত ভার্সন দেখানো হচ্ছে।");
    }
    setIsExplaining(false);
  };

  const saveStudyOffline = () => {
    if (!currentExplanation) return;
    const existingIdx = savedStudies.findIndex(s => s.reference.toLowerCase() === currentExplanation.reference.toLowerCase());
    
    const newStudy: SavedStudy = {
      id: existingIdx >= 0 ? savedStudies[existingIdx].id : `study-${Date.now()}`,
      reference: currentExplanation.reference,
      content: currentExplanation.content,
      timestamp: Date.now()
    };

    if (existingIdx >= 0) {
      const updated = [...savedStudies];
      updated[existingIdx] = newStudy;
      setSavedStudies(updated);
    } else {
      setSavedStudies(prev => [newStudy, ...prev]);
    }
    alert("অফলাইনে সেভ করা হয়েছে!");
  };

  const syncStudy = async (study: SavedStudy) => {
    if (!isOnline) return;
    setSyncingId(study.id);
    const result = await explainVerse(study.reference);
    if (result) {
      setSavedStudies(prev => prev.map(s => s.id === study.id ? { ...s, content: result, timestamp: Date.now() } : s));
    }
    setSyncingId(null);
  };

  const deleteSavedStudy = (id: string) => {
    if (confirm("আপনি কি নিশ্চিতভাবে এটি মুছতে চান?")) {
      setSavedStudies(prev => prev.filter(s => s.id !== id));
    }
  };

  const themeClasses = useMemo(() => {
    switch (theme) {
      case Theme.Dark: return 'bg-[#0f172a] text-[#f8fafc]';
      case Theme.Sepia: return 'bg-[#f4ecd8] text-[#5b4636]';
      default: return 'bg-[#fafafa] text-slate-900';
    }
  }, [theme]);

  const cardBgClasses = theme === Theme.Dark ? 'bg-slate-800 border-slate-700' : theme === Theme.Sepia ? 'bg-[#e9dfc4] border-[#dcd0b3]' : 'bg-white border-slate-100';

  if (selectedSong && activeTab === AppTab.Reader) {
    return (
      <Reader 
        song={selectedSong} 
        onBack={() => { setSelectedSong(null); setActiveTab(AppTab.Library); }} 
        isFavorite={favorites.includes(selectedSong.id)}
        onToggleFavorite={toggleFavorite}
        theme={theme}
      />
    );
  }

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${themeClasses}`}>
      <header className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl hidden md:block ${theme === Theme.Dark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <Music className="w-5 h-5" />
             </div>
             <h1 className="text-xl font-black tracking-tighter">Sacred Melodies</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab(AppTab.Library)} className={`text-sm font-bold transition-all ${activeTab === AppTab.Library ? 'text-indigo-600' : 'opacity-40 hover:opacity-100'}`}>Library</button>
            <button onClick={() => setActiveTab(AppTab.Study)} className={`text-sm font-bold transition-all ${activeTab === AppTab.Study ? 'text-indigo-600' : 'opacity-40 hover:opacity-100'}`}>Bible Study</button>
            <button onClick={() => setActiveTab(AppTab.Reflections)} className={`text-sm font-bold transition-all ${activeTab === AppTab.Reflections ? 'text-indigo-600' : 'opacity-40 hover:opacity-100'}`}>Saved</button>
            <div className="w-px h-6 bg-slate-200" />
            
            {!isOnline && (
               <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">
                 <CloudOff className="w-3 h-3" /> Offline
               </div>
            )}

            <button onClick={() => setTheme(theme === Theme.Dark ? Theme.Light : Theme.Dark)} className="p-2 rounded-xl border opacity-70 hover:opacity-100 transition-all">
              {theme === Theme.Dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setActiveTab(AppTab.Profile)} className={`w-8 h-8 rounded-full border overflow-hidden ${cardBgClasses}`}>
               {user ? <img src={user.photo} alt="User" /> : <User className="w-4 h-4 m-auto opacity-30" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-10 pb-32 md:pt-28">
        <div className="page-transition">
          {activeTab === AppTab.Library && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">গীতিমালা ও আরাধনা</h2>
                  <p className="text-lg opacity-60 font-medium max-w-xl">আপনার পছন্দের গানের লিরিক্স খুঁজুন অথবা AI এর সাহায্য নিন নতুন কিছু খুঁজতে।</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['All', 'Hymn', 'Worship', 'Kids', 'Praise'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : cardBgClasses + ' opacity-60 hover:opacity-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative max-w-2xl">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="গানের নাম লিখুন অথবা AI কে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                    className={`w-full py-5 pl-14 pr-6 rounded-[2rem] border text-lg focus:ring-4 transition-all shadow-sm ${theme === Theme.Dark ? 'bg-slate-800 border-slate-700 text-white focus:ring-slate-700' : 'bg-white border-slate-200 focus:ring-indigo-50'}`}
                 />
                 {isSearchingAI && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                       <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest hidden sm:inline">Searching AI...</span>
                    </div>
                 )}
              </div>

              {filteredSongs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {filteredSongs.map(song => (
                    <SongCard key={song.id} song={song} theme={theme} onClick={setSelectedSong} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">কিছু পাওয়া যায়নি</h3>
                    <p className="opacity-50 mt-2 font-medium">আপনার কি অন্য কোনো গান খুঁজছেন? AI এর সাহায্য নিন।</p>
                  </div>
                  <button 
                    onClick={handleAISearch}
                    disabled={isSearchingAI || !searchQuery.trim()}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSearchingAI ? "AI খুঁজছে..." : "Search with AI"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.Study && (
             <div className="max-w-4xl mx-auto space-y-16 py-10">
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-amber-100/30">
                      <BookOpen className="w-10 h-10" />
                   </div>
                   <h2 className="text-4xl font-black tracking-tight">বাইবেল স্টাডি</h2>
                   <p className="opacity-60 text-lg">অফলাইনে পড়ার জন্য আপনার প্রিয় পদের ব্যাখ্যা সেভ করে রাখুন।</p>
                </div>
                
                <div className="relative group max-w-2xl mx-auto">
                   <input 
                      type="text" 
                      placeholder="যেমন: যোহন ৩:১৬..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerseExplain()}
                      className={`w-full py-6 px-8 rounded-[2.5rem] border text-xl focus:ring-8 transition-all shadow-2xl ${theme === Theme.Dark ? 'bg-slate-800 border-slate-700 text-white focus:ring-slate-700/50' : 'bg-white border-slate-200 focus:ring-amber-50'}`}
                   />
                   <button onClick={() => handleVerseExplain()} className="absolute right-4 top-1/2 -translate-y-1/2 p-5 bg-indigo-600 text-white rounded-full shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                      {isExplaining ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                   </button>
                </div>

                {currentExplanation && (
                   <div className={`p-10 rounded-[3rem] border shadow-2xl font-serif leading-relaxed text-xl animate-in fade-in slide-in-from-bottom-4 relative ${cardBgClasses}`}>
                      <div className="absolute top-8 right-8 flex gap-2">
                        <button 
                          onClick={saveStudyOffline}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                        >
                          <Bookmark className="w-4 h-4" /> Save Offline
                        </button>
                        <button onClick={() => setCurrentExplanation(null)} className="p-2 rounded-xl border opacity-30 hover:opacity-100 transition-opacity">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap mt-8">
                        {currentExplanation.content}
                      </div>
                   </div>
                )}

                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <Bookmark className="w-6 h-6 text-indigo-600" /> সংরক্ষিত ব্যাখ্যাসমূহ
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-black uppercase opacity-40">
                      {isOnline ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <CloudOff className="w-4 h-4 text-amber-500" />}
                      {isOnline ? "Online Sync Active" : "Offline Mode"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedStudies.length > 0 ? (
                      savedStudies.map(study => (
                        <div key={study.id} className={`p-6 rounded-[2rem] border group transition-all hover:shadow-xl ${cardBgClasses}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xl font-black">{study.reference}</h4>
                              <p className="text-[10px] opacity-40 flex items-center gap-1 font-bold uppercase mt-1">
                                <Clock className="w-3 h-3" /> Updated {new Date(study.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {isOnline && (
                                <button 
                                  onClick={() => syncStudy(study)}
                                  className={`p-2 rounded-xl border transition-all ${syncingId === study.id ? 'bg-indigo-50 text-indigo-600' : 'opacity-30 hover:opacity-100 hover:bg-slate-50'}`}
                                  title="Sync/Update"
                                >
                                  <RefreshCw className={`w-4 h-4 ${syncingId === study.id ? 'animate-spin' : ''}`} />
                                </button>
                              )}
                              <button onClick={() => deleteSavedStudy(study.id)} className="p-2 rounded-xl border opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm opacity-60 line-clamp-3 mb-6 font-medium italic leading-relaxed">
                            {study.content.split('\n')[0]}...
                          </p>
                          <button 
                            onClick={() => handleVerseExplain(study.reference)}
                            className="w-full py-3 border border-indigo-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            Read Full Explanation
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center opacity-30">
                        <Bookmark className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-bold">কোনো ব্যাখ্যা সংরক্ষিত নেই</p>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          )}

          {activeTab === AppTab.Reflections && (
             <div className="space-y-10">
               <div>
                  <h2 className="text-4xl font-black tracking-tighter mb-4">Saved Journey</h2>
                  <p className="text-lg opacity-60 font-medium">আপনার প্রিয় গানগুলো এখানে সংরক্ষিত আছে।</p>
               </div>
               
               {favorites.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {allSongs.filter(s => favorites.includes(s.id)).map(song => (
                       <SongCard key={song.id} song={song} theme={theme} onClick={setSelectedSong} />
                    ))}
                 </div>
               ) : (
                 <div className="py-20 text-center opacity-40">
                   <Heart className="w-16 h-16 mx-auto mb-4" />
                   <p className="text-lg font-bold">কোনো গান সেভ করা নেই</p>
                 </div>
               )}
             </div>
          )}

          {activeTab === AppTab.Profile && (
             <div className="max-w-md mx-auto py-12">
                <div className="space-y-10 text-center">
                   <div className="relative inline-block">
                      <div className="w-36 h-36 rounded-[3rem] p-1.5 border-4 border-indigo-600 shadow-2xl overflow-hidden">
                         <img src={user?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'} alt="Avatar" className="w-full h-full object-cover rounded-[2.5rem]" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-[#fafafa] shadow-lg">
                         <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                   </div>
                   
                   <div>
                      <h2 className="text-3xl font-black">{user?.name || 'Guest'}</h2>
                      <p className="opacity-50 font-bold uppercase tracking-widest text-[10px] mt-2">{user?.email || 'Login to save your library'}</p>
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                     <button onClick={() => setTheme(Theme.Light)} className={`p-5 rounded-2xl border transition-all ${theme === Theme.Light ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : cardBgClasses}`}><Sun className="w-6 h-6 m-auto" /></button>
                     <button onClick={() => setTheme(Theme.Sepia)} className={`p-5 rounded-2xl border transition-all ${theme === Theme.Sepia ? 'bg-orange-50 border-orange-200 text-orange-600' : cardBgClasses}`}><Coffee className="w-6 h-6 m-auto" /></button>
                     <button onClick={() => setTheme(Theme.Dark)} className={`p-5 rounded-2xl border transition-all ${theme === Theme.Dark ? 'bg-slate-700 border-slate-600 text-white' : cardBgClasses}`}><Moon className="w-6 h-6 m-auto" /></button>
                   </div>

                   <button onClick={() => setActiveTab(AppTab.Developer)} className={`w-full p-6 rounded-[2rem] border font-bold flex items-center justify-between group transition-all hover:scale-[1.02] ${cardBgClasses}`}>
                      <span className="flex items-center gap-4"><Code2 className="w-6 h-6 text-indigo-500" /> Developer Profile</span>
                      <ChevronRight className="w-6 h-6 opacity-30 group-hover:opacity-100" />
                   </button>
                   
                   <button className="w-full p-6 bg-rose-50 text-rose-600 rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-rose-100 transition-all">
                      <LogOut className="w-5 h-5" /> Sign Out
                   </button>
                </div>
             </div>
          )}

          {activeTab === AppTab.Developer && (
            <div className="max-w-2xl mx-auto py-12">
               <button onClick={() => setActiveTab(AppTab.Profile)} className="flex items-center gap-2 mb-10 font-black text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                 <ChevronLeft className="w-5 h-5" /> Back to Profile
               </button>
               <div className={`p-12 rounded-[4rem] border shadow-2xl relative overflow-hidden ${cardBgClasses}`}>
                  <div className="relative z-10 flex flex-col items-center">
                     <div className="relative mb-10">
                        <div className="w-56 h-56 rounded-[4rem] p-1.5 border-4 border-indigo-600 shadow-2xl overflow-hidden">
                           <img src="https://media.licdn.com/dms/image/v2/C4D03AQH4u2X5M9E83w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1654512403714?e=1746662400&v=beta&t=90Gz0p-C3p-kPIdmK940L638G5XqIeXvYIq40Uq4-uU" className="w-full h-full object-cover rounded-[3.5rem]" alt="Developer" />
                        </div>
                        <Award className="absolute -bottom-4 -right-4 w-16 h-16 text-white bg-indigo-600 p-4 rounded-[1.5rem] border-4 border-slate-900 shadow-2xl" />
                     </div>
                     <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">SOBUJ THEOTONIUS BISWAS</h2>
                     <p className="text-indigo-500 font-black tracking-[0.4em] uppercase text-xs mb-8">Fullstack AI Engineer</p>
                     
                     <div className="w-full space-y-5">
                        <a href="tel:+8801614802711" className="flex items-center justify-between p-7 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:scale-[1.01] transition-all">
                           <div className="flex items-center gap-5">
                              <Smartphone className="w-8 h-8 opacity-60" />
                              <div className="text-left">
                                 <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Connect</p>
                                 <p className="text-xl font-black">+8801614802711</p>
                              </div>
                           </div>
                           <ChevronRight className="w-7 h-7" />
                        </a>
                        <div className="grid grid-cols-4 gap-4">
                           <button className={`p-5 rounded-[1.5rem] border flex items-center justify-center transition-all hover:scale-110 ${cardBgClasses}`}><Github className="w-6 h-6" /></button>
                           <button className={`p-5 rounded-[1.5rem] border flex items-center justify-center transition-all hover:scale-110 ${cardBgClasses} text-blue-500`}><Globe className="w-6 h-6" /></button>
                           <button className={`p-5 rounded-[1.5rem] border flex items-center justify-center transition-all hover:scale-110 ${cardBgClasses} text-indigo-600`}><Linkedin className="w-6 h-6" /></button>
                           <button className={`p-5 rounded-[1.5rem] border flex items-center justify-center transition-all hover:scale-110 ${cardBgClasses} text-rose-500`}><Mail className="w-6 h-6" /></button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-50 py-4 px-6 border-t backdrop-blur-xl md:hidden transition-all ${theme === Theme.Dark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]'}`}>
        <div className="max-w-lg mx-auto flex justify-between items-center">
           <NavButton active={activeTab === AppTab.Library} onClick={() => setActiveTab(AppTab.Library)} icon={<Music />} label="Library" />
           <NavButton active={activeTab === AppTab.Study} onClick={() => setActiveTab(AppTab.Study)} icon={<BookOpen />} label="Study" />
           <NavButton active={activeTab === AppTab.Reflections} onClick={() => setActiveTab(AppTab.Reflections)} icon={<Heart />} label="Saved" />
           <NavButton active={activeTab === AppTab.Profile} onClick={() => setActiveTab(AppTab.Profile)} icon={<User />} label="Profile" />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactElement<any>; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'scale-110' : 'opacity-40 hover:opacity-70'}`}>
     <div className={`p-3.5 rounded-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : ''}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
     </div>
     <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;