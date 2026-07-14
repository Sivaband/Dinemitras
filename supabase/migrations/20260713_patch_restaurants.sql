-- Supabase Database Redesign Migration Patch
-- Date: 2026-07-13
-- Add missing configuration columns to the restaurants table

ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.00;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1e1b18';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#d4af37';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5,2) DEFAULT 5.00;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS service_charge_percent DECIMAL(5,2) DEFAULT 5.00;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS business_hours TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS receipt_header TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS auto_print BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS printer_type TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS receipt_width TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS waiter_can_add_items BOOLEAN DEFAULT false;
