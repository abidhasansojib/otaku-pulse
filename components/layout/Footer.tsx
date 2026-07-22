import React from 'react';
import Link from 'next/link';
import { Sparkles, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#080B13] mt-20 pb-20 md:pb-10 pt-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1 */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF2A5F] to-[#8A2BE2] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-wider">
                OTAKU<span className="text-[#FF2A5F]">PULSE</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm text-slate-400">
              Enterprise-grade Anime Discovery, Real-time Search, Global Rankings, and Multi-Audio Dub matrix powered by MyAnimeList, Jikan, and Kitsu APIs.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-[#FF2A5F] transition-colors">Home & Featured</Link></li>
              <li><Link href="/search" className="hover:text-[#FF2A5F] transition-colors">Advanced Search</Link></li>
              <li><Link href="/search?orderBy=score&sort=desc" className="hover:text-[#FF2A5F] transition-colors">Top 100 Rankings</Link></li>
              <li><Link href="/favorites" className="hover:text-[#FF2A5F] transition-colors">My Favorites</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Data Providers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://jikan.moe" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#8A2BE2] transition-colors">
                  Jikan API v4 <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://myanimelist.net" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#8A2BE2] transition-colors">
                  MyAnimeList <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://kitsu.io" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#8A2BE2] transition-colors">
                  Kitsu Cover Art <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs gap-4">
          <p>© {new Date().getFullYear()} OtakuPulse. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Jikan API v4 Connected
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
