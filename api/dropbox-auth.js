const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_APP_KEY = '9lovo2qjjo5okdt';
const DROPBOX_APP_SECRET = 'kmhc2aq4qyl42xa';
const REDIRECT_URI = 'https://portal-arquivo.vercel.app/api/dropbox-auth';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
  const { code, error } = req.query;

  // Erro de autorização
  if (error) {
    return res.status(400).send(`Erro: ${error}`);
  }

  // Sem code = redirecionar para autorização do Dropbox
  if (!code) {
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&token_access_type=offline`;
    return res.redirect(authUrl);
  }

  // Trocar code por tokens
  try {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET,
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).send(`Erro ao obter token: ${data.error_description}`);
    }

    // Salvar refresh_token e access_token no banco
    await sb.from('configuracoes').upsert({ chave: 'dropbox_refresh_token', valor: data.refresh_token }, { onConflict: 'chave' });
    await sb.from('configuracoes').upsert({ chave: 'dropbox_access_token', valor: data.access_token }, { onConflict: 'chave' });

    res.send(`
      <html><body style="font-family:sans-serif;padding:2rem;text-align:center;">
        <h2 style="color:#4338ca;">✓ Dropbox conectado com sucesso!</h2>
        <p>O token permanente foi salvo. O Dropbox vai funcionar sem precisar renovar.</p>
        <p><a href="https://portal-arquivo.vercel.app">Voltar ao portal</a></p>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send(`Erro: ${err.message}`);
  }
};
