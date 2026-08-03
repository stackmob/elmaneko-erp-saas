import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Autenticação obrigatória.');
    const { empresaId, email, role } = await request.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const { data: token, error: inviteError } = await supabase.rpc('criar_convite_empresa', { p_empresa_id: empresaId, p_email: email, p_role: role });
    if (inviteError) throw inviteError;
    const appUrl = Deno.env.get('APP_URL');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const sender = Deno.env.get('INVITE_FROM_EMAIL');
    if (!appUrl || !resendKey || !sender) throw new Error('Serviço de convite não configurado.');
    const acceptUrl = `${appUrl.replace(/\/$/, '')}/accept-invite?token=${encodeURIComponent(token)}`;
    const mailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: sender, to: [email], subject: 'Convite para a equipe', html: `<p>Você recebeu um convite para acessar a empresa.</p><p><a href="${acceptUrl}">Aceitar convite</a></p><p>Este convite expira em 7 dias.</p>` }),
    });
    if (!mailResponse.ok) throw new Error('Falha ao enviar e-mail.');
    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, { status: 400, headers: corsHeaders });
  }
});
