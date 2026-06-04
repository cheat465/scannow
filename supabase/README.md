# Supabase Database Setup

## Running the Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/001_create_profiles_table.sql`
4. Click **Run** to execute the migration

## What This Creates

- **profiles table**: Extends Supabase's built-in `auth.users` table with additional user information
- **Row Level Security (RLS)**: Ensures users can only access their own profile data
- **Automatic profile creation**: When a user signs up via Supabase Auth, a profile is automatically created
- **Timestamps**: Automatic `created_at` and `updated_at` tracking

## Using Supabase Auth

Supabase handles authentication through the `auth.users` table automatically. The `profiles` table is for storing additional user data like:
- Full name
- Profile picture URL
- Restaurant information
- Other custom fields

## Next Steps

After running the migration, update your login and register pages to use Supabase Auth methods:
- `supabase.auth.signUp()` for registration
- `supabase.auth.signInWithPassword()` for login
- `supabase.auth.signOut()` for logout
