const https = require('https');
const { URL } = require('url');

const API_BASE = 'https://api.grizzlysms.com/stubs/handler_api.php';
const FIVESIM_BASE = 'https://5sim.net/v1/user';

function grizzlyRequest(params) {
  return new Promise((resolve) => {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}?${searchParams.toString()}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (data.startsWith('<')) {
          resolve({ error: 'SERVICE_UNAVAILABLE' });
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ error: data });
        }
      });
    }).on('error', (err) => {
      resolve({ error: 'NETWORK_ERROR', details: err.message });
    });
  });
}

function fiveSimRequest(apiKey, endpoint) {
  return new Promise((resolve) => {
    console.log(`[5SIM] API Key present: ${apiKey ? 'YES' : 'NO'}, Key length: ${apiKey ? apiKey.length : 0}`);

    const urlString = `${FIVESIM_BASE}${endpoint}`;
    const parsedUrl = new URL(urlString);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'GrizzlyBot/1.0',
      },
    };

    console.log(`[5SIM] Request URL: ${urlString}`);

    const request = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`[5SIM] Status: ${res.statusCode}, Response: ${data}`);
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          // 5sims devuelve errores como texto plano (ej: "no free phones", "bad country")
          console.error(`[5SIM] Parse Error: ${e.message}, Response: ${data}`);
          resolve({ error: data.trim() || 'INVALID_JSON', details: data });
        }
      });
    });

    request.on('error', (err) => {
      console.error(`[5SIM] Request Error: ${err.message}`);
      resolve({ error: 'NETWORK_ERROR', details: err.message });
    });

    request.end();
  });
}

async function getNumber(apiKey, service = 'ig', country = '187') {
  const result = await grizzlyRequest({
    api_key: apiKey,
    action: 'getNumberV2',
    service,
    country,
  });

  if (result.activationId) {
    return {
      success: true,
      activationId: result.activationId,
      phoneNumber: result.phoneNumber,
      activationCost: result.activationCost,
    };
  }

  return {
    success: false,
    error: result.error || 'UNKNOWN_ERROR',
  };
}

async function getStatus(apiKey, activationId) {
  const result = await grizzlyRequest({
    api_key: apiKey,
    action: 'getStatus',
    id: activationId,
  });

  let statusString = result;

  if (typeof result === 'object' && result.status) {
    statusString = result.status;
  } else if (typeof result === 'object' && result.error) {
    statusString = result.error;
  } else if (typeof result === 'string') {
    statusString = result;
  }

  if (typeof statusString === 'string') {
    if (statusString.startsWith('STATUS_OK:')) {
      const code = statusString.split(':')[1];
      return { code, status: 'STATUS_OK' };
    }
    if (statusString === 'STATUS_WAIT_CODE' || statusString === 'STATUS_WAIT_RESEND') {
      return { status: statusString };
    }
    if (statusString === 'STATUS_CANCEL') {
      return { status: 'STATUS_CANCEL' };
    }
    return { status: statusString };
  }

  return { error: 'INVALID_RESPONSE' };
}

async function setStatus(apiKey, activationId, status) {
  const result = await grizzlyRequest({
    api_key: apiKey,
    action: 'setStatus',
    id: activationId,
    status: status.toString(),
  });

  return { success: !result.error, result };
}

async function get5SimNumber(apiKey, product = 'instagram') {
  const result = await fiveSimRequest(apiKey, `/buy/activation/us/any/${product}`);

  if (result.id && result.phone) {
    return {
      success: true,
      orderId: result.id,
      phoneNumber: result.phone,
    };
  }

  return {
    success: false,
    error: result.error || 'UNKNOWN_ERROR',
  };
}

async function get5SimStatus(apiKey, orderId) {
  const result = await fiveSimRequest(apiKey, `/check/${orderId}`);

  if (result.error) {
    return { error: result.error };
  }

  if (!result.status) {
    return { error: 'INVALID_RESPONSE' };
  }

  const status = result.status.toUpperCase();

  if (status === 'RECEIVED' && result.sms && result.sms.length > 0) {
    const code = result.sms[0].code;
    return { code, status: 'STATUS_OK' };
  }

  if (status === 'PENDING') {
    return { status: 'STATUS_WAIT_CODE' };
  }

  if (status === 'CANCELED') {
    return { status: 'STATUS_CANCEL' };
  }

  return { status: 'STATUS_WAIT_CODE' };
}

async function cancel5SimOrder(apiKey, orderId) {
  const result = await fiveSimRequest(apiKey, `/cancel/${orderId}`);
  return { success: !result.error, result };
}

async function finish5SimOrder(apiKey, orderId) {
  const result = await fiveSimRequest(apiKey, `/finish/${orderId}`);
  return { success: !result.error, result };
}

function getErrorMessage(error) {
  const messages = {
    NO_NUMBERS: 'No numbers available right now. Try again in a few minutes.',
    NO_BALANCE: 'Insufficient balance on the account. Contact an admin.',
    BAD_KEY: 'Invalid API key. Contact an admin.',
    BAD_SERVICE: 'Invalid service configuration. Contact an admin.',
    SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Try again later.',
    NETWORK_ERROR: 'Network error. Try again in a moment.',
    UNKNOWN_ERROR: 'An unknown error occurred. Contact an admin.',
    'no free phones': 'No USA numbers available right now. Try again in a few minutes.',
    'bad country': 'Invalid country code. Contact an admin.',
    'bad operator': 'Invalid operator. Contact an admin.',
    'no product': 'Invalid product. Contact an admin.',
    'not enough user balance': 'Insufficient balance on the account. Contact an admin.',
    'not enough rating': 'Account rating too low. Contact an admin.',
    'server offline': 'Service temporarily offline. Try again later.',
  };

  const lowerError = String(error).toLowerCase().trim();
  return messages[lowerError] || messages[error] || messages.UNKNOWN_ERROR;
}

module.exports = {
  getNumber,
  getStatus,
  setStatus,
  getErrorMessage,
  get5SimNumber,
  get5SimStatus,
  cancel5SimOrder,
  finish5SimOrder,
};
