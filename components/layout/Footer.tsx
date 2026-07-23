import React from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#080B13] mt-20 pb-20 md:pb-10 pt-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
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
              Anime Discovery, Real-time Search, and Global Rankings powered by Jikan APIs.
            </p>
          </div>

          {/* Col 2: Data Providers */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Data Providers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://anilist.co" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#8A2BE2] transition-colors">
                  AniList GraphQL <ExternalLink className="w-3 h-3" />
                </a>
              </li>
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
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs gap-4">
          <p>© {new Date().getFullYear()} OtakuPulse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
