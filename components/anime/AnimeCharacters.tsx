'use client';

import React from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Users, Mic } from 'lucide-react';
import { getAnimeCharacters, CharacterMember } from '../../lib/api/jikanClient';
import { Badge } from '../ui/Badge';

export function AnimeCharacters({ animeId }: { animeId: number }) {
  const { data: characters, isLoading } = useQuery({
    queryKey: ['animeCharacters', animeId],
    queryFn: () => getAnimeCharacters(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading || !characters || characters.length === 0) return null;

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8A2BE2] to-[#FF2A5F] text-white flex items-center justify-center shadow-lg shadow-[#8A2BE2]/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              Main Cast & Voice Actors (Seiyuu)
            </h3>
            <p className="text-xs text-slate-400">Jikan API verified voice actor cast</p>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 min-w-0">
        {characters.map((item, idx) => {
          const charImage =
            item.character.images?.webp?.image_url ||
            item.character.images?.jpg?.image_url ||
            '/banner-placeholder.webp';

          const JapaneseActor = item.voice_actors?.find(
            (va) => va.language.toLowerCase() === 'japanese'
          ) || item.voice_actors?.[0];

          const actorImage = JapaneseActor?.person?.images?.jpg?.image_url || '/logo.png';

          return (
            <div
              key={`char-${item.character.mal_id}-${idx}`}
              className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3 min-w-0"
            >
              {/* Character Left */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                  <Image
                    src={charImage}
                    alt={item.character.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.character.name}</h4>
                  <Badge
                    variant={item.role.toLowerCase() === 'main' ? 'primary' : 'outline'}
                    size="sm"
                    className="mt-0.5"
                  >
                    {item.role}
                  </Badge>
                </div>
              </div>

              {/* Japanese Voice Actor Right */}
              {JapaneseActor && (
                <div className="flex items-center gap-2.5 min-w-0 text-right shrink-0">
                  <div className="min-w-0">
                    <h5 className="text-[11px] font-bold text-slate-200 truncate max-w-[100px] sm:max-w-[120px]">
                      {JapaneseActor.person.name}
                    </h5>
                    <span className="text-[9px] text-[#C77DFF] font-semibold flex items-center justify-end gap-1">
                      <Mic className="w-2.5 h-2.5" /> Seiyuu (JP)
                    </span>
                  </div>
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                    <Image
                      src={actorImage}
                      alt={JapaneseActor.person.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
