const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL || 'https://nacdezqdsouhxgftqaku.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { base64, empresa_email, mes, ano } = req.body;
    if (!base64 || !empresa_email) {
      return res.status(400).json({ ok: false, erro: 'base64 e empresa_email são obrigatórios' });
    }

    const buffer = Buffer.from(base64, 'base64');

    // 1. Extrair texto por página
    const parsed = await pdfParse(buffer);
    const totalPaginas = parsed.numpages;

    // Extrair texto de cada página individualmente
    const paginasTexto = [];
    for (let i = 0; i < totalPaginas; i++) {
      const pagResult = await pdfParse(buffer, {
        max: i + 1,
        pagerender: (pageData) => {
          return pageData.getTextContent().then(tc => {
            return tc.items.map(i => i.str).join(' ');
          });
        }
      });
      paginasTexto.push(pagResult.text);
    }

    // 2. Extrair nome do funcionário de cada página
    // Padrão no PDF: o nome aparece entre "Código\n" e "\nNome do Funcionário"
    function extrairNome(texto) {
      // Tenta padrão: texto antes de "Nome do Funcionário"
      const match = texto.match(/(?:CC:\s*\d+\s+Código\s+)([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÜ\s]+?)(?:\s+Nome do Funcionário|\s+CBO)/i);
      if (match) return match[1].trim();

      // Alternativa: pegar linha em maiúsculas após "CC:"
      const lines = texto.split(/\n|\r/);
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÜ\s]{5,50}$/.test(l) && l === l.toUpperCase() && !l.includes('CNPJ') && !l.includes('FOLHA') && !l.includes('CLINICA') && !l.includes('FONOAUDIOLOG') && !l.includes('SERVICO') && !l.includes('INSS') && !l.includes('ADMINIST')) {
          return l;
        }
      }
      return null;
    }

    // 3. Buscar funcionários da empresa
    const sbAnon = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: funcionarios } = await sbAnon
      .from('funcionarios')
      .select('cpf, nome, email')
      .eq('empresa_email', empresa_email);

    if (!funcionarios || funcionarios.length === 0) {
      return res.status(404).json({ ok: false, erro: 'Nenhum funcionário cadastrado para esta empresa' });
    }

    // 4. Carregar PDF com pdf-lib para separar páginas
    const pdfDoc = await PDFDocument.load(buffer);
    const resultados = [];
    const naoEncontrados = [];

    for (let i = 0; i < totalPaginas; i++) {
      const textoPage = paginasTexto[i] || parsed.text;
      const nomePDF = extrairNome(textoPage);

      if (!nomePDF) {
        naoEncontrados.push(`Página ${i + 1}: nome não detectado`);
        continue;
      }

      // Buscar funcionário pelo nome (comparação flexível)
      const func = funcionarios.find(f => {
        const nomeCad = f.nome?.toUpperCase().trim();
        const nomePDFClean = nomePDF.toUpperCase().trim();
        // Verificar se pelo menos 2 palavras do nome batem
        const palavrasPDF = nomePDFClean.split(/\s+/);
        const palavrasCad = nomeCad?.split(/\s+/) || [];
        const matches = palavrasPDF.filter(p => palavrasCad.includes(p) && p.length > 2);
        return matches.length >= 2;
      });

      if (!func) {
        naoEncontrados.push(`Página ${i + 1}: "${nomePDF}" não encontrado no cadastro`);
        continue;
      }

      // Extrair só essa página do PDF
      const novoPdf = await PDFDocument.create();
      const [paginaCopiada] = await novoPdf.copyPages(pdfDoc, [i]);
      novoPdf.addPage(paginaCopiada);
      const pdfBytes = await novoPdf.save();

      // Upload para Supabase Storage
      const nomeArquivo = `holerites/${empresa_email}/${func.cpf}/${mes}-${ano}.pdf`;
      const { error: uploadErr } = await sbAnon.storage
        .from('arquivos')
        .upload(nomeArquivo, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadErr) {
        naoEncontrados.push(`${func.nome}: erro no upload — ${uploadErr.message}`);
        continue;
      }

      // Obter URL pública
      const { data: { publicUrl } } = sbAnon.storage
        .from('arquivos')
        .getPublicUrl(nomeArquivo);

      // Inserir na tabela holerites
      const { error: insertErr } = await sbAnon.from('holerites').upsert({
        funcionario_cpf: func.cpf,
        funcionario_nome: func.nome,
        empresa_email,
        arquivo_path: publicUrl,
        mes: String(mes),
        ano: String(ano),
        lido: false,
        criado_em: new Date().toISOString()
      }, { onConflict: 'funcionario_cpf,mes,ano' });

      if (insertErr) {
        naoEncontrados.push(`${func.nome}: erro ao salvar — ${insertErr.message}`);
        continue;
      }

      resultados.push({ nome: func.nome, cpf: func.cpf, pagina: i + 1 });
    }

    return res.json({
      ok: true,
      processados: resultados.length,
      resultados,
      avisos: naoEncontrados
    });

  } catch (e) {
    console.error('split-holerite error:', e);
    return res.status(500).json({ ok: false, erro: e.message });
  }
};
