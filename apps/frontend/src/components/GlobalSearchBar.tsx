'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchGlobalSearch, GlobalSearchResult } from '../lib/search-client';
import {
  Search,
  Box,
  Building2,
  MapPin,
  FileText,
  Briefcase,
  QrCode,
  Loader2,
  X,
  ChevronRight,
} from 'lucide-react';

export default function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetchGlobalSearch(query.trim());
        setResults(res);
        setIsOpen(true);
      } catch (err) {
        // Ignore search errors
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <div className="relative w-64 sm:w-80" ref={searchRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (results && query.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search Assets, Issues, Rooms, Vendors..."
          className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
        />

        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin absolute right-3" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              setIsOpen(false);
            }}
            className="absolute right-3 text-slate-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Live Autocomplete Dropdown */}
      {isOpen && results && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
            {results.totalMatches === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching assets, issues, buildings, or vendors found.
              </div>
            ) : (
              <>
                {/* 1. Assets */}
                {results.assets.length > 0 && (
                  <div className="space-y-1">
                    <span className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Box className="w-3 h-3 text-emerald-400" /> Assets ({results.assets.length})
                    </span>
                    {results.assets.map((a) => (
                      <Link
                        key={a.id}
                        href={`/assets`}
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors block"
                      >
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{a.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Tag: {a.assetTag}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* 2. Issues */}
                {results.issues.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3 text-rose-400" /> Issues ({results.issues.length})
                    </span>
                    {results.issues.map((i) => (
                      <Link
                        key={i.id}
                        href={`/issues/${i.id}`}
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors block"
                      >
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{i.title}</span>
                          <span className="text-[10px] font-mono text-indigo-400">{i.ticketNumber} &bull; {i.status}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* 3. Buildings & Rooms */}
                {(results.buildings.length > 0 || results.rooms.length > 0) && (
                  <div className="space-y-1 pt-1">
                    <span className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-cyan-400" /> Locations
                    </span>
                    {results.buildings.map((b) => (
                      <Link
                        key={b.id}
                        href={`/buildings`}
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors block"
                      >
                        <div>
                          <span className="font-bold text-white block">{b.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Building Code: {b.code}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      </Link>
                    ))}

                    {results.rooms.map((r) => (
                      <Link
                        key={r.id}
                        href={`/buildings`}
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors block"
                      >
                        <div>
                          <span className="font-bold text-white block">Room {r.roomNumber}</span>
                          <span className="text-[10px] text-slate-400">{r.building?.name} &bull; {r.type}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* 4. Vendors */}
                {results.vendors.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-purple-400" /> Vendors ({results.vendors.length})
                    </span>
                    {results.vendors.map((v) => (
                      <Link
                        key={v.id}
                        href={`/vendors/${v.id}`}
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors block"
                      >
                        <div>
                          <span className="font-bold text-white block">{v.companyName}</span>
                          <span className="text-[10px] text-slate-400">{v.phone}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* View All Button Footer */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 block"
            >
              View all results & Advanced Filters &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
