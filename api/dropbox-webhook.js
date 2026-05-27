const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'REDACTED_SUPABASE_KEY';
const DROPBOX_TOKEN = 'sl.u.AGhmlm6wcjFkvAdrRjEXHzRh8Mg0A8Ci3-6b7NPud6TR43O7TKEtwG8TJ36PRv2OiMsmuQxm0ubL64R48ypmSQHO4ZxI2dDMp5RXmVSUzHyc4X3MSo6DXAC8nXcdDJaUCP-9YfUwmrshByoNGT_yanZDh6x8QzK_HvJkaaer1AtNH0lQMiSv32OLKiWyP5IMlMfCrNy-GW4D3t1QlQ5j1KoRG0Kum6ieReVl2EoEC-LW-ZcGNLgyNKGt-R8l4qHfkAK4EILqOl33qZklteb26uZlE4tC10d_SvJ14QoXpxAaqjl2YLW4FgZnxf1ZQL_njrCUqxqgeedI7QYQavZUTPoVO6WwgqztDOGrjMzObjVzVvFCh05sqnF9VoGjHAikFwiR6sp7y7ucdUWNBZANqbL7sjeCmqL8Ixgqv0UQSCIUoYl53Qj1tKr8NgNquXeotNCWRS51SCJFAk9Z9Bu2RvnQeY2dOWOd9DeFz4PEyslAJkbZ9CdXR3NdgwHTPZk08lG_YlVFMaSbjfM97H_zSn_vwfbuLNCW-IhqGCEXCxXFrWmAQ2002r0LrTd83UcBevsPX60gym0WNuaE-On7S8xxuEML_dpWYSKPgMan358vVl4WOeDdr2pacavVjAtIc4kqZJoiSOwxCjkRMMkkjA3fcwglcPd8PvVxfdHUJK2YC7EdhXGrG7dXXDqrmCGVRigRN6DewgPkUJ-7GuJVWL0hH3MH5aBUr3h9WgCd5cDXgmJ8LnHxRnL-PadEC7uTAjokPXC7FzQZrUYHWAWKCQ2Xp-xHBoCFvDIsqgi8vvfxW0PxOMXFL5QRCrme_brbyI_3chfpZ1Ii-QaMCC-X0gOjYSr7ZZVwc9-ISnIWS51GaY4e1BU19Zg3-9GgonkiD1mel_Mh5pdSKtK7E_7BId7HbyxQJ-tMcl048JdjbGex1wnF8IEAQ6uASFtCBfIH5Hfew-zFDEGCP_gp2ypBqBgobZ4JhjnDYTlSmP9etffe0P1CGAiQcSbe3P3OPuwwJ8Txp8gos9AyFDsM8z6L6rvs7PQqnLWpZOaDgokmHuqHmjY_Yyt7En5u-HTxHAUHMm9QoLgkL1-5tMpzkWjH8Y-BiYlErI1BByZa9Juzi5-dxc48vncbhOT-KmMvR8vTs_Rpsbmb34UQMk8jpr5_Vz5BZGnQWgRr9iER5GvW0fCTEUl_8HvGE2MRWKpDx2YX3VVJOWw9fTaJyeDPWp_aa3LdW_3atTG81nmiZGZnEIC34O1RjTplU-SFjxvwXbBnwGSCozYSdMnpkYGp_o1RIUN3X4qLzS6H9mtBFWuBvBa-S7DYwi2KzR6bexJiMpxnTQoKYCQoJ7tSy992dG0Tr-w96vd25UbVodNrziLwnNV20mVxAmRJHWpWXDUWcy5Ghb7VvsAMswYKEadlhg1CYk6I';

const DROPBOX_ROOT = '/BACKUP/RH';

const SETORES_MAP = {
  'FISCAL': 'Fiscal', 'PESSOAL': 'Pessoal', 'CONTABIL': 'Contábil',
  'CONTÁBIL': 'Contábil', 'FINANCEIRO': 'Financeiro', 'AVISOS': 'Avisos',
  'fiscal': 'Fiscal', 'pessoal': 'Pessoal', 'contabil': 'Contábil',
  'financeiro': 'Financeiro', 'avisos': 'Avisos'
};

const MESES = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
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
