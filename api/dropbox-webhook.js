const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_TOKEN = 'sl.u.AGgxb9usIWGcC9dK-MrRTZQpG-186d1doxi_mMacE-WG7lLsaBn6fkhg9PxLSfQqdTS111yS_ps99Zg4pQcJBTeFvxtVwSrSVr2Xe-zUeqSoQ4rBpfOOP9qhveXP6-Q3eT5K36YYNZdS0n7GsqKljx4aTGXzMLai7i3Mif1Ps7fCEaW6-RSqh0o9Lfq3qY1vaRxeo1TYPDNybiC69-sokfYaTHEft5aZuLaIqjOIiweeWqY9VNks7sAxXWTNwoJSTT0H_fvSaNCgH5L3TJAE29Iw9P2O21ksEPI16FdsD0Zs0ELzTUcLyQHos0efjsTnclQHID9Yr-_jEWUe940HKpVCouqn2Hl958cXkshsScRiaKQif3Hi3ePEvStWFxkzsJJl6LKp4Xlt2AcKdnOLyaDQKnywi8NLshFGKzEhYSNUmLqC8OBpJOgzLEu8yKqfm41W-Mb8__W3uR8jessKYy7q97MmoDlqX7YOpuA3up1KImcc-feCnjFnj5bRW1rllJFI6inP8HgvjEhEqkMnOKtdVL-0fiROWYKaDSd6bMiKN6gAjZ7Zws-luL8VBwxGUWKPWVVv7LobOaGcnayD9OwJMl9Pua014MTv_V2YdusspIvMy1PMzd41pVmHL0cNWoXDFQr0gOSwGeKmOHxrtNetLeAh5kpAAb-ejSDtCXHvduTbwFNDO_9LqJ7__JF1DnJ4NdIJRJ_RJcs2_jwmuo0Z8ia-HGBwi8rCWaTKqI6Xrp1tW97utpNGZ9sEyFORnOREtpiAsVyz2WURSMxLRanCeFRjrLGX9rzf20KRQII4dpgC-QN4IObgLDIJUN57mrssdQdaq0cVLs4e0fINUPmhW7HFAO4TW2U1kyBxAV3xKl3uI-PIF_IOeLzgTy42IAeiPcJxCJ-ILcvrzMhWItA6SgMplOPgQhAs9VzxIFayQir6BipRmx-3XjWt5DkTg1WvuFGtgcise0LHnTfDzJMGkySO_7t3mUEOFYJpftCAV4S-e06GYWkReBPj1MUsPLijvvW3Q1yfe-hrMv2GFsZbOldYWcpQJ6HmGWlov-Wdqx_r49msLo5SE7ON4QHkyKnHlx1cqcuM2ez5dwBjloPjFF7uhKH1oz9--crfo96r-xnF_-2q_Z2AzQxz2OugkG5FUgFILbXEkux-sxOuYhZ0nUS5IKlO8ukRs30IJhIWwOxQ3mIhvaaW9dEMtLzX_r83-YhAGYQTiAskvi6kskIKj19ttFs-_XbZpw8EWmxAv42BLdIlDiz5gV2FLD-puaI_Cq1bSZJEy6W16gJcGlnHZGIMhgzGN-yJn_OXtQNbt9X7JQ-TdCN-GzKCjWOetzxJzHh9_Q5oESsnUp_4hsBilKOOfz7gUn-eMbWNQVdze0w1xJCNqo9MwvYe0w2RvrWT1Uvs5QbUHhIsj3TMgCYn'

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

const RESEND_KEY = 're_RYZ69Shp_81aSh4AwWTMqRLjZxTLZcV8w';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function enviarEmail(destinatario, nomeCliente, nomeArquivo, setor, mes, ano) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'HP Contabilidade <onboarding@resend.dev>',
        to: destinatario,
        subject: `Novo documento disponível - ${setor}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
            <h2 style="color: #4338ca;">HP Contabilidade</h2>
            <p>Olá, <strong>${nomeCliente || 'Cliente'}</strong>!</p>
            <p>Um novo documento foi disponibilizado no seu portal:</p>
            <div style="background: #f7f6f3; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
              <p><strong>📄 Arquivo:</strong> ${nomeArquivo}</p>
              <p><strong>📂 Setor:</strong> ${setor}</p>
              <p><strong>📅 Período:</strong> ${mes}/${ano}</p>
            </div>
            <a href="https://portal-arquivo.vercel.app" style="display:inline-block;background:#4338ca;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:1rem;">
              Acessar Portal
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 2rem;">HP Contabilidade · portal-arquivo.vercel.app</p>
          </div>
        `
      })
    });
    const data = await res.json();
    console.log('E-mail enviado:', data.id || JSON.stringify(data));
  } catch(e) {
    console.error('Erro e-mail:', e.message);
  }
}

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
      await enviarEmail(cliente.email, cliente.nome, nomeArquivo, setor, mesNome, ano);
    }
  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}
