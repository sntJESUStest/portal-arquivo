const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4NTgyNiwiZXhwIjoyMDk0ODYxODI2fQ.sQDZQ6Lvrb8RsaC-4zVYyXEs4MRqHuVCUtLlblabMqQ';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, erro: 'email e password obrigatórios' });

  try {
    // Buscar usuário pelo email
    const listResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY }
    });
    const listData = await listResp.json();
    const users = listData.users || [];

    if (users.length === 0) {
      // Criar novo usuário
      const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, email_confirm: true })
      });
      const createData = await createResp.json();
      if (createData.error) return res.status(400).json({ ok: false, erro: createData.error.message });
      return res.json({ ok: true, created: true });
    }

    // Atualizar senha do usuário existente
    const userId = users[0].id;
    const updateResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, email_confirm: true })
    });
    const updateData = await updateResp.json();
    if (updateData.error) return res.status(400).json({ ok: false, erro: updateData.error.message });
    
    return res.json({ ok: true, updated: true });
  } catch(e) {
    return res.status(500).json({ ok: false, erro: e.message });
  }
};
