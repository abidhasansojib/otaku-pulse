'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, Bookmark, Image as ImageIcon } from 'lucide-react';
import { useFavorites } from '../../lib/hooks/useFavorites';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { favorites, isLoaded } = useFavorites();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/seasons', label: 'Seasons', icon: Calendar },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/favorites', label: 'Favorites', icon: Bookmark, badge: favorites.length },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-4 py-2 bg-[#0B0F19]/90 backdrop-blur-xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !item.href.includes('orderBy='));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-[#FF2A5F]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isLoaded && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 text-[9px] font-bold bg-[#FF2A5F] text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
