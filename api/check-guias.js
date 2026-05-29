const { createClient } = require('@supabase/supabase-js');
const { GoogleAuth } = require('google-auth-library');

const SUPABASE_URL = 'https://nacdezqdsouhxgftqaku.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY2RlenFkc291aHhnZnRxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU4MjYsImV4cCI6MjA5NDg2MTgyNn0.C1eqGfu7h-oOC0ibw6hzecPsG49e6IrOXrxu0C-mOSY';

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "hp-contabilidade",
  private_key_id: "a99a1103741fdd5b72f5bf2550a37242e3952339",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7KPpqLiuMqVgY\nCoKfq9B3USrVeE9OYMMN6bmpobKjyJuV7Enj7D9J0RoX+0ZdKmNpdNMpJrKyazfz\nlUQiEB9ypkSbLfZA45dVkrFnKSgcNbtT4hwnY5kKmcGrQ/fJxPoALshZ3lgv2RGk\nK8/UYaG8JxLbcctebv9/ohm04cwpgKSSyr73LLvm7rHxvkeoY8735T69Jz/IRKPo\nkBWraG509wzHN+yNnED8ITkELklvo9QWjK0fagYvC+vbl3iqna+P3AuobQvGlL91\nJRYmP30E7wlmp1grM+JtY2ZHS5ijBZJ49j016bJe+cM1CV6d6SGJ84aWXqbh6r8J\nHxo7D/e1AgMBAAECggEACNrDV+yqJ+XOO3sqCVXT71oRYGITFnIUYTgEVTMrGW92\nWHnJdLHR2LMwZy3UCWM7OQXny5PUyD4lOoN+jV5ykf104iMGbApfjRL7RWucDPby\nsuElVBAtqirWD8tzSmzIRABkYtXWp8v3zHkffTyqkWqVmpVRwQOmO3/vrPcyPEzJ\nmE8cK/clOnx1twUEwvL6n4gKHxK3iJRYQ0UsZXYhfafOUvKxy3/qYhlpNBRpWYxi\nRMlO+MEgf5/BGTVXcBIJEUT6dTubpCHx6OXCfbsG4kES8DZxmvqg41RRDHvH4yh4\nvHHBi64O/EQGWeD1/hhvgL14k6hxnWHfDrlUn+a47QKBgQDiuEdIYRtkQWJ/Ocka\n6TI0nEzcgbU8kUC+rVmJs85stYijcis0R14/K3Fx/j9fZS4tE/zUf5HHzp+9I45Y\n0kNU/n4nLzoJEKWkKFPDoAtR6QSaIKRMWIAtlLXNBaLCvTaYPhqrgq+vnco3HkF8\n2bD1x401Q8aGP+ddw8913MPUBwKBgQDTVMpWotuMaL2ev58kEig8JQwM6f5l1pj3\no3nf5xAwpPxYBdu7zwXOycutlHSSOxXYYScujUlpUCeTKKMxp43dDT+aqRT+mpMd\nmO8YtxX7K409FiNV1NRSXf7zKOBVxQvM74tmBgI0nbDUw5ofnzs0OLyu0ohtNpnM\nBm2YB07/YwKBgQCnSXvnbyeL+SbZY2T9Q1Y1NaMNDXQSJcdVKomnrpHA6s3QdDxm\nzcY/7ClACG7wT7MbteTXUu3ZNZ/uKl8tMLBX9ZRWC2XSLINcNhlgfiX8IWiw5Sb1\n4lNpzpG6ns7yzDSNbz20kbBab542v09o9SO6pqyNwd2pT1vDdukMOYIRXwKBgQCb\nH4Auu/iARln57xp3tcRG8cK4sAIG6tD55cuOKOPfcRux2QsD/uB6e/HABlrTA//z\nBs1mBFvArA+Am7G+vwkJG7J2amp4wSn/7cSD1dCSv9M65ccmN8VqeIiuIHEbRDp3\nQdaHGx3/VUj5xGKbl5wzpvoJMYzm7c9Szd0gXS0FlQKBgANjvu5rQmi3UIENBWud\nwfTjk9ivUUH/yd/QtDTz7jytsK94suJgGwvf0Yd/4VZG4fUYRi20RPbJJyMRli9k\nIF4vC9VINT4yAAjwViBRxsjqkdtdVrQrYj3VLG0lTEJZAvzGAlVnGEfN+y4y3MIg\n5AJXObR3vWzKNkdY7uQNMW4Y\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@hp-contabilidade.iam.gserviceaccount.com",
  token_uri: "https://oauth2.googleapis.com/token"
};

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: SERVICE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function enviarPush(fcmToken, titulo, corpo) {
  try {
    const accessToken = await getAccessToken();
    await fetch('https://fcm.googleapis.com/v1/projects/hp-contabilidade/messages:send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title: titulo, body: corpo },
          webpush: {
            notification: {
              icon: 'https://portal-arquivo.vercel.app/icon-192.png',
              badge: 'https://portal-arquivo.vercel.app/icon-192.png',
              requireInteraction: true
            }
          }
        }
      })
    });
    console.log(`Push enviado: ${titulo}`);
  } catch(e) {
    console.error('Erro push:', e.message);
  }
}

module.exports = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const em3dias = new Date(hoje);
    em3dias.setDate(hoje.getDate() + 3);

    const hojeStr = hoje.toISOString().split('T')[0];
    const em3diasStr = em3dias.toISOString().split('T')[0];

    console.log(`Verificando guias para hoje (${hojeStr}) e em 3 dias (${em3diasStr})...`);

    // Buscar guias pendentes que vencem hoje ou em 3 dias
    const { data: guias } = await sb.from('guias')
      .select('*')
      .eq('status', 'pendente')
      .or(`vencimento.eq.${hojeStr},vencimento.eq.${em3diasStr}`);

    if (!guias || guias.length === 0) {
      console.log('Nenhuma guia a vencer hoje ou em 3 dias.');
      return res.status(200).json({ message: 'Nenhuma guia encontrada.' });
    }

    console.log(`${guias.length} guia(s) encontrada(s).`);

    // Buscar tokens FCM dos clientes
    const emails = [...new Set(guias.map(g => g.cliente_email))];
    const { data: clientes } = await sb.from('clientes')
      .select('email, nome, fcm_token')
      .in('email', emails);

    for (const guia of guias) {
      const cliente = clientes?.find(c => c.email === guia.cliente_email);
      if (!cliente?.fcm_token) {
        console.log(`Sem token FCM para: ${guia.cliente_email}`);
        continue;
      }

      const venc = new Date(guia.vencimento + 'T00:00:00');
      const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));

      let titulo, corpo;
      if (diff === 0) {
        titulo = 'Guia vence HOJE';
        corpo = `${guia.tipo} — ${formatDate(guia.vencimento)}${guia.valor ? ' — R$ ' + parseFloat(guia.valor).toFixed(2).replace('.', ',') : ''}`;
      } else {
        titulo = `Guia vence em ${diff} dia(s)`;
        corpo = `${guia.tipo} — ${formatDate(guia.vencimento)}${guia.valor ? ' — R$ ' + parseFloat(guia.valor).toFixed(2).replace('.', ',') : ''}`;
      }

      await enviarPush(cliente.fcm_token, titulo, corpo);
    }

    res.status(200).json({ success: true, guias: guias.length });
  } catch(err) {
    console.error('Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
};

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
