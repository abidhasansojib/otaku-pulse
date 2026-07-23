-- Migration: 005_add_review_metadata.sql
-- Description: Adds anime_title and poster_url columns to public.reviews table for user profile review cards

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS anime_title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS poster_url TEXT;
