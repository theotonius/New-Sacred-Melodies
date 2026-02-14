
import React from 'react';
import { Song, Theme } from '../types';

interface SongCardProps {
  song: Song;
  theme: Theme;
  onClick: (song: Song) => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, theme, onClick }) => {
  const cardBgClasses = theme === Theme.Dark ? 'bg-slate-800 border-slate-700' : theme === Theme.Sepia ? 'bg-[#e9dfc4] border-[#dcd0b3]' : 'bg-white border-slate-100';
  const titleClasses = theme === Theme.Dark ? 'text-white' : theme === Theme.Sepia ? 'text-[#433422]' : 'text-slate-800';
  const subClasses = theme === Theme.Dark ? 'text-slate-400' : theme === Theme.Sepia ? 'text-[#8b6d4d]' : 'text-slate-500';

  // Get first two non-empty lines for snippet
  const snippet = song.lyrics.filter(l => l.trim().length > 0).slice(0, 2).join('... ');

  return (
    <div 
      onClick={() => onClick(song)}
      className={`group relative rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border flex flex-col h-full ${cardBgClasses}`}
    >
      <div className="aspect-[16/10] w-full overflow-hidden relative">
        <img 
          src={song.image} 
          alt={song.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute top-4 left-4">
           <span className={`text-[9px] uppercase tracking-widest font-black px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md ${
              theme === Theme.Dark ? 'bg-indigo-600/80 text-white' : 'bg-white/90 text-indigo-600'
          }`}>
            {song.category}
          </span>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <h3 className={`text-xl font-black leading-tight tracking-tight ${titleClasses}`}>
            {song.title}
          </h3>
          <p className={`text-xs mt-1.5 font-bold uppercase tracking-widest opacity-40 ${subClasses}`}>{song.reference}</p>
        </div>
        
        {snippet && (
          <p className={`text-sm leading-relaxed line-clamp-2 opacity-60 font-medium italic ${titleClasses}`}>
            "{snippet}..."
          </p>
        )}
      </div>
    </div>
  );
};

export default SongCard;
