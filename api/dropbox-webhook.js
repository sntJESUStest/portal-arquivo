const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGiYkAj9M_oGooZ5GlJFheaCRVx8BNwmJTC6gxYe0Eu9Uk9y_0jHK0U-ySHU_y1fsqf4pP7HfRQuDUB0MNkO1KsKWOqWQzG5GAjAUBH8PE5Ya_Qf1ehKYDgrAUaOKPho4BakFSrTUPna8pPGTPVaNYofA47nQUBzoyjQs8Ef2smSWdVegaMvyIybcmuZHJZW3u2TBzD0WN8TkyUQkSLpLFI0it0M4HhWXHeowF9oL2wiN14WLjbqxyk_b77xCjO0kFX_tvYOqIARHjchVJTu1TsDL6RH63N4Gbah1WDKdId8RoJqUOAaBwIEvyIFbrFwLAe62JbkY4wAS-uKskg4bZT-WoIaedsjwecdNYTndIh7jw3RvTWoFrCp9RIqsc2bd9zqb5L2FXyZ-DAuR33pWkkrFUQxTSMo9vMfOunail-LN9xtAR7uIalclphHIwjcrBnTmPhkhXkFMiepsTSEDNPBFjKfs9FUUaKd0EGYFRsrr2UxFNGQ0Ob-uTN9VJW5yTQDk1iF-Lc0tgZ26e4pL4KfrkHVObScyN6UzYOcZtN5HrsPJKB1Q2FjpcreJoa0bzrDDr3NHaohsSrm-_8KE3dgnYPn45H-F5WHPWNQvhNrb2FwEibtak5FuzRkwicj1DoFXOhpnkSPCew_yymXLr2rq-4e2sLDGv2yPkOhReCmiJwpp1EB6kJBlMwNAI4o10BfhQ8Krh2svV6DAOwZE7J4HXky14klwEd6YOsIcCHG0g--bLuWYFFwQ19hGGUFfxzwNra1mZEPw2RzU9Yl1rwFnBLAVmsa76GuRFkAnFeg0AWL9-YMKftY7zKVB1oMe5WOHwKu9-bGSFCDCr--8PyIh-yJmjE8_scDoMS8YUHk17OhC5KgdD-2s2C-vTsUrVmLDkHdRlR8qBGk4eoBV6CoDAAbEdDUqBqo4knN2wOw2aukUg5wg2m7pXNB9EO3ADReDNTcSiVRwAJLtY4jUtyf7fsWBBxNOpUudARI9DbPua-_svYE3ToBYZgJA3GtiYwMoyc0B2oZ2FgZqv5wROo2Yz0-n--xQNz32vcdBW3-AdaNSLeh9-0D4iYtuME7wOkipQWP43qf-48S4lC4CaHnUZjECRopog-W0s2hgOZaP8i7v8Wv0TWQwwouRlnhnJ4THr9kbl0lKuM1lg8zoEXYSh0YN56JTRaherEhIldnZfydlgertnQfFjx5hu1DsZk1kM_vHK7Ie4IOf03YD0u2Wii2mM5VIAbp6hT_SzrbQOUASoW-fkDqrN6p9GNarqBLTSy108hlX3N3fnyrJ3-mIe5vGVdT7NHYo14RBkyi7aKmxNBOUc6l8MkNf1Ya7_hB2wljRD-j2dNWKmIuCrj1boUNZIUYTlAkBmJgSVFocg4nanwd6qcyxpO-rk4SK3xl7v398aepK_HMm98E7ker';

const DROPBOX_ROOT = '';

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

    const rawText = await response.text();
    console.log('Dropbox status:', response.status);
    console.log('Dropbox resposta:', rawText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      console.error('Erro ao parsear resposta:', rawText.substring(0, 300));
      return;
    }

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
