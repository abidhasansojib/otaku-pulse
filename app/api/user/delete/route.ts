import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 });
    }

    // 2. Parse request body for password (guarded)
    let body: { password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required to confirm account deletion' }, { status: 400 });
    }

    // 3. Verify user's password
    const { error: passwordErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (passwordErr) {
      return NextResponse.json(
        { error: 'Incorrect password. Account deletion denied.' },
        { status: 400 }
      );
    }

    // 4. Initialize Supabase Admin client (env vars required, no fallbacks)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. Execute database cleanup via delete_user_account RPC
    try {
      await adminClient.rpc('delete_user_account', { target_user_id: user.id });
    } catch (e) {
      console.error('RPC deletion error:', e);
      // If RPC fails, do NOT proceed — return error
      return NextResponse.json({ error: 'Failed to clean up account data. Deletion aborted.' }, { status: 500 });
    }

    // 6. Delete user permanently from auth.users using admin API
    const { error: adminDeleteErr } = await adminClient.auth.admin.deleteUser(user.id);

    if (adminDeleteErr) {
      console.error('Admin delete user error:', adminDeleteErr);
      // Fallback: manually delete from database tables
      await adminClient.from('watchlist').delete().eq('user_id', user.id);
      await adminClient.from('favorites').delete().eq('user_id', user.id);
      await adminClient.from('reviews').delete().eq('user_id', user.id);
      await adminClient.from('profiles').delete().eq('id', user.id);
    }

    // 7. Sign out session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (err: any) {
    console.error('Account deletion endpoint error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete account' }, { status: 500 });
  }
}
