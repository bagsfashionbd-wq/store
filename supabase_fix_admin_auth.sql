-- ==============================================================================
-- FIX SUPABASE AUTH USER FOR SAKIB.SAMADHAN@GMAIL.COM
-- Creates both auth.users and auth.identities (required by Supabase GoTrue Auth)
-- ==============================================================================

-- 1. Remove any previous broken entry
DELETE FROM auth.users WHERE email = 'sakib.samadhan@gmail.com';

-- 2. Insert valid Auth User and Identity
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Insert auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'sakib.samadhan@gmail.com',
        crypt('Sakib@9700', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Sakib Samadhan"}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Insert identity record (REQUIRED by Supabase GoTrue Auth to avoid 500 error)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id, 'sakib.samadhan@gmail.com')::jsonb,
        'email',
        new_user_id::text,
        NOW(),
        NOW(),
        NOW()
    );

    -- Link into staff_members table
    INSERT INTO public.staff_members (
        user_id,
        email,
        full_name,
        role,
        status
    ) VALUES (
        new_user_id,
        'sakib.samadhan@gmail.com',
        'Sakib Samadhan',
        'shop_owner',
        'active'
    )
    ON CONFLICT (email) DO UPDATE
    SET user_id = new_user_id, role = 'shop_owner', status = 'active';

END $$;
