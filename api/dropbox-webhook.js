const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGgHBUiQXWkieyJDlmAGMWQ2u9NiSDo97EwUnDNzOQYYYrXtXlIXUUl2PERNZ5pyC5muJSWPhwaFi59OPZUWvCsJNEJU7teYjyhsisW13DiKlbQrqLtkLYD0DrzCK9TYoyI6jcdyHL4aQ8ubIGLH0dq-2YBgxfL4UJh7V9YVSe_PJSWYJJKY79hxIfj-ofbWzLKex9yObLHz20BDrzIj_wLdU4GbXnWwXLXtaRtDAdpXfOrUG107ogoTSIMbke47FbGUequvvpKFzHHUCm7O0lgPlVMLGvTLhEF3gC6z4Owu2NpsVDRIW4Jc2zKehsMoBthFYatluMWkIhsN4cmQlRILwB1gc0RXXrw7ocnnMd-qzgzwWjzIM0UItcSLwIpEUib9wZECiAe7VGRAbZFpgRLL_Ql0_4m0idrcBrueW-pLJjSbd8rbFAcFGTERgD6SLVvhN2OIE_lDZFHQEpxZxrO8Jc6b3n6PfdwUmdfB7eJzvUKS4KBsPjeLJVWDmT303-vgQRMjAcOjIivrGCFVyXOEaVYB3t3dhLyOVsBFA6gKWRnH-Ge9bVCzaTBqrwMG3DKDPdHgGAQxMLkV3b3VRNcGO2_0GpgkrXt9c4ojhmJd8KNoDmds44eV9rIIf6AYIe9ULhB1dkCuL3ad6Fx_3sn7QxMsLEHRMiqMb4B6SFhxHRYZtA7atIO6PFTAqWgoxz1eut-U6JrExp83jL4LCDbCSpxGVU3TDNzgHrtpIjwihzT7tgP5H8C3mF4eNHsB7pd2STaeNwEo-TntAjY2uiMbvuZua2DkMejhNE8T7ehwNFkurRuFjzkrS4LUcjsIOaQCye55BsX26m5wW7HXgfL4qcLtvyM0lEV3JiJ_U_z6FUc35MBOQwZYGUL3Mxrfq0d1l3MTNNaRQHMwl91wdViYK-juCNVh2McvqjWuwYasSt3yQyA2ulAIutcaS9Ql7zkdruu6jQUvukybRyRXDTz2bMDpDn8R0th6JakRfDnQDnGHjd5izfrQgGSGx5cHubWnER6UiRDuv7iOIW7NNdtzmZQ0zKETw0aGHsI79MBtaWL_RM81C_YG0qkOtGCzQAHbvdRZjoETuwXgd5v3w8FX6du0c9Tk__JsR7v4vauIA42-vDvGiByABFoJYC4ruMTNuGMGWcPxHpM3jsoVZSgEpSjxuif6kosnVaLTjMOZppvKqauG6ohPOqHTSJhD_vS0OhuRogfP4n_IP1fzvMlCKbJf77gjQKpLslnop6XRjcgW3Qp_awIi4G-vKtcILR0EbwoXwSty3CfcRjhgprf4umjlpsLlz457lrIfUgZqqTgN6SRV34LVEmbweJCn3B2bGlUtjVglvirtIV9Hs9zaOM7GBqkJU6sFGSSS-Iq_xRCJcMOynw5NFAEbSmf24toCevQtxCLmN9ywvdTLnIRW';
const DROPBOX_APP_SECRET = 'SEU_APP_SECRET_AQUI'; // substituir

const MESES = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

const SETORES_VALIDOS = ['Fiscal', 'Pessoal', 'Contábil', 'Financeiro', 'Avisos'];

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
  // Verificação do webhook (GET)
  if (req.method === 'GET') {
    return res.status(200).send(req.query.challenge);
  }

  // Verificar assinatura do Dropbox
  const signature = req.headers['x-dropbox-signature'];
  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', DROPBOX_APP_SECRET).update(body).digest('hex');
  if (signature !== hmac) return res.status(403).send('Assinatura inválida');

  // Processar contas alteradas
  const accounts = req.body?.list_folder?.accounts || [];
  for (const accountId of accounts) {
    await processarAlteracoes();
  }

  res.status(200).send('OK');
};

async function processarAlteracoes() {
  try {
    // Listar arquivos recentes no Dropbox
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: '', recursive: true, include_deleted: false })
    });

    const data = await response.json();
    const arquivos = (data.entries || []).filter(e => e['.tag'] === 'file');

    // Buscar clientes cadastrados
    const { data: clientes } = await sb.from('clientes').select('*');

    for (const arquivo of arquivos) {
      // Estrutura: /Empresa/Setor/MM-YYYY/arquivo.pdf
      const partes = arquivo.path_display.split('/').filter(Boolean);
      if (partes.length < 4) continue;

      const [nomeEmpresa, setor, mesAno, nomeArquivo] = partes;

      // Validar setor
      if (!SETORES_VALIDOS.includes(setor)) continue;

      // Parsear mes-ano (01-2025)
      const [mes, ano] = mesAno.split('-');
      if (!mes || !ano) continue;
      const mesNome = MESES[mes];
      if (!mesNome) continue;

      // Buscar cliente pelo nome da empresa
      const cliente = clientes?.find(c =>
        c.empresa?.toLowerCase().trim() === nomeEmpresa.toLowerCase().trim()
      );
      if (!cliente) continue;

      // Verificar se já foi importado
      const { data: existente } = await sb.from('notificacoes')
        .select('id')
        .eq('arquivo_path', arquivo.path_display)
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
      const storagePath = `${cliente.email}/${setor}/${Date.now()}_${nomeArquivo}`;

      // Upload para Supabase Storage
      const { error: uploadErr } = await sb.storage
        .from('arquivos')
        .upload(storagePath, fileBuffer, { contentType: 'application/pdf' });
      if (uploadErr) continue;

      // Salvar no banco
      await sb.from('notificacoes').insert({
        cliente_email: cliente.email,
        arquivo_nome: nomeArquivo,
        arquivo_path: storagePath,
        mensagem: `Novo documento disponível em ${setor} - ${mesNome}/${ano}`,
        setor,
        ano,
        mes: mesNome,
        lido: false,
        criado_em: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Erro ao processar Dropbox:', err);
  }
}
