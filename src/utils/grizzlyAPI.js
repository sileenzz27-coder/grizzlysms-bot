const https = require('https');
const { URL } = require('url');

const API_BASE = 'https://api.grizzlysms.com/stubs/handler_api.php';
const FIVESIM_BASE = 'https://5sim.net/v1/user';
const HEROSMS_BASE = 'https://hero-sms.com/stubs/handler_api.php';
const SMSPINVERIFY_BASE = 'https://api.smspinverify.com/';

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

function heroSmsRequest(apiKey, params) {
  return new Promise((resolve) => {
    console.log(`[HEROSMS] API Key present: ${apiKey ? 'YES' : 'NO'}, Key length: ${apiKey ? apiKey.length : 0}`);

    const queryParams = new URLSearchParams({ ...params, api_key: apiKey });
    const urlString = `${HEROSMS_BASE}?${queryParams.toString()}`;
    const parsedUrl = new URL(urlString);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'GrizzlyBot/1.0',
      },
    };

    console.log(`[HEROSMS] Request URL: ${urlString}`);

    const request = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`[HEROSMS] Status: ${res.statusCode}, Response: ${data}`);
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          // hero-sms puede devolver texto plano en algunos casos
          console.error(`[HEROSMS] Parse Error: ${e.message}, Response: ${data}`);
          resolve({ error: data.trim() || 'INVALID_JSON', details: data });
        }
      });
    });

    request.on('error', (err) => {
      console.error(`[HEROSMS] Request Error: ${err.message}`);
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
  const result = await fiveSimRequest(apiKey, `/buy/activation/usa/any/${product}`);

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

async function getHeroSmsNumber(apiKey, service = 'ig', country = '187') {
  const result = await heroSmsRequest(apiKey, {
    action: 'getNumberV2',
    service,
    country,
  });

  if (result.activationId && result.phoneNumber) {
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

async function getHeroSmsStatus(apiKey, activationId) {
  const result = await heroSmsRequest(apiKey, {
    action: 'getStatusV2',
    id: activationId,
  });

  if (result.error) {
    return { error: result.error };
  }

  if (typeof result === 'string') {
    if (result.startsWith('STATUS_OK:')) {
      const code = result.split(':')[1];
      return { code, status: 'STATUS_OK' };
    }
    if (result === 'STATUS_WAIT_CODE' || result === 'STATUS_WAIT_RESEND') {
      return { status: result };
    }
    if (result === 'STATUS_CANCEL') {
      return { status: 'STATUS_CANCEL' };
    }
    return { status: result };
  }

  if (result.sms) {
    let code;
    if (Array.isArray(result.sms) && result.sms.length > 0) {
      code = result.sms[0].code;
    } else if (typeof result.sms === 'object' && result.sms.code) {
      code = result.sms.code;
    }
    if (code) {
      return { code, status: 'STATUS_OK' };
    }
  }

  return { status: 'STATUS_WAIT_CODE' };
}

async function cancelHeroSmsOrder(apiKey, activationId) {
  const result = await heroSmsRequest(apiKey, {
    action: 'cancelActivation',
    id: activationId,
  });
  return { success: !result.error, result };
}

async function finishHeroSmsOrder(apiKey, activationId) {
  const result = await heroSmsRequest(apiKey, {
    action: 'finishActivation',
    id: activationId,
  });
  return { success: !result.error, result };
}

function smspinverifyRequest(apiKey, endpoint, params = {}) {
  return new Promise((resolve) => {
    console.log(`[SMSPINVERIFY] API Key present: ${apiKey ? 'YES' : 'NO'}`);

    const queryParams = new URLSearchParams({
      customer: apiKey,
      ...params
    });
    const urlString = `${SMSPINVERIFY_BASE}${endpoint}.php?${queryParams.toString()}`;
    const parsedUrl = new URL(urlString);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'GrizzlyBot/1.0',
      },
    };

    console.log(`[SMSPINVERIFY] Request URL: ${urlString}`);

    const request = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`[SMSPINVERIFY] Status: ${res.statusCode}, Response: ${data}`);
        resolve(data);
      });
    });

    request.on('error', (err) => {
      console.error(`[SMSPINVERIFY] Request Error: ${err.message}`);
      resolve({ error: 'NETWORK_ERROR', details: err.message });
    });

    request.end();
  });
}

async function getSmspinverifyNumber(apiKey, app = 'instagram', country = 'USA') {
  const result = await smspinverifyRequest(apiKey, 'json/get_number', {
    app: 'instagram',
    country,
    shownid: 1,
    duration: '15 minutes'
  });

  if (typeof result === 'string' && result.includes('|')) {
    const [phoneNumber, numberId] = result.split('|');
    return {
      success: true,
      numberId,
      phoneNumber,
    };
  }

  return {
    success: false,
    error: result || 'UNKNOWN_ERROR',
  };
}

async function getSmspinverifyStatus(apiKey, numberId, phoneNumber) {
  const result = await smspinverifyRequest(apiKey, 'json/get_sms', {
    n_id: numberId
  });

  if (typeof result === 'string' && result.match(/\d+\s*\d+/)) {
    const codeWithSpace = result.match(/\d+\s*\d+/)[0];
    const code = codeWithSpace.replace(/\s+/g, '');
    return { code, status: 'STATUS_OK' };
  }

  if (typeof result === 'string' && result.toLowerCase().includes('not received')) {
    return { status: 'STATUS_WAIT_CODE' };
  }

  if (typeof result === 'string' && result.toLowerCase().includes('error')) {
    return { error: result };
  }

  return { status: 'STATUS_WAIT_CODE' };
}

async function rejectSmspinverifyNumber(apiKey, numberId, phoneNumber) {
  const result = await smspinverifyRequest(apiKey, 'json/reject_code', {
    number: phoneNumber,
    n_id: numberId,
    country: 'USA',
    app: 'instagram'
  });
  return { success: !result.includes('error'), result };
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
  getHeroSmsNumber,
  getHeroSmsStatus,
  cancelHeroSmsOrder,
  finishHeroSmsOrder,
  getSmspinverifyNumber,
  getSmspinverifyStatus,
  rejectSmspinverifyNumber,
};
