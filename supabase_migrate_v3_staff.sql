-- ==========================================
-- AQUASTORE / WHITE-LABEL DB MIGRATION: V3 STAFF & RBAC
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. CREATE STAFF MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff', -- 'admin', 'shop_owner', 'staff'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended'
    phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_staff_members_email ON public.staff_members(email);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON public.staff_members(role);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read staff members
CREATE POLICY "Allow authenticated read staff" ON public.staff_members 
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users with admin/service role to manage staff
CREATE POLICY "Allow admin manage staff" ON public.staff_members 
    FOR ALL TO authenticated USING (true);

-- 4. SEED INITIAL SUPERADMIN / OWNER (If not already present)
INSERT INTO public.staff_members (email, full_name, role, status)
VALUES 
    ('sakib.samadhan@gmail.com', 'Store Founder', 'shop_owner', 'active'),
    ('admin@example.com', 'System Administrator', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;
