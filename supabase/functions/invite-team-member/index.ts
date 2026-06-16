import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, name, role } = await req.json();
    if (!email || !name || !role) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email.trim())) {
      return new Response(JSON.stringify({ error: `Email address "${email.trim()}" is invalid` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client uses the service role key (server-side only, never exposed to browser)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the calling user's session from their JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Where the invite link should land. Must point at the deployed app so the
    // invitee reaches the set-password screen (InviteAccept). Configurable via
    // the APP_URL env var, with the production URL as a fallback.
    const appUrl = (Deno.env.get('APP_URL') ?? 'https://onward-tau.vercel.app').replace(/\/+$/, '');

    // Issue our OWN invite token instead of a Supabase one-time email OTP.
    // Loading the invite page (which corporate mail scanners pre-fetch) does NOT
    // consume this token — it is only spent when the invitee submits a password
    // via the accept-invite function. This makes invites immune to link
    // pre-fetching and removes the dependency on Supabase's email rate limit.
    const { data: invite, error: inviteError } = await adminClient
      .from('team_invites')
      .insert({ email, name, role, invited_by: caller.id })
      .select('token')
      .single();
    if (inviteError) throw inviteError;

    // Add a pending team_members row so the invitee shows up immediately in the
    // team list. user_id is filled in later by accept-invite. If the member
    // already exists (re-invite), leave their row untouched — in particular we
    // must never downgrade an already-active member back to 'invited'. The fresh
    // token issued above still lets them (re)set their password.
    const { error: memberError } = await adminClient
      .from('team_members')
      .upsert(
        { invited_by: caller.id, name, email, role, status: 'invited' },
        { onConflict: 'email', ignoreDuplicates: true },
      );
    if (memberError) throw memberError;

    const inviteUrl = `${appUrl}/#/invite?token=${invite.token}`;

    return new Response(JSON.stringify({ success: true, invite_url: inviteUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
