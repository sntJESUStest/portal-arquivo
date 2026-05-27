const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGgHBUiQXWkieyJDlmAGMWQ2u9NiSDo97EwUnDNzOQYYYrXtXlIXUUl2PERNZ5pyC5muJSWPhwaFi59OPZUWvCsJNEJU7teYjyhsisW13DiKlbQrqLtkLYD0DrzCK9TYoyI6jcdyHL4aQ8ubIGLH0dq-2YBgxfL4UJh7V9YVSe_PJSWYJJKY79hxIfj-ofbWzLKex9yObLHz20BDrzIj_wLdU4GbXnWwXLXtaRtDAdpXfOrUG107ogoTSIMbke47FbGUequvvpKFzHHUCm7O0lgPlVMLGvTLhEF3gC6z4Owu2NpsVDRIW4Jc2zKehsMoBthFYatluMWkIhsN4cmQlRILwB1gc0RXXrw7ocnnMd-qzgzwWjzIM0UItcSLwIpEUib9wZECiAe7VGRAbZFpgRLL_Ql0_4m0idrcBrueW-pLJjSbd8rbFAcFGTERgD6SLVvhN2OIE_lDZFHQEpxZxrO8Jc6b3n6PfdwUmdfB7eJzvUKS4KBsPjeLJVWDmT303-vgQRMjAcOjIivrGCFVyXOEaVYB3t3dhLyOVsBFA6gKWRnH-Ge9bVCzaTBqrwMG3DKDPdHgGAQxMLkV3b3VRNcGO2_0GpgkrXt9c4ojhmJd8KNoDmds44eV9rIIf6AYIe9ULhB1dkCuL3ad6Fx_3sn7QxMsLEHRMiqMb4B6SFhxHRYZtA7atIO6PFTAqWgoxz1eut-U6JrExp83jL4LCDbCSpxGVU3TDNzgHrtpIjwihzT7tgP5H8C3mF4eNHsB7pd2STaeNwEo-TntAjY2uiMbvuZua2DkMejhNE8T7ehwNFkurRuFjzkrS4LUcjsIOaQCye55BsX26m5wW7HXgfL4qcLtvyM0lEV3JiJ_U_z6FUc35MBOQwZYGUL3Mxrfq0d1l3MTNNaRQHMwl91wdViYK-juCNVh2McvqjWuwYasSt3yQyA2ulAIutcaS9Ql7zkdruu6jQUvukybRyRXDTz2bMDpDn8R0th6JakRfDnQDnGHjd5izfrQgGSGx5cHubWnER6UiRDuv7iOIW7NNdtzmZQ0zKETw0aGHsI79MBtaWL_RM81C_YG0qkOtGCzQAHbvdRZjoETuwXgd5v3w8FX6du0c9Tk__JsR7v4vauIA42-vDvGiByABFoJYC4ruMTNuGMGWcPxHpM3jsoVZSgEpSjxuif6kosnVaLTjMOZppvKqauG6ohPOqHTSJhD_vS0OhuRogfP4n_IP1fzvMlCKbJf77gjQKpLslnop6XRjcgW3Qp_awIi4G-vKtcILR0EbwoXwSty3CfcRjhgprf4umjlpsLlz457lrIfUgZqqTgN6SRV34LVEmbweJCn3B2bGlUtjVglvirtIV9Hs9zaOM7GBqkJU6sFGSSS-Iq_xRCJcMOynw5NFAEbSmf24toCevQtxCLmN9ywvdTLnIRW';

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
