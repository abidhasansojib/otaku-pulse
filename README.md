# 🎌 OtakuPulse

**OtakuPulse** is a modern, high-performance web application for anime discovery, watch progress tracking, and personalized stats.

🌐 **Live Application**: [otaku-pulse.vercel.app](https://otaku-pulse.vercel.app)

---

## ✨ Features

- **Anime Discovery**: Browse top-rated, trending, and seasonal anime powered by Jikan and AniList APIs.
- **Progress Tracking**: Track episode-by-episode progress with automatic status updates.
- **Watch Time Stats**: Automatically calculate total time spent watching anime based on episode length.
- **Reviews & Favorites**: Share reviews with star ratings and build your personal favorites list.
- **Profile Customization**: Upload custom avatars, edit your bio, and view your stats.
- **Authentication**: Secure email authentication and password reset flows using Supabase Auth.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & TypeScript
- **Database & Auth**: Supabase (PostgreSQL & `@supabase/ssr`)
- **State & Data**: TanStack React Query v5
- **Styling**: Tailwind CSS & Lucide Icons
- **APIs**: Jikan REST API v4 & AniList GraphQL API

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abidhasansojib/otaku-pulse.git
   cd otaku-pulse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.
