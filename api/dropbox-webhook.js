const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGjfuDYNgzlnXrK303K_yygqsuVKUz7rI8D-6b0MrJWH2gw1VZvpe3lyn5VUmCc931nOJGLN2zLgFLWzNTFYAttbl5zfKH1WDXgnTWYFJKHZL8-wfenHEHVFvC4Y5_cMgXdUb4sQJhf90EwjPG9D0dZEVNyVouX9AGD3OSb41igrY2alq2wgkgxxW8RHXGrq5HQtb3MjYwcUS4A8OO1MYAf4BdV0B0u-JRgw6EvMpduXILCkFkOhIXo0yAEgNZKW7Ejkqzxe9JwF8HQSum1Ta5rnzzaRDFtsJLX8w3sS66G3YRZ17sw3xopHTjjIHeQZ2oKXhzibvopJJH38AQCpz9k-1aNe-qMbxSRKIL-IY30XXQ2ivd91IxDldMY5w2C8dleMOpCH7GRCsE0SSL4a_zwzuPoJ5BCLm4HZHmAygClNaoQWbAMYz91dpjvxnafUFLupR8-exT-RcjALYupY93oGMGNooK4c0EH6gLwwF-Rak34FHiZoJI4R4-8RIU7Mq_Yq_wkFvJiB9A1qmI7WjS9yRNJiZQMJvGb-tarULeF2MhCcJMAmPeF0_NgpHd3aKNGoVDIisgDwzgiT0OHXgR2IL87PpvXo02ZeuuzfO8Bb4Ae3m2Kn16r-SuQWfH2awCKPykDXRRC86SWCIRJ2RryjVLtZ6QCSIfesVV2PADSBEj95jtMYsA1mkrybSHfrlT_i48Xal9b5fxNKMYR_P8r2L8GTfCLQ3ar1qPxpc9seTELTTjaHi2iy5V784RqXcWdaAa4fl7oIA8DYTab4kS_OJABRutPom_y7JeV9z_EtJ2MLCngciU-6XbHySLcBJ7UUxowAR3NeO4vp7WCQQJqg51F7BZc6XWlAv2JmZTy-vduwOvIAScdbAcadBTsykw8malZgjolun4hhoUMdyMsuPHu-7OTzWPvYTFab1timLYdL-RrtHR8Arkvy13I5IubXNV1VdSzS4xRKYJ82akHuQ3DvuNVjmVQo1xpwAdiGPfOWxIB13aVySJ9BLvL1HJu8q7pVqV6q9P26uG-0Gcb-ugTXTGPs3U43vAd6V2G-p9FqOGxEG0L422HvkTKxzx9Qsq9pZJ04af9Zj6oNuAcWRhbY6nfy5l-B4d79g8nzvR6WMSrp5xl31a4tPnjoMVR-mDA9eJI9CeqFIURu90jjJnUTLA2sx2E9sO9kIhHSljj1U2WQrYw0Rlw3lUEBpxfIGGVjdCa7Mo-FZkXnXUK-fyz3QF1Glk0C2jQKaxYBELAQG5dp4HdUMo1H9Qyvj7M_GUR9rLqqIu0veR-cZsj0ilDghXtNc6bJxQVz0lgW5a4SveNvRmJWBnYcU6IiUpy1m38_H8Q8-FjdjePXTn32obYG4wqt4HDSix17V2NAXIolAnhpL5vhYN4UurFO1Sz9sSE1L-dn42MgusM-yILG';

const DROPBOX_ROOT = '/BACKUP/RH';

const MESES = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

const SETORES_MAP = {
  'FISCAL': 'Fiscal', 'PESSOAL': 'Pessoal', 'CONTABIL': 'Contábil',
  'CONTÁBIL': 'Contábil', 'FINANCEIRO': 'Financeiro', 'AVISOS': 'Avisos',
  'fiscal': 'Fiscal', 'pessoal': 'Pessoal', 'contabil': 'Contábil',
  'financeiro': 'Financeiro', 'avisos': 'Avisos'
};

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
  // Verificação do webhook (GET) — responde ao challenge do Dropbox
  if (req.method === 'GET') {
    return res.status(200).send(req.query.challenge);
  }

  // POST — processar notificação do Dropbox sem verificar assinatura
  await processarAlteracoes();
  res.status(200).send('OK');
};

async function processarAlteracoes() {
  try {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: DROPBOX_ROOT,
        recursive: true,
        include_deleted: false
      })
    });

    const data = await response.json();
    if (!data.entries) { console.error('Erro Dropbox:', JSON.stringify(data)); return; }

    const arquivos = data.entries.filter(e => e['.tag'] === 'file');
    const { data: clientes } = await sb.from('clientes').select('*');

    for (const arquivo of arquivos) {
      const pathSemRoot = arquivo.path_display.replace(DROPBOX_ROOT + '/', '');
      const partes = pathSemRoot.split('/').filter(Boolean);
      if (partes.length < 4) continue;

      const [nomeEmpresa, setorRaw, mesAno, nomeArquivo] = partes;

      // Normalizar setor
      const setor = SETORES_MAP[setorRaw] || SETORES_MAP[setorRaw?.toUpperCase()] || SETORES_MAP[setorRaw?.toLowerCase()];
      if (!setor) continue;

      // Parsear MM-YYYY
      const partesMesAno = mesAno.split('-');
      if (partesMesAno.length < 2) continue;
      const mes = partesMesAno[0];
      const ano = partesMesAno[1];
      const mesNome = MESES[mes];
      if (!mesNome || !ano) continue;

      // Buscar cliente pelo nome da empresa (case insensitive)
      const cliente = clientes?.find(c =>
        c.empresa?.toLowerCase().trim() === nomeEmpresa.toLowerCase().trim()
      );
      if (!cliente) { console.log(`Cliente não encontrado: ${nomeEmpresa}`); continue; }

      // Verificar se já foi importado
      const { data: existente } = await sb.from('notificacoes')
        .select('id')
        .eq('arquivo_nome', nomeArquivo)
        .eq('cliente_email', cliente.email)
        .eq('ano', ano)
        .eq('mes', mesNome)
        .maybeSingle();
      if (existente) continue;

      // Baixar arquivo do Dropbox
      const fileRes = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_TOKEN}`,
          'Dropbox-API-Arg': JSON.stringify({ path: arquivo.path_display })
        }
      });

      const fileBuffer = await fileRes.arrayBuffer();
      const storagePath = `${cliente.email}/${setor}/${ano}/${mes}/${Date.now()}_${nomeArquivo}`;

      const { error: uploadErr } = await sb.storage
        .from('arquivos')
        .upload(storagePath, fileBuffer, { contentType: 'application/octet-stream', upsert: false });

      if (uploadErr) { console.error('Erro upload:', uploadErr.message); continue; }

      await sb.from('notificacoes').insert({
        cliente_email: cliente.email,
        arquivo_nome: nomeArquivo,
        arquivo_path: storagePath,
        mensagem: `Novo documento disponível em ${setor} - ${mesNome}/${ano}`,
        setor, ano, mes: mesNome,
        lido: false,
        criado_em: new Date().toISOString()
      });

      console.log(`✓ Importado: ${nomeArquivo} → ${cliente.email} (${setor} ${mesNome}/${ano})`);
    }
  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}
