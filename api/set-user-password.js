const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4NTgyNiwiZXhwIjoyMDk0ODYxODI2fQ.sQDZQ6Lvrb8RsaC-4zVYyXEs4MRqHuVCUtLlblabMqQ';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, erro: 'email e password obrigatorios' });

  try {
    // Tentar criar usuário
    const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    
    const createText = await createResp.text();
    console.log('CREATE STATUS:', createResp.status, 'BODY:', createText);
    
    let createData;
    try { createData = JSON.parse(createText); } catch(e) { createData = {}; }

    // Se criou com sucesso
    if (createResp.status === 200 || createResp.status === 201) {
      return res.json({ ok: true, action: 'created', id: createData.id });
    }

    // Se usuário já existe (422), atualizar senha
    if (createResp.status === 422 || (createData.msg && createData.msg.includes('already'))) {
      // Buscar o usuário pelo email
      const listResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY }
      });
      const listData = await listResp.json();
      const user = (listData.users || []).find(u => u.email === email);
      
      if (!user) return res.status(404).json({ ok: false, erro: 'Usuário não encontrado' });

      const updateResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': 'Bearer ' + SERVICE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, email_confirm: true })
      });
      const updateText = await updateResp.text();
      console.log('UPDATE STATUS:', updateResp.status, 'BODY:', updateText);
      
      const updateData = JSON.parse(updateText);
      if (updateData.error) return res.status(400).json({ ok: false, erro: updateData.error.message });
      return res.json({ ok: true, action: 'updated', id: user.id });
    }

    return res.status(createResp.status).json({ ok: false, erro: createData.msg || createData.error?.message || 'Erro desconhecido', status: createResp.status, body: createText });

  } catch(e) {
    console.error('ERRO:', e.message);
    return res.status(500).json({ ok: false, erro: e.message });
  }
};
