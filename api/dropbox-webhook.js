const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGjYeI51C9YxOKDTac1QYsq2lZpIRTQAz0OxphUpff71ojy4twZnqW-PwdgNOOPLcmUiYenSuLup8NO2SpDmnfiFqR6zdoTczh3BhvTmGOl8qiojoH9BR4RImJ9-1z3nqH2dAumyHbirZMWvCZibowbsF_6wKC541ep4gxVkxE9hSkh46AN6MHbqgPriB-28kH7PfoQbasWe2q4YdLGmWReQYLbt63aPnMOc5VO_AoEaHijHxnuBktmg3NBYUEUsvYz5lBH8pNoQSdYMU8Q3EK__emoufPmKebE516bKC3cZTTpXjZsCtneYezV5ur-Lm5v3cCMcZ8MKpDTmM0uWdTaRqwyjllwiU4zh5Roy6fcxCdrv7qhE6AYxPJYRGEDN1XY3JpHvg4jFaVuPHABBfcDoVCG1__6P_w4eJ_Kc908n6wkaJQwGjMz2bkXl1cfjrzPOfEtK2FaBiBr-mPpyBXpNS0jHunrBoO3i1T8lTtgYyN-A6P5gyJffuSxgIf4DEv9-bF8FYTAeEkHUiWNemxDmOgyr77DIXDpIrmF8jKgNYqhpclUHZqpuNAjSLMlqYZEuprM3L0f0k8dPtHOVPPElnLdx_vN9DqjzHkfyCoyz28zmQsmOgwx7WdDp14hcrJikX5NKOCM5gAmpKk1Jk26Q3R-irqYljOEZa6jjv9I0mtLAvQ5Vjq3ze5lbmIU3THckEe_crmqSrXvoYG0Tr_6RjcRd_uMYZJqTfVmifFLgU8mI2d3lKFpLGs0Yf2J7hBaledC3ynBXH8IS3feK8AhRjamMD29nePvCaDNkfuRPv62ofqfzfl0fgwgmPYu08GXw7awbvNOLuEQotxkN55Y_vjvRmuwcULiXEV7R5H_OhBCWoBqpM8bgNaPOfxGhZ5ibqhe2napl9bHG41LqfGEN9Hg5-hejdEnbw-Ojl0kooJJUQUVRmQ8Ji6wXT8oq0jTKX-0CaHfui_jxEonTF2SgcK1QDlWnJIgEwYkczc2mdBhK2zCy-O3uuNTL5MNtZm5AsEDAhSwOSWXBo_2Oov-F2q4jRuEYKEhOUnMUxLEU-xdBs3Yb4s_WsycpQ9BKvxdIoob3SzbK-PGhpb7nD6fGTxuMfHX7jiVNqFRMwv-UjT7QtvStnOGti-yrKk9yGFL4wGTNR4kNti65KaS0nC303TBz2juu6p8x0dn500QtO9UrqA1DgDu7U3zaZbo_YX7ZaDwznZleZZ-Gn1t6ZKFpCnlWJYxXEJGU7zNcKABQdcL_PJiwhnWFplaeXQNadXq7GeWjZ_2X6Vhmr8FXjFxKoWS1YPI7v1gzTEd5oRg-1DHhL0dYjV6RcOdmb9EVLy7rUnt6EysH5hoIWAJ2dQ8_wSSH9Ab5Ph31o07rLOvkxUsWwFHm8ebmeYxbOfHlFrJj_nskE9EARs2aQF73LCQf';

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
    // Testar caminhos possíveis para encontrar BACKUP/RH
    const caminhos = ['/BACKUP/RH', '/Backup/RH', '/backup/rh', '/PC/BACKUP/RH', '/PC/Backup/RH'];
    let data = null;
    for (const caminho of caminhos) {
      const testRes = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: caminho, recursive: false, include_deleted: false })
      });
      const testText = await testRes.text();
      console.log(`Testando ${caminho}: status ${testRes.status}`);
      if (testRes.status === 200) {
        console.log(`✓ ENCONTRADO: ${caminho}`);
        data = { entries: [] }; // placeholder
        // Agora listar recursivamente
        const fullRes = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${DROPBOX_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: caminho, recursive: true, include_deleted: false })
        });
        data = await fullRes.json();
        break;
      }
    }
    if (!data) { console.error('Nenhum caminho encontrado!'); return; }
    const response = { status: 200 };

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
