'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Search,
  Bookmark,
  Flame,
  Home,
  Compass,
  Dices,
  Calendar,
  User as UserIcon,
  LogOut,
  ListVideo,
  Settings,
} from 'lucide-react';
import { useFavorites } from '../../lib/hooks/useFavorites';
import { useAuth } from '../../lib/context/AuthContext';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(
  () => import('../auth/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { favorites, isLoaded } = useFavorites();
  const { user, profile, signOut } = useAuth();

  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRandomAnime = async () => {
    setIsRandomLoading(true);
    try {
      const res = await fetch('https://api.jikan.moe/v4/random/anime');
      const json = await res.json();
      if (json?.data?.mal_id) {
        router.push(`/anime/${json.data.mal_id}`);
      }
    } catch (err) {
      router.push('/anime/38826');
    } finally {
      setIsRandomLoading(false);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/seasons', label: 'Seasonal Hub', icon: Calendar },
    { href: '/search', label: 'Explore & Search', icon: Compass },
    { href: '/search?sort=desc&orderBy=score', label: 'Top Rankings', icon: Flame },
    { href: '/favorites', label: 'Favorites', icon: Bookmark, badge: favorites.length },
  ];

  const usernameDisplay = profile?.username || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || '/banner-placeholder.webp';
  const hasAvatar = profile?.avatar_url && !profile.avatar_url.includes('placeholder');

  return (
    <>
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
                search anime
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const searchStr = typeof window !== 'undefined' ? window.location.search : '';
              const isActive =
                item.href.includes('sort=')
                  ? pathname + searchStr === item.href
                  : pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] text-white shadow-md shadow-[#FF2A5F]/20'
                      : 'text-slate-300 hover:text-[#FF2A5F] hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isLoaded && item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-white text-[#0B0F19] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right-aligned Auth & Profile Photo Button */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Ultra-Modern Cyberpunk Profile Button */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative p-[2px] rounded-full bg-gradient-to-tr from-[#FF2A5F] via-[#8A2BE2] to-cyan-400 hover:shadow-[0_0_20px_rgba(255,42,95,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group focus:outline-none"
                  title={usernameDisplay}
                >
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-950 flex items-center justify-center">
                    {hasAvatar ? (
                      <Image src={avatarUrl} alt={usernameDisplay} fill className="object-cover group-hover:scale-110 transition-transform duration-300" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center text-white font-black text-xs tracking-wider">
                        {usernameDisplay.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-slate-900/95 backdrop-blur-sm border border-slate-800 shadow-2xl rounded-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-800 mb-1 bg-slate-950/60 rounded-xl flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                        {hasAvatar ? (
                          <Image src={avatarUrl} alt={usernameDisplay} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center text-white font-bold text-xs">
                            {usernameDisplay.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate">{usernameDisplay}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <UserIcon className="w-4 h-4 text-[#FF2A5F]" />
                      <span>My Profile &amp; Dashboard</span>
                    </Link>

                    <Link
                      href="/profile?edit=true"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Edit Profile</span>
                    </Link>

                    <Link
                      href="/profile?tab=watchlist"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <ListVideo className="w-4 h-4 text-[#8A2BE2]" />
                      <span>My Watchlist</span>
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Bookmark className="w-4 h-4 text-emerald-400" />
                      <span>Favorites Library</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all border-t border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF2A5F] to-[#8A2BE2] hover:scale-105 text-white text-xs font-black shadow-lg shadow-[#FF2A5F]/20 transition-all flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
