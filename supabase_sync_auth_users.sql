-- ==============================================================================
-- SYNC / CREATE AUTH USERS FOR IMPORTED STAFF MEMBERS
-- Creates auth login records (auth.users + auth.identities) with default password
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to safely create an auth user if not exists and link to staff_members
DO $$
DECLARE
    staff RECORD;
    v_user_id UUID;
    v_default_pw TEXT := 'Sakib@9700'; -- Default password for staff accounts
BEGIN
    FOR staff IN SELECT * FROM public.staff_members LOOP
        -- Check if user exists in auth.users
        SELECT id INTO v_user_id FROM auth.users WHERE email = staff.email;

        IF v_user_id IS NULL THEN
            v_user_id := gen_random_uuid();

            -- 1. Insert into auth.users
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
                v_user_id,
                'authenticated',
                'authenticated',
                staff.email,
                crypt(v_default_pw, gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                jsonb_build_object('full_name', staff.full_name, 'role', staff.role),
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            );

            -- 2. Insert into auth.identities (Required by GoTrue)
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
                v_user_id,
                v_user_id,
                format('{"sub":"%s","email":"%s"}', v_user_id, staff.email)::jsonb,
                'email',
                v_user_id::text,
                NOW(),
                NOW(),
                NOW()
            );

            RAISE NOTICE 'Created auth user for: %', staff.email;
        ELSE
            -- Update password & metadata if already exists
            UPDATE auth.users
            SET encrypted_password = crypt(v_default_pw, gen_salt('bf')),
                email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                raw_user_meta_data = jsonb_build_object('full_name', staff.full_name, 'role', staff.role),
                updated_at = NOW()
            WHERE id = v_user_id;

            RAISE NOTICE 'Updated existing auth user for: %', staff.email;
        END IF;

        -- 3. Link user_id in staff_members
        UPDATE public.staff_members
        SET user_id = v_user_id,
            status = 'active'
        WHERE email = staff.email;

    END LOOP;
END $$;
