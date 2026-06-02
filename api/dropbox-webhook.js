const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';
const DROPBOX_APP_KEY = '9lovo2qjjo5okdt';
const DROPBOX_APP_SECRET = 'kmhc2aq4qyl42xa';

async function getDropboxToken() {
  // Buscar refresh token salvo
  const { data: refreshData } = await sb.from('configuracoes').select('valor').eq('chave', 'dropbox_refresh_token').maybeSingle();
  if (!refreshData?.valor) throw new Error('Refresh token nao encontrado. Acesse /api/dropbox-auth para autorizar.');

  // Renovar access token usando refresh token
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshData.valor,
      client_id: DROPBOX_APP_KEY,
      client_secret: DROPBOX_APP_SECRET
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`Erro ao renovar token: ${data.error_description}`);

  // Salvar novo access token
  await sb.from('configuracoes').upsert({ chave: 'dropbox_access_token', valor: data.access_token }, { onConflict: 'chave' });
  return data.access_token;
}

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
const FIREBASE_PROJECT = 'hp-contabilidade';
const SERVICE_ACCOUNT_EMAIL = 'firebase-adminsdk-fbsvc@hp-contabilidade.iam.gserviceaccount.com';
const SERVICE_ACCOUNT_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7KPpqLiuMqVgY\nCoKfq9B3USrVeE9OYMMN6bmpobKjyJuV7Enj7D9J0RoX+0ZdKmNpdNMpJrKyazfz\nlUQiEB9ypkSbLfZA45dVkrFnKSgcNbtT4hwnY5kKmcGrQ/fJxPoALshZ3lgv2RGk\nK8/UYaG8JxLbcctebv9/ohm04cwpgKSSyr73LLvm7rHxvkeoY8735T69Jz/IRKPo\nkBWraG509wzHN+yNnED8ITkELklvo9QWjK0fagYvC+vbl3iqna+P3AuobQvGlL91\nJRYmP30E7wlmp1grM+JtY2ZHS5ijBZJ49j016bJe+cM1CV6d6SGJ84aWXqbh6r8J\nHxo7D/e1AgMBAAECggEACNrDV+yqJ+XOO3sqCVXT71oRYGITFnIUYTgEVTMrGW92\nWHnJdLHR2LMwZy3UCWM7OQXny5PUyD4lOoN+jV5ykf104iMGbApfjRL7RWucDPby\nsuElVBAtqirWD8tzSmzIRABkYtXWp8v3zHkffTyqkWqVmpVRwQOmO3/vrPcyPEzJ\nmE8cK/clOnx1twUEwvL6n4gKHxK3iJRYQ0UsZXYhfafOUvKxy3/qYhlpNBRpWYxi\nRMlO+MEgf5/BGTVXcBIJEUT6dTubpCHx6OXCfbsG4kES8DZxmvqg41RRDHvH4yh4\nvHHBi64O/EQGWeD1/hhvgL14k6hxnWHfDrlUn+a47QKBgQDiuEdIYRtkQWJ/Ocka\n6TI0nEzcgbU8kUC+rVmJs85stYijcis0R14/K3Fx/j9fZS4tE/zUf5HHzp+9I45Y\n0kNU/n4nLzoJEKWkKFPDoAtR6QSaIKRMWIAtlLXNBaLCvTaYPhqrgq+vnco3HkF8\n2bD1x401Q8aGP+ddw8913MPUBwKBgQDTVMpWotuMaL2ev58kEig8JQwM6f5l1pj3\no3nf5xAwpPxYBdu7zwXOycutlHSSOxXYYScujUlpUCeTKKMxp43dDT+aqRT+mpMd\nmO8YtxX7K409FiNV1NRSXf7zKOBVxQvM74tmBgI0nbDUw5ofnzs0OLyu0ohtNpnM\nBm2YB07/YwKBgQCnSXvnbyeL+SbZY2T9Q1Y1NaMNDXQSJcdVKomnrpHA6s3QdDxm\nzcY/7ClACG7wT7MbteTXUu3ZNZ/uKl8tMLBX9ZRWC2XSLINcNhlgfiX8IWiw5Sb1\n4lNpzpG6ns7yzDSNbz20kbBab542v09o9SO6pqyNwd2pT1vDdukMOYIRXwKBgQCb\nH4Auu/iARln57xp3tcRG8cK4sAIG6tD55cuOKOPfcRux2QsD/uB6e/HABlrTA//z\nBs1mBFvArA+Am7G+vwkJG7J2amp4wSn/7cSD1dCSv9M65ccmN8VqeIiuIHEbRDp3\nQdaHGx3/VUj5xGKbl5wzpvoJMYzm7c9Szd0gXS0FlQKBgANjvu5rQmi3UIENBWud\nwfTjk9ivUUH/yd/QtDTz7jytsK94suJgGwvf0Yd/4VZG4fUYRi20RPbJJyMRli9k\nIF4vC9VINT4yAAjwViBRxsjqkdtdVrQrYj3VLG0lTEJZAvzGAlVnGEfN+y4y3MIg\n5AJXObR3vWzKNkdY7uQNMW4Y\n-----END PRIVATE KEY-----\n`;

