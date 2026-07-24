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

    // 2. Parse request body for password
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required to confirm account deletion' }, { status: 400 });
    }

    // 3. Verify user's password using signInWithPassword
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

    // 4. Initialize Supabase Admin client with SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fgjfffjobemejpfoxfpm.supabase.co';
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnamZmZmpvYmVtZWpwZm94ZnBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc5NTc2OSwiZXhwIjoyMTAwMzcxNzY5fQ.LHj0Pj4trVz69-sHI_0_JdPaFu6aCPB_cWjTFoookBc';

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
    }

    // 6. Delete user permanently from auth.users using admin API
    const { error: adminDeleteErr } = await adminClient.auth.admin.deleteUser(user.id);

    if (adminDeleteErr) {
      console.error('Admin delete user error:', adminDeleteErr);
      // Fallback: manually delete from database tables
      await supabase.from('watchlist').delete().eq('user_id', user.id);
      await supabase.from('favorites').delete().eq('user_id', user.id);
      await supabase.from('reviews').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
    }

    // 7. Sign out session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (err: any) {
    console.error('Account deletion endpoint error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete account' }, { status: 500 });
  }
}
