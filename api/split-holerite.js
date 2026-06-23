const pdfParse = require('pdf-parse');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';

async function sbFetch(path, opts) {
  const r = await fetch(SUPABASE_URL + '/rest/v1' + path, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(opts && opts.headers)
    }
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}

function normalizar(str) {
  return (str || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairNomes(texto) {
  const nomes = [];
  // Padrão: após "CC: [número]" vem o nome em maiúsculas antes de "Nome do Funcionário"
  const regex = /CC:\s*\d+\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{3,60}?)\s+Nome do Funcion/gi;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    const nome = match[1].trim().replace(/\s+/g, ' ');
    if (nome.split(' ').length >= 2) nomes.push(nome);
  }
  return [...new Set(nomes)];
}

function nomeBate(nomePDF, nomeCadastro) {
  const a = normalizar(nomePDF).split(' ').filter(p => p.length > 2);
  const b = normalizar(nomeCadastro).split(' ').filter(p => p.length > 2);
  const matches = a.filter(p => b.includes(p));
  return matches.length >= 2;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { base64, empresa_email, mes, ano } = req.body;
    if (!base64 || !empresa_email) return res.status(400).json({ ok: false, erro: 'Dados incompletos' });

    const buffer = Buffer.from(base64, 'base64');
    const paginasTexto = [];

    await pdfParse(buffer, {
      pagerender: (pageData) => pageData.getTextContent().then(tc => {
        paginasTexto.push(tc.items.map(i => i.str).join(' '));
        return '';
      })
    });

    // Log para debug
    console.log('Total de paginas:', paginasTexto.length);
    const todosNomes = [];
    paginasTexto.forEach((t, i) => {
      const nomes = extrairNomes(t);
      console.log('Pagina', i+1, ':', nomes);
      todosNomes.push(...nomes);
    });

    const funcs = await sbFetch('/funcionarios?empresa_email=eq.' + encodeURIComponent(empresa_email) + '&select=cpf,nome');
    console.log('Funcionarios cadastrados:', JSON.stringify(funcs));

    if (!Array.isArray(funcs) || !funcs.length) {
      return res.json({ ok: false, erro: 'Nenhum funcionario cadastrado para esta empresa', debug: { todosNomes } });
    }

    const resultados = [], avisos = [], vistos = new Set();
    const mesStr = String(mes).padStart(2, '0');

    for (const nomePDF of todosNomes) {
      if (vistos.has(normalizar(nomePDF))) continue;

      const func = funcs.find(f => nomeBate(nomePDF, f.nome));

      if (!func) {
        avisos.push('"' + nomePDF + '" nao encontrado no cadastro');
        continue;
      }

      vistos.add(normalizar(nomePDF));

      await sbFetch('/holerites', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          funcionario_cpf: func.cpf,
          funcionario_nome: func.nome,
          empresa_email,
          arquivo_path: 'holerites/' + empresa_email + '/' + mesStr + '-' + ano + '.pdf',
          mes: mesStr,
          ano: String(ano),
          lido: false,
          criado_em: new Date().toISOString()
        })
      });

      resultados.push({ nome: func.nome, cpf: func.cpf });
    }

    return res.json({
      ok: true,
      processados: resultados.length,
      resultados,
      avisos,
      debug: { todosNomes, totalPaginas: paginasTexto.length }
    });

  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok: false, erro: e.message });
  }
};
