-- Migration: 004_add_duration_minutes.sql
-- Description: Adds duration_minutes column to watchlist table for per-anime episode length tracking

ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 24 NOT NULL;
