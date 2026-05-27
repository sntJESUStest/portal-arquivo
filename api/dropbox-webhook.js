const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGhwpu3lBRd-dKNforbLhphSe0oWs7DKtPP5_G0uKoSCJ8iRcv4lmFYJgqZFNqJGu0U4i9PHHqdjo5oevwGaF1hEQ5xAFZUE-skgFibMrrkxSW_27FFW4WBeETMxeaMYbejiRFtOdYmb1lLCeinTIHqCBbjcmnp52pD0JxcLO34gsWczXI7V_L62EpYTCwaPju5YqPN4W5jl4-AzdS1BaAAvxwTiBFyobeG072ImITWb6i1vXEkKQFY_gw9O0VwgpA3VwjXWlC-DWaohNHpzkU2L_cyzPgP3ScdMuD_HFeAUo6OiKJIF60Z92b-C2wifT8ADueMZuLokYcadP94ocIS2o2uHDkjMnSheyHSYWDSnm6GJBLsYSyldI0pJL0jsdmoPwr0JHpu-pNgK865Zg1touusXBfPkI3x75BIlwlbEWySuGnasbONZdnittsIaY8rsHzANPhkQegjZ2DGYogKQSxSZzh_57r90e-fN3dCiXztI6-325MgacQT0bPf_7CBJrQ5YZWqHkUQDr9DMCIJCPa4Ch__ECNAqOnze14g-NiUCFVLo2gSvrkVk02LmMokNdiMMVn9FZ0SXmfQ92MdiQu_h3IPKk8BCRym1X4WqA7KoSoGNEFllhwSkztxSa02zVlVb-8jWBtaOEZk09_ih7xN104WoT7E2F8-SVX2zCOI2HAytJC_ugF8aAceuhjlxRHR18TUhGojQ1KKMNnhUELixb_kVtipcJL8fxBw5y-Ml7MWYahqn_jme_eUh6UpRbMoKVU0cavHCu-cUA4NTWHCsJSd_SUK7KGu3yBdeRQZnJZ2dM8e6CPvWJdLY9OSadzG90d9QSslcNaG5hobWPt1pyBxX7lP12K0kxiPVC1nFteEd5-0xfwTRP0PkpFqV0wI2xHUWFLrGHDqAoKZFARMw51EJRMonXy46_Ea2g9YO-Xa8M4STs6kH5aqpIxFpWlLe7vhMcBN0jIgJB0Zj6JjR_J8S6RJ5ORQLo8CW1cAEEZVzbAjuSBAjDFwlM0KnJaesMdzkLSZSMryednTyc8BIwVkJh3xyQgzYdg1OmB9aXxQoEfauQDLH2rpO1PllBUEMpHAmEOl-jnw5xvfil51k4dogDjVa0zZDKlm9KQHBbh0UVpDUC-MqSVERtmVbpI-oOx5IP0Pocce01Fv79WgSd6t-YKcjoS81z15-IaedralP8rHUp5KUdOxV4JPcCVb6BC4lnxhDFzz-n0WJMp5xt1ZtqqQyYPM5hwbRrzj8uFdbItvAZiCKn0BoNtcLDlvt_XmypKkxDO5wCkrgtlCmiEFicin2_GlpKWI0wzWpgelIRt9foH1Hx02aHiTIXkH_wMwto6Hpw7SGs4kHG2gOPvfoapZtjC0AAtyYP5NBJPdn5-goD7sByhbUi-QjChKQNTOWAutvTj9REMZ0';

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
