const pdfParse = require('pdf-parse');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';

// Testar se pdf-lib está disponível
let PDFDocument;
try {
  PDFDocument = require('pdf-lib').PDFDocument;
  console.log('pdf-lib OK');
} catch(e) {
  console.log('pdf-lib NAO DISPONIVEL:', e.message);
}

async function sbFetch(path, opts) {
  const r = await fetch(SUPABASE_URL + '/rest/v1' + path, {
    ...opts,
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(opts && opts.headers) }
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}

async function uploadStorage(path, buffer) {
  const r = await fetch(SUPABASE_URL + '/storage/v1/object/arquivos/' + path, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
    body: buffer
  });
  return r.ok;
}

function normalizar(str) {
  return (str || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function extrairNomes(texto) {
  const nomes = [];
  const regex = /CC:\s*\d+\s+([A-ZÀ-Ú][A-ZÀ-Ú\s]{3,60}?)\s+Nome do Funcion/gi;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    const nome = match[1].trim().replace(/\s+/g, ' ');
    if (nome.split(' ').length >= 2) nomes.push(nome);
  }
  return [...new Set(nomes)];
}

function nomeBate(a, b) {
  const pa = normalizar(a).split(' ').filter(p => p.length > 2);
  const pb = normalizar(b).split(' ').filter(p => p.length > 2);
  return pa.filter(p => pb.includes(p)).length >= 2;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Rota de teste
  if (req.body && req.body.test) {
    return res.json({ 
      ok: true, 
      pdfLibAvailable: !!PDFDocument,
      pdfParseAvailable: !!pdfParse
    });
  }

  try {
    const { base64, empresa_email, mes, ano } = req.body;
    if (!base64 || !empresa_email) return res.status(400).json({ ok: false, erro: 'Dados incompletos' });

    const buffer = Buffer.from(base64, 'base64');
    const mesStr = String(mes).padStart(2, '0');

    // 1. Extrair texto por página
    const paginasTexto = [];
    await pdfParse(buffer, {
      pagerender: (pageData) => pageData.getTextContent().then(tc => {
        paginasTexto.push(tc.items.map(i => i.str).join(' '));
        return '';
      })
    });

    // 2. Buscar funcionários
    const funcs = await sbFetch('/funcionarios?empresa_email=eq.' + encodeURIComponent(empresa_email) + '&select=cpf,nome');
    if (!Array.isArray(funcs) || !funcs.length) {
      return res.json({ ok: false, erro: 'Nenhum funcionario cadastrado para esta empresa' });
    }

    // 3. Mapear página → funcionário
    const mapeamento = [];
    const nomesVistos = new Set();

    for (let i = 0; i < paginasTexto.length; i++) {
      const nomes = extrairNomes(paginasTexto[i]);
      for (const nomePDF of nomes) {
        const nNorm = normalizar(nomePDF);
        if (nomesVistos.has(nNorm)) continue;
        const func = funcs.find(f => nomeBate(nomePDF, f.nome));
        if (func) {
          nomesVistos.add(nNorm);
          mapeamento.push({ pagina: i, func });
        }
      }
    }

    const resultados = [], avisos = [];

    // 4. Se pdf-lib disponível, separar por página; senão usar PDF completo por funcionário
    if (PDFDocument) {
      const pdfDoc = await PDFDocument.load(buffer);
      
      for (const { pagina, func } of mapeamento) {
        const novoPdf = await PDFDocument.create();
        const [pg] = await novoPdf.copyPages(pdfDoc, [pagina]);
        novoPdf.addPage(pg);
        const pdfBytes = await novoPdf.save();
        const storagePath = 'holerites/' + empresa_email + '/' + func.cpf + '/' + mesStr + '-' + ano + '.pdf';
        
        await uploadStorage(storagePath, Buffer.from(pdfBytes));
        await sbFetch('/holerites', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({ funcionario_cpf: func.cpf, funcionario_nome: func.nome, empresa_email, arquivo_path: storagePath, mes: mesStr, ano: String(ano), lido: false, criado_em: new Date().toISOString() })
        });
        resultados.push({ nome: func.nome, cpf: func.cpf });
      }
    } else {
      // Fallback sem pdf-lib — mesmo PDF para todos mas com página específica registrada
      avisos.push('pdf-lib indisponivel - separacao de paginas nao realizada');
      for (const { pagina, func } of mapeamento) {
        const storagePath = 'holerites/' + empresa_email + '/' + func.cpf + '/' + mesStr + '-' + ano + '.pdf';
        await uploadStorage(storagePath, buffer);
        await sbFetch('/holerites', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({ funcionario_cpf: func.cpf, funcionario_nome: func.nome, empresa_email, arquivo_path: storagePath, mes: mesStr, ano: String(ano), lido: false, pagina: pagina + 1, criado_em: new Date().toISOString() })
        });
        resultados.push({ nome: func.nome, cpf: func.cpf });
      }
    }

    return res.json({ ok: true, processados: resultados.length, resultados, avisos, pdfLibUsed: !!PDFDocument });

  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok: false, erro: e.message });
  }
};
