-- Migration: 003_add_total_episodes.sql
-- Description: Adds total_episodes column to watchlist table for tracking total anime length

ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS total_episodes INTEGER DEFAULT 0 NOT NULL;
