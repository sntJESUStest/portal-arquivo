const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGglqTmVmfrATsfTKaUhv-sHSShtDDZee_VlYxRwKuM7jNWqJ9tXet3-taovm1Vb9UZFJfGAmMZzg7GgwDCGA1zJM6kseaCJ7upXpk24OqEc526krmWSdLZF5mJz0_zWZlaOLolOaS70dOnWjpo-y3Ol9I3hD5VRUz8nG8A9yetzj97BKBzQAfQg7SwZo7YVuqXp0G5TsrRU9tCsCyF2lfQ7hJweVWULIhM2hoDQcPTAUdwl21tFzW2BbQyC5kpFgRqR51dZW5ZffaiL0X7A6GkcKJfEXKBI5n_c9B_nx3WNG7HeImi56Y0jCn4me8btekboc4wYsHHmUvEhG9rgZptD5wypk-YXlVDr5xZI-lNh2RFSmOxI8YPdbZ2t3DDd07rRRDovbHzUwY6epclGbsBWfAeJ7WzvnzLDDI7p6LMZYUlJyGKcwToVEnJLaT8nbO2qWdGzBFV1EDJd4BH98TpsuZ4NOiJBvkBkBJFlHf7frUikOvKhMUI93Y6qAmc08Q_j0LTwkwUJGAFEnBklXB9hxzcPBVURy5vuz97ajJuQCrNZubzJJQfPHA020g61HzbC0I3q0CLtSB0RD7bkNFEn1U0DCFOukvyoiAZkNJUoLFUDqKWLffYj6IFG2OxKLhihlR3yDJBTYj6l1BuBuc5eMJ6nBkF54fxa2Q4tgchfj6nUpj-9ZUmHQDtkMjKVfq9nDpAUlng9CiRdPzI25zqSYs_O3b9KGHRSTTc6vcPLAXfQGMAV5J6yGA16RuSl2Fk2jGP3bNNuqjqzx5XCAeKWulITTEGqJ9RMWprHDYqle-lE70i9lh5hU9Hfej8aoqMQlW6CTHX4aRVsXLtY1PLbo5_HPedPA5zQ1UKwoAhToi2uJo-1g8b-r9jXSBQ3NiIt8Gj2QdG6rEb1AcW1tOzc25VNTPzbcplKkW3AKjy7Dtk8xwqjjgc5NA6oO_TQR0lt0TDpJWMeo7KHUBd1JOW-0OFKbcq95ket5o3AmHGBoiMz2OvRInzmRm5oadHM9HIFUFJdA-lO6QFtw1qWQdQcXwpIaWtvk0wJPtLoncRN-CPHZA_e6blPisdO6NB-6ibmVMSBsCxNCV9Cqne6NCiteY5Z4oyomCmPJLXsqQkY46oM-qDvo_EwldPiiTqHrDLsFV3Y2HuLuaD_L2sfearadRvZk-5zwvAmtHykX_gayuUCXbwnV8FjGOoKKUfrTiALdOJNcmDOnghtITB3aZ4o7mH1pl-AR-r9TKeHPVsfJqDwIYFubr_cWbEp4lo8KCG4dQzvKfuZ7Ib5oZ-kj3kxHVR9meVWBU2SekCWxT67m47Xy-5JCRxKklFBxdQuE4gtmN_w8pKSLuljoU8wUama41MgqJVuIl2yOv28SXP2Wif6Uf-GHqKhh4MP71rE4fv_P21CwCjxn2_hd9aH9uX_';

const DROPBOX_ROOT = '/PC (2)';

const MESES = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

const SETORES_MAP = {
  'FISCAL': 'Fiscal', 'PESSOAL': 'Pessoal', 'CONTABIL': 'Contábil',
  'CONTÁBIL': 'Contábil', 'FINANCEIRO': 'Financeiro', 'AVISOS': 'Avisos',
  'fiscal': 'Fiscal', 'pessoal': 'Pessoal', 'contabil': 'Contábil',
  'financeiro': 'Financeiro', 'avisos': 'Avisos',
  'Fiscal': 'Fiscal', 'Pessoal': 'Pessoal', 'Contábil': 'Contábil',
  'Financeiro': 'Financeiro', 'Avisos': 'Avisos'
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
    console.log('Iniciando busca no Dropbox:', DROPBOX_ROOT);

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
    console.log('Status:', response.status);
    console.log('Resposta:', rawText.substring(0, 300));

    if (response.status !== 200) {
      console.error('Erro Dropbox:', rawText);
      return;
    }

    const data = JSON.parse(rawText);

    const arquivos = data.entries.filter(e => e['.tag'] === 'file');
    console.log(`Arquivos encontrados: ${arquivos.length}`);

    const { data: clientes } = await sb.from('clientes').select('*');

    for (const arquivo of arquivos) {
      const pathSemRoot = arquivo.path_display.replace(DROPBOX_ROOT + '/', '');
      const partes = pathSemRoot.split('/').filter(Boolean);
      console.log(`Processando: ${arquivo.path_display} → partes: ${JSON.stringify(partes)}`);

      if (partes.length < 4) continue;

      const [nomeEmpresa, setorRaw, mesAno, nomeArquivo] = partes;
      const setor = SETORES_MAP[setorRaw] || SETORES_MAP[setorRaw?.toUpperCase()];
      if (!setor) { console.log(`Setor não reconhecido: ${setorRaw}`); continue; }

      const partesMesAno = mesAno.split('-');
      if (partesMesAno.length < 2) continue;
      const mes = partesMesAno[0];
      const ano = partesMesAno[1];
      const mesNome = MESES[mes];
      if (!mesNome || !ano) { console.log(`Mês/ano inválido: ${mesAno}`); continue; }

      const cliente = clientes?.find(c =>
        c.empresa?.toLowerCase().trim() === nomeEmpresa.toLowerCase().trim()
      );
      if (!cliente) { console.log(`Cliente não encontrado: "${nomeEmpresa}"`); continue; }

      const { data: existente } = await sb.from('notificacoes')
        .select('id')
        .eq('arquivo_nome', nomeArquivo)
        .eq('cliente_email', cliente.email)
        .eq('ano', ano)
        .eq('mes', mesNome)
        .maybeSingle();
      if (existente) { console.log(`Já importado: ${nomeArquivo}`); continue; }

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

      console.log(`✓ Importado: ${nomeArquivo} → ${cliente.email}`);
    }
  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}
