
import React, { useState } from 'react';
import { SearchIcon } from './icons/Icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('Campinas');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-20">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Para onde vamos?"
          className="w-full pl-12 pr-4 py-3 bg-slate-800/80 backdrop-blur-sm text-white rounded-full shadow-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
          disabled={isLoading}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <SearchIcon />
        </div>
        <button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-4 rounded-full disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300">
            {isLoading ? 'Buscando...' : 'Ir'}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;