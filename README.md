# 🎌 OtakuPulse - Next-Gen Anime Discovery & Tracking Platform

![OtakuPulse Banner](https://otaku-pulse.vercel.app/banner-placeholder.webp)

**OtakuPulse** is a modern, high-performance web application designed for anime enthusiasts to discover trending titles, track episode-by-episode watch progress, calculate exact watch time statistics, write reviews, and customize their anime profile.

🌐 **Live Application**: [https://otaku-pulse.vercel.app](https://otaku-pulse.vercel.app)

---

## 🚀 Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Authentication**: [Supabase PostgreSQL](https://supabase.com/) & `@supabase/ssr` PKCE Auth Suite
- **API Clients**: Jikan API v4 (MyAnimeList REST API) & AniList GraphQL API
- **State Management & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Styling & UI**: Tailwind CSS, Glassmorphism Design System, Lucide React Icons

---

## ✨ Key Features & Implementation Details

### 1. 🎬 Dynamic Featured Spotlight Hero Carousel
- **Implementation**: Powered by `getHeroFeaturedAnime()` in `lib/api/jikanClient.ts`.
- Fetches a curated pool of 30 top-rated anime recommendation candidates and randomly shuffles them (`[...pool].sort(() => Math.random() - 0.5)`) on every page load.
- Displays high-resolution backdrop art, genre badges, synopsis previews, and quick action buttons (*"Add to Watchlist"* / *"View Details"*).

### 2. 🔍 Dual Title & Genre Search Engine
- **Implementation**: Enhanced `searchAnime()` in `lib/api/jikanClient.ts`.
- Detects whether search queries match popular genre names (e.g., *Action, Romance, Isekai, Sci-Fi, Fantasy, Slice of Life*).
- Executes dual queries across anime titles and genre filters, prioritizing exact title matches first followed by genre results.

### 3. 📊 Episode-by-Episode Progress Tracker
- **Implementation**: `public.watchlist` table in Supabase.
- Tracks `episodes_watched` vs `total_episodes` for every anime.
- **Strict Clamping Logic**: Prevents episode counters from exceeding total available episodes. If watched episodes reach max count, status automatically flips to `COMPLETED`. If decremented below total episodes, it reverts to `WATCHING`.
- **Done & Save Modal**: Inline episode selector dialog with a clear **"Done & Save Progress"** button.

### 4. ⏱️ Accurate Per-Anime Watch Time Calculation
- **Implementation**: `lib/utils/duration.ts` parsing engine.
- Parses exact episode durations from API responses (e.g. `"30 min per ep"` $\rightarrow$ `30`, `"1 hr 25 min"` $\rightarrow$ `85`).
- Multiplies episode length by watched episodes per anime to compute precise watch time metrics presented in human-readable readouts (e.g., `Est. Watch Time: 3d 14h 20m`).

### 5. ✍️ Rich Profile Reviews & Favorites Grid
- **Implementation**: `public.reviews` and `public.favorites` in Supabase.
- **Metadata Resolver**: Automatically fetches anime titles and poster artwork via `getAnimeById(anime_id)` for any review lacking metadata.
- Renders rich review cards featuring HD poster banners, clickable anime title links, star rating pills (`10 / 10`), review dates, quote text boxes, and edit/delete controls.

### 6. ☑️ Verified Profile & Client-Side Image Compression
- **Verified Otaku Badge**: Displays a Facebook-style circular verified checkmark badge in OtakuPulse theme colors (`#FF2A5F` to `#8A2BE2`) beside the user's Full Name.
- **Canvas Image Compression**: Uses client-side HTML5 Canvas (`compressImage`) to resize and compress uploaded avatar photos to $250 \times 250\text{px}$ WebP blobs ($\sim 15\text{KB} - 25\text{KB}$) before sending to Supabase Storage, saving storage quota and speeding up load times.
- **Edit Mode Guard**: Restricts profile picture upload controls strictly to **"Edit Profile"** mode to prevent accidental file picker popups.

### 7. ⚠️ Account Deletion & Danger Zone
- Allows users to permanently erase their profile, watchlist, favorites, and reviews from Supabase.
- Includes a safety modal requiring users to type the exact confirmation phrase `deletemyaccount`.

### 8. 🔑 Official Supabase Auth Suite & Password Reset
- **Email & Password Authentication**: Built according to official Supabase Auth documentation using `@supabase/ssr`.
- **PKCE Callback**: Routes email confirmations and password recovery through `/auth/callback` to exchange server-side codes for sessions.
- **Multi-Channel Password Reset**:
  1. **Email Reset Link**: Sends recovery emails directing users to `/auth/reset-password`.
  2. **OTP Security Code Verification**: Fallback 6-digit OTP code entry mode (`verifyOtp`) for users resetting passwords directly or bypassing email rate limits.
- **Show / Hide Password Eye Toggle**: Password visibility toggle buttons across all auth forms.

---

## 📡 External APIs Integration

### 1. Jikan API v4 (MyAnimeList REST API)
- **Base URL**: `https://api.jikan.moe/v4`
- **Endpoints Used**:
  - `GET /top/anime` - Trending and top-rated anime lists.
  - `GET /seasons/now` - Current season anime releases.
  - `GET /anime/{id}` - Complete metadata, episode counts, and duration specs.
  - `GET /anime?q={query}` - Search anime by title and keywords.
  - `GET /anime?genres={id}` - Filter anime by genre IDs.
  - `GET /random/anime` - Powers the *"Surprise Me"* random anime button.

### 2. AniList GraphQL API
- **Base URL**: `https://graphql.anilist.co`
- **Queries Used**:
  - Serves high-definition hero banner backgrounds, official trailer embeds, and secondary metadata fallback.

---

## 🛠️ Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/abidhasansojib/otaku-pulse.git
   cd otaku-pulse
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📄 Database Schema Overview (Supabase PostgreSQL)

- **`public.profiles`**: `id` (UUID), `username` (Text), `avatar_url` (Text), `bio` (Text), `created_at`.
- **`public.watchlist`**: `id`, `user_id`, `anime_id`, `title`, `poster_url`, `status`, `episodes_watched`, `total_episodes`, `duration_minutes`, `created_at`.
- **`public.favorites`**: `id`, `user_id`, `anime_id`, `title`, `poster_url`, `created_at`.
- **`public.reviews`**: `id`, `user_id`, `anime_id`, `anime_title`, `poster_url`, `rating`, `review_text`, `created_at`.

---

Developed with ❤️ for anime fans worldwide.
