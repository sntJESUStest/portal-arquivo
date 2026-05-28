const { GoogleAuth } = require('google-auth-library');

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "hp-contabilidade",
  private_key_id: "a99a1103741fdd5b72f5bf2550a37242e3952339",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7KPpqLiuMqVgY\nCoKfq9B3USrVeE9OYMMN6bmpobKjyJuV7Enj7D9J0RoX+0ZdKmNpdNMpJrKyazfz\nlUQiEB9ypkSbLfZA45dVkrFnKSgcNbtT4hwnY5kKmcGrQ/fJxPoALshZ3lgv2RGk\nK8/UYaG8JxLbcctebv9/ohm04cwpgKSSyr73LLvm7rHxvkeoY8735T69Jz/IRKPo\nkBWraG509wzHN+yNnED8ITkELklvo9QWjK0fagYvC+vbl3iqna+P3AuobQvGlL91\nJRYmP30E7wlmp1grM+JtY2ZHS5ijBZJ49j016bJe+cM1CV6d6SGJ84aWXqbh6r8J\nHxo7D/e1AgMBAAECggEACNrDV+yqJ+XOO3sqCVXT71oRYGITFnIUYTgEVTMrGW92\nWHnJdLHR2LMwZy3UCWM7OQXny5PUyD4lOoN+jV5ykf104iMGbApfjRL7RWucDPby\nsuElVBAtqirWD8tzSmzIRABkYtXWp8v3zHkffTyqkWqVmpVRwQOmO3/vrPcyPEzJ\nmE8cK/clOnx1twUEwvL6n4gKHxK3iJRYQ0UsZXYhfafOUvKxy3/qYhlpNBRpWYxi\nRMlO+MEgf5/BGTVXcBIJEUT6dTubpCHx6OXCfbsG4kES8DZxmvqg41RRDHvH4yh4\nvHHBi64O/EQGWeD1/hhvgL14k6hxnWHfDrlUn+a47QKBgQDiuEdIYRtkQWJ/Ocka\n6TI0nEzcgbU8kUC+rVmJs85stYijcis0R14/K3Fx/j9fZS4tE/zUf5HHzp+9I45Y\n0kNU/n4nLzoJEKWkKFPDoAtR6QSaIKRMWIAtlLXNBaLCvTaYPhqrgq+vnco3HkF8\n2bD1x401Q8aGP+ddw8913MPUBwKBgQDTVMpWotuMaL2ev58kEig8JQwM6f5l1pj3\no3nf5xAwpPxYBdu7zwXOycutlHSSOxXYYScujUlpUCeTKKMxp43dDT+aqRT+mpMd\nmO8YtxX7K409FiNV1NRSXf7zKOBVxQvM74tmBgI0nbDUw5ofnzs0OLyu0ohtNpnM\nBm2YB07/YwKBgQCnSXvnbyeL+SbZY2T9Q1Y1NaMNDXQSJcdVKomnrpHA6s3QdDxm\nzcY/7ClACG7wT7MbteTXUu3ZNZ/uKl8tMLBX9ZRWC2XSLINcNhlgfiX8IWiw5Sb1\n4lNpzpG6ns7yzDSNbz20kbBab542v09o9SO6pqyNwd2pT1vDdukMOYIRXwKBgQCb\nH4Auu/iARln57xp3tcRG8cK4sAIG6tD55cuOKOPfcRux2QsD/uB6e/HABlrTA//z\nBs1mBFvArA+Am7G+vwkJG7J2amp4wSn/7cSD1dCSv9M65ccmN8VqeIiuIHEbRDp3\nQdaHGx3/VUj5xGKbl5wzpvoJMYzm7c9Szd0gXS0FlQKBgANjvu5rQmi3UIENBWud\nwfTjk9ivUUH/yd/QtDTz7jytsK94suJgGwvf0Yd/4VZG4fUYRi20RPbJJyMRli9k\nIF4vC9VINT4yAAjwViBRxsjqkdtdVrQrYj3VLG0lTEJZAvzGAlVnGEfN+y4y3MIg\n5AJXObR3vWzKNkdY7uQNMW4Y\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@hp-contabilidade.iam.gserviceaccount.com",
  client_id: "118106723037984105398",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token"
};

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: SERVICE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { fcm_token, title, body, tag, urgente } = req.body;
  if (!fcm_token || !title || !body) {
    return res.status(400).json({ error: 'fcm_token, title e body são obrigatórios' });
  }

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/hp-contabilidade/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: fcm_token,
            notification: { title, body },
            data: { tag: tag || 'hp-notif', urgente: urgente ? 'true' : 'false' },
            webpush: {
              notification: {
                icon: 'https://portal-arquivo.vercel.app/icon-192.png',
                badge: 'https://portal-arquivo.vercel.app/icon-192.png',
                requireInteraction: urgente || false
              }
            }
          }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error('FCM error:', data.error);
      return res.status(500).json({ error: data.error });
    }

    res.status(200).json({ success: true, messageId: data.name });
  } catch (err) {
    console.error('Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
};
