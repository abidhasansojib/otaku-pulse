'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Search, Bookmark, Flame, Home, Compass } from 'lucide-react';
import { useFavorites } from '../../lib/hooks/useFavorites';

export function Header() {
  const pathname = usePathname();
  const { favorites } = useFavorites();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Explore & Search', icon: Compass },
    { href: '/search?sort=desc&orderBy=score', label: 'Top Rankings', icon: Flame },
    { href: '/favorites', label: 'Favorites', icon: Bookmark, badge: favorites.length },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center shadow-lg shadow-[#FF2A5F]/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-white tracking-wider flex items-center gap-1">
              OTAKU<span className="text-[#FF2A5F]">PULSE</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
              Cyber Anime Hub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-white/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !item.href.includes('sort='));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white shadow-md shadow-[#FF2A5F]/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-white text-[#0B0F19] font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="p-2.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white hover:border-[#FF2A5F]/50 transition-all"
            aria-label="Search anime"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            href="/favorites"
            className="relative p-2.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 hover:text-[#FF2A5F] hover:border-[#FF2A5F]/50 transition-all md:hidden"
            aria-label="View Favorites"
          >
            <Bookmark className="w-4 h-4" />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF2A5F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
