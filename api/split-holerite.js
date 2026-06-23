const pdfParse = require('pdf-parse');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';

async function sbFetch(path, opts) {
  const r = await fetch(SUPABASE_URL + '/rest/v1' + path, {
    ...opts,
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(opts && opts.headers) }
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
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

    const funcs = await sbFetch('/funcionarios?empresa_email=eq.' + encodeURIComponent(empresa_email) + '&select=cpf,nome');
    if (!Array.isArray(funcs) || !funcs.length) return res.json({ ok: false, erro: 'Nenhum funcionario cadastrado para esta empresa' });

    function extrairNome(txt) {
      const m = txt.match(/CC:\s*\d+\s+([A-Z\u00C0-\u00DC][A-Z\u00C0-\u00DC\s]{4,60}?)\s+Nome do Funcion/);
      if (m) return m[1].trim();
      return null;
    }

    const resultados = [], avisos = [], vistos = new Set();

    for (let i = 0; i < paginasTexto.length; i++) {
      const nome = extrairNome(paginasTexto[i]);
      if (!nome || vistos.has(nome)) continue;

      const func = funcs.find(f => {
        const a = (f.nome || '').toUpperCase().split(/\s+/).filter(p => p.length > 2);
        const b = nome.toUpperCase().split(/\s+/).filter(p => p.length > 2);
        return b.filter(p => a.includes(p)).length >= 2;
      });

      if (!func) { avisos.push('"' + nome + '" nao encontrado'); continue; }
      vistos.add(nome);

      await sbFetch('/holerites', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ funcionario_cpf: func.cpf, funcionario_nome: func.nome, empresa_email, arquivo_path: 'holerites/' + empresa_email + '/' + mes + '-' + ano + '.pdf', mes: String(mes).padStart(2,'0'), ano: String(ano), lido: false, criado_em: new Date().toISOString(), pagina: i + 1 })
      });
      resultados.push({ nome: func.nome, pagina: i + 1 });
    }

    return res.json({ ok: true, processados: resultados.length, resultados, avisos });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok: false, erro: e.message });
  }
};
