const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'REDACTED_SUPABASE_KEY';
const DROPBOX_TOKEN = 'REDACTED_DROPBOX_TOKEN';

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
  if (req.method === 'GET') {
    return res.status(200).send(req.query.challenge);
  }

  await processarAlteracoes();
  res.status(200).send('OK');
};

async function processarAlteracoes() {
  try {
    const caminhos = ['/BACKUP/RH', '/Backup/RH', '/backup/rh', '/PC/BACKUP/RH', '/PC/Backup/RH'];

    let data = null;
    let caminhoEncontrado = null;

    for (const caminho of caminhos) {
      const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: caminho,
          recursive: true,
          include_deleted: false
        })
      });

      console.log(`Testando ${caminho}: status ${res.status}`);

      if (res.status === 200) {
        data = await res.json();
        caminhoEncontrado = caminho;
        console.log(`✓ ENCONTRADO: ${caminhoEncontrado}`);
        break;
      }
    }

    if (!data || !data.entries) {
      console.error('Nenhum caminho válido encontrado no Dropbox');
      return;
    }

    console.log('Dropbox OK, itens:', data.entries.length);

    const arquivos = data.entries.filter(e => e['.tag'] === 'file');

    const { data: clientes } = await sb.from('clientes').select('*');

    for (const arquivo of arquivos) {
      const pathSemRoot = arquivo.path_display.replace(DROPBOX_ROOT + '/', '');
      const partes = pathSemRoot.split('/').filter(Boolean);

      if (partes.length < 4) continue;

      const [nomeEmpresa, setorRaw, mesAno, nomeArquivo] = partes;

      const setor =
        SETORES_MAP[setorRaw] ||
        SETORES_MAP[setorRaw?.toUpperCase()] ||
        SETORES_MAP[setorRaw?.toLowerCase()];

      if (!setor) continue;

      const [mes, ano] = mesAno.split('-');
      const mesNome = MESES[mes];

      if (!mesNome || !ano) continue;

      const cliente = clientes?.find(c =>
        c.empresa?.toLowerCase().trim() === nomeEmpresa.toLowerCase().trim()
      );

      if (!cliente) {
        console.log(`Cliente não encontrado: ${nomeEmpresa}`);
        continue;
      }

      const { data: existente } = await sb
        .from('notificacoes')
        .select('id')
        .eq('arquivo_nome', nomeArquivo)
        .eq('cliente_email', cliente.email)
        .eq('ano', ano)
        .eq('mes', mesNome)
        .maybeSingle();

      if (existente) continue;

      const fileRes = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_TOKEN}`,
          'Dropbox-API-Arg': JSON.stringify({ path: arquivo.path_display })
        }
      });

      const fileBuffer = await fileRes.arrayBuffer();

      const storagePath =
        `${cliente.email}/${setor}/${ano}/${mes}/${Date.now()}_${nomeArquivo}`;

      const { error: uploadErr } = await sb.storage
        .from('arquivos')
        .upload(storagePath, fileBuffer, {
          contentType: 'application/octet-stream',
          upsert: false
        });

      if (uploadErr) {
        console.error('Erro upload:', uploadErr.message);
        continue;
      }

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

      console.log(`✓ Importado: ${nomeArquivo} → ${cliente.email}`);
    }

  } catch (err) {
    console.error('Erro geral:', err);
  }
}