async function getFirebaseToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: SERVICE_ACCOUNT_EMAIL, sub: SERVICE_ACCOUNT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  })).toString('base64url');

  const { createSign } = require('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(SERVICE_ACCOUNT_KEY, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const data = await res.json();
  return data.access_token;
}

async function enviarPushCliente(fcmToken, titulo, corpo) {
  try {
    const accessToken = await getFirebaseToken();
    await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT}/messages:send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title: titulo, body: corpo },
          webpush: { notification: { icon: 'https://portal-arquivo.vercel.app/icon-192.png' } }
        }
      })
    });
    console.log('Push enviado!');
  } catch(e) { console.error('Erro push:', e.message); }
}
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function enviarEmail(destinatario, nomeCliente, nomeArquivo, setor, mes, ano) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'HP Contabilidade <onboarding@resend.dev>',
        to: destinatario,
        subject: `Novo documento disponivel - ${setor}`,
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:2rem;">
          <h2 style="color:#4338ca;">HP Contabilidade</h2>
          <p>Ola, <strong>${nomeCliente || 'Cliente'}</strong>!</p>
          <p>Um novo documento foi disponibilizado no seu portal:</p>
          <div style="background:#f7f6f3;border-radius:8px;padding:1rem;margin:1rem 0;">
            <p><strong>Arquivo:</strong> ${nomeArquivo}</p>
            <p><strong>Setor:</strong> ${setor}</p>
            <p><strong>Periodo:</strong> ${mes}/${ano}</p>
          </div>
          <a href="https://portal-arquivo.vercel.app" style="display:inline-block;background:#4338ca;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Acessar Portal</a>
        </div>`
      })
    });
  } catch(e) { console.error('Erro e-mail:', e.message); }
}

// Buscar cursor salvo ou inicializar
async function getCursor() {
  const { data } = await sb.from('configuracoes').select('valor').eq('chave', 'dropbox_cursor').maybeSingle();
  return data?.valor || null;
}

async function saveCursor(cursor) {
  await sb.from('configuracoes').upsert({ chave: 'dropbox_cursor', valor: cursor }, { onConflict: 'chave' });
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).send(req.query.challenge);

  // Aguardar 5 segundos para garantir que chamadas simultâneas não colidam
  await new Promise(r => setTimeout(r, 2000));

  // Verificar se já foi processado nos últimos 2 minutos
  const agora = Date.now();
  const { data: trava } = await sb.from('configuracoes').select('valor').eq('chave', 'dropbox_processando').maybeSingle();
  
  if (trava?.valor && trava.valor !== '0') {
    const ultimoProcess = parseInt(trava.valor);
    if (agora - ultimoProcess < 10000) {
      console.log('Chamada duplicada ignorada.');
      return res.status(200).send('OK');
    }
  }

  // Marcar como processando
  await sb.from('configuracoes').upsert({ chave: 'dropbox_processando', valor: String(agora) }, { onConflict: 'chave' });
  
  await processarAlteracoes();
  
  await sb.from('configuracoes').upsert({ chave: 'dropbox_processando', valor: '0' }, { onConflict: 'chave' });

  res.status(200).send('OK');
};

function detectarGuiaPorNome(nomeArquivo) {
  const nome = nomeArquivo.toLowerCase();
  let tipo = null;
  if (nome.includes('das') || nome.includes('simples')) tipo = 'DAS Simples Nacional';
  else if (nome.includes('irpj')) tipo = 'DARF IRPJ';
  else if (nome.includes('csll')) tipo = 'DARF CSLL';
  else if (nome.includes('pis') || nome.includes('cofins')) tipo = 'DARF PIS/COFINS';
  else if (nome.includes('inss') || nome.includes('gps')) tipo = 'GPS INSS';
  else if (nome.includes('fgts')) tipo = 'FGTS';
  else if (nome.includes('iss')) tipo = 'ISS';
  if (!tipo) return null;

  const matchMMYYYY = nomeArquivo.match(/(\d{2})[_\-\s](\d{4})/);
  if (matchMMYYYY) return { tipo, mes: matchMMYYYY[1], ano: matchMMYYYY[2] };

  const matchAno = nomeArquivo.match(/20\d{2}/);
  if (matchAno && tipo) return { tipo, mes: null, ano: matchAno[0] };

  return null;
}

async function marcarGuiaComoPagaWebhook(clienteEmail, tipo, mes, ano) {
  try {
    const { data: guias } = await sb.from('guias')
      .select('id, vencimento')
      .eq('cliente_email', clienteEmail)
      .eq('tipo', tipo)
      .eq('status', 'pendente');

    if (!guias || guias.length === 0) return;

    const guia = guias.find(g => {
      const venc = new Date(g.vencimento + 'T00:00:00');
      return (!mes || venc.getMonth() + 1 === parseInt(mes)) &&
             (!ano || venc.getFullYear() === parseInt(ano));
    });

    if (guia) {
      await sb.from('guias').update({ status: 'disponivel' }).eq('id', guia.id);
      console.log('Guia paga automaticamente:', tipo, mes, ano);
    }
  } catch(e) { console.error('Erro marcar guia:', e.message); }
}

async function processarAlteracoes() {
  try {
    const DROPBOX_TOKEN = await getDropboxToken();
    const cursor = await getCursor();
    let arquivos = [];
    let novoCursor = null;

    if (!cursor) {
      // Primeira vez: inicializar cursor sem processar arquivos existentes
      console.log('Inicializando cursor do Dropbox...');
      const res1 = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${DROPBOX_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: DROPBOX_ROOT, recursive: true, include_deleted: false })
      });
      const data1 = await res1.json();
      novoCursor = data1.cursor;

      // Paginar até o fim para pegar o cursor mais recente
      let hasMore = data1.has_more;
      let tempCursor = novoCursor;
      while (hasMore) {
        const resMore = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${DROPBOX_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cursor: tempCursor })
        });
        const dataMore = await resMore.json();
        tempCursor = dataMore.cursor;
        hasMore = dataMore.has_more;
      }
      await saveCursor(tempCursor);
      console.log('Cursor inicializado! Próximos arquivos serão processados.');
      return;
    }

    // Usar cursor para pegar só as mudanças desde a última vez
    console.log('Buscando mudanças desde último cursor...');
    const resLong = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${DROPBOX_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursor })
    });

    const dataLong = await resLong.json();
    if (dataLong.error) { console.error('Erro cursor:', JSON.stringify(dataLong)); return; }

    arquivos = (dataLong.entries || []).filter(e => e['.tag'] === 'file');
    novoCursor = dataLong.cursor;
    await saveCursor(novoCursor);

    console.log(`Novos arquivos encontrados: ${arquivos.length}`);
    if (arquivos.length === 0) return;

    const { data: clientes } = await sb.from('clientes').select('*');

    for (const arquivo of arquivos) {
      const pathSemRoot = arquivo.path_display.replace(DROPBOX_ROOT + '/', '');
      const partes = pathSemRoot.split('/').filter(Boolean);
      if (partes.length < 4) continue;

      const [nomeEmpresa, setorRaw, mesAno, nomeArquivo] = partes;
      const setor = SETORES_MAP[setorRaw] || SETORES_MAP[setorRaw?.toUpperCase()];
      if (!setor) continue;

      const partesMesAno = mesAno.split('-');
      if (partesMesAno.length < 2) continue;
      const mes = partesMesAno[0];
      const ano = partesMesAno[1];
      const mesNome = MESES[mes];
      if (!mesNome || !ano) continue;

      const cliente = clientes?.find(c =>
        c.empresa?.toLowerCase().trim() === nomeEmpresa.toLowerCase().trim()
      );
      if (!cliente) { console.log(`Cliente não encontrado: "${nomeEmpresa}"`); continue; }

      // Verificar duplicata pelo path do Dropbox
      const { data: existente } = await sb.from('notificacoes')
        .select('id').eq('dropbox_path', arquivo.path_display).maybeSingle();
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
        .from('arquivos').upload(storagePath, fileBuffer, { contentType: 'application/octet-stream', upsert: false });
      if (uploadErr) { console.error('Erro upload:', uploadErr.message); continue; }

      await sb.from('notificacoes').insert({
        cliente_email: cliente.email,
        arquivo_nome: nomeArquivo,
        arquivo_path: storagePath,
        dropbox_path: arquivo.path_display,
        mensagem: `Novo documento disponivel em ${setor} - ${mesNome}/${ano}`,
        setor, ano, mes: mesNome,
        lido: false,
        criado_em: new Date().toISOString()
      });

      // Detectar guia pelo nome e marcar como paga
      const guiaDetectada = detectarGuiaPorNome(nomeArquivo);
      if (guiaDetectada) {
        await marcarGuiaComoPagaWebhook(cliente.email, guiaDetectada.tipo, guiaDetectada.mes, guiaDetectada.ano);
      }

      console.log(`Importado: ${nomeArquivo} -> ${cliente.email}`);
      await enviarEmail(cliente.email, cliente.nome, nomeArquivo, setor, mesNome, ano);

      // Enviar push notification
      const { data: clienteData } = await sb.from('clientes').select('fcm_token').eq('email', cliente.email).maybeSingle();
      if (clienteData?.fcm_token) {
        await enviarPushCliente(clienteData.fcm_token, 'Novo documento disponivel', `${nomeArquivo} — ${setor} ${mesNome}/${ano}`);
      }
    }
  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}
