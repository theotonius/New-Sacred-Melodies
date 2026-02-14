
import React from 'react';
import { Song, Theme } from '../types';

interface SongCardProps {
  song: Song;
  theme: Theme;
  onClick: (song: Song) => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, theme, onClick }) => {
  const cardBgClasses = theme === Theme.Dark ? 'bg-slate-800 border-slate-700' : theme === Theme.Sepia ? 'bg-[#e9dfc4] border-[#dcd0b3]' : 'bg-white border-amber-50';
  const titleClasses = theme === Theme.Dark ? 'text-white' : theme === Theme.Sepia ? 'text-[#433422]' : 'text-slate-800';
  const subClasses = theme === Theme.Dark ? 'text-slate-400' : theme === Theme.Sepia ? 'text-[#8b6d4d]' : 'text-slate-500';

  return (
    <div 
      onClick={() => onClick(song)}
      className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border ${cardBgClasses}`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img 
          src={song.image} 
          alt={song.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
      </div>
      <div className="p-4">
        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
            theme === Theme.Dark ? 'bg-indigo-900/30 text-indigo-400' : theme === Theme.Sepia ? 'bg-[#dcd0b3] text-[#5b4636]' : 'bg-amber-50 text-amber-600'
        }`}>
          {song.category}
        </span>
        <h3 className={`mt-2 text-lg font-bold leading-tight ${titleClasses}`}>
          {song.title}
        </h3>
        <p className={`text-xs mt-1 italic ${subClasses}`}>{song.reference}</p>
      </div>
    </div>
  );
};

export default SongCard;
