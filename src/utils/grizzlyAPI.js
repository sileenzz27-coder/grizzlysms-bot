const https = require('https');

const API_BASE = 'https://api.grizzlysms.com/stubs/handler_api.php';

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

function getErrorMessage(error) {
  const messages = {
    NO_NUMBERS: 'No numbers available right now. Try again in a few minutes.',
    NO_BALANCE: 'Insufficient balance on the account. Contact an admin.',
    BAD_KEY: 'Invalid API key. Contact an admin.',
    BAD_SERVICE: 'Invalid service configuration. Contact an admin.',
    SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Try again later.',
    NETWORK_ERROR: 'Network error. Try again in a moment.',
    UNKNOWN_ERROR: 'An unknown error occurred. Contact an admin.',
  };

  return messages[error] || messages.UNKNOWN_ERROR;
}

module.exports = { getNumber, getStatus, setStatus, getErrorMessage };
