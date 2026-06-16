import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Public endpoint (deployed with --no-verify-jwt): the invitee has no session
// yet. Authorization is the unguessable invite token itself, validated below.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { token, password } = await req.json();
    if (!token || !password) return json({ error: 'Missing token or password' }, 400);
    if (typeof password !== 'string' || password.length < 8) {
      return json({ error: 'Password must be at least 8 characters.' }, 400);
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate the invite token: must exist, be unused, and not expired.
    const { data: invite, error: inviteErr } = await adminClient
      .from('team_invites')
      .select('token, email, name, role, used_at, expires_at')
      .eq('token', token)
      .maybeSingle();
    if (inviteErr) throw inviteErr;
    if (!invite) return json({ error: 'This invite link is invalid.' }, 400);
    if (invite.used_at) return json({ error: 'This invite link has already been used.' }, 400);
    if (new Date(invite.expires_at) < new Date()) {
      return json({ error: 'This invite link has expired. Ask for a new one.' }, 400);
    }

    const email = invite.email as string;

    // Find an existing auth user for this email (re-invite / pre-existing user).
    const { data: list, error: listErr } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw listErr;
    const existing = list.users.find(
      (u) => (u.email || '').toLowerCase() === email.toLowerCase(),
    );

    let userId: string;
    if (existing) {
      const { data, error } = await adminClient.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: invite.name, role: invite.role },
      });
      if (error) throw error;
      userId = data.user.id;
    } else {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: invite.name, role: invite.role },
      });
      if (error) throw error;
      userId = data.user.id;
    }

    // Activate the team member (link the auth user and flip status to active).
    const { error: memberErr } = await adminClient
      .from('team_members')
      .upsert(
        {
          user_id: userId,
          name: invite.name,
          email,
          role: invite.role,
          status: 'active',
        },
        { onConflict: 'email', ignoreDuplicates: false },
      );
    if (memberErr) throw memberErr;

    // Spend the token so the link can't be reused.
    const { error: usedErr } = await adminClient
      .from('team_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);
    if (usedErr) throw usedErr;

    // Return the email so the client can immediately sign the user in.
    return json({ success: true, email });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
