const responseHandler = (req, res, next) => {
  const handleResponse = (status, message, error = null, data = null) => {
    const response = { message };
    if (error) response.error = error;
    if (data) response.data = data;
    res.status(status).json(response);
  };

  const statuses = {
    100: 'Continue',
    101: 'Switching protocols',
    102: 'Processing',
    200: 'Success',
    201: 'Resource created',
    202: 'Accepted',
    204: 'No content',
    206: 'Partial content',
    300: 'Multiple choices',
    301: 'Moved permanently',
    302: 'Found',
    303: 'See other',
    304: 'Not modified',
    305: 'Use proxy',
    306: 'Switch proxy', 
    307: 'Temporary redirect',
    308: 'Permanent redirect',
    400: 'Bad request',
    401: 'Unauthorized',
    402: 'Payment required',
    403: 'Forbidden',
    404: 'Not found',
    405: 'Method not allowed',
    406: 'Not acceptable',
    407: 'Proxy authentication required',
    408: 'Request timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length required',
    412: 'Precondition failed',
    413: 'Payload too large',
    414: 'URI too long',
    415: 'Unsupported media type',
    416: 'Range not satisfiable',
    417: 'Expectation failed',
    418: 'I\'m a teapot', 
    421: 'Misdirected request',
    422: 'Unprocessable entity',
    423: 'Locked',
    424: 'Failed dependency',
    425: 'Too early',
    426: 'Upgrade required',
    428: 'Precondition required',
    429: 'Too many requests',
    431: 'Request header fields too large',
    451: 'Unavailable for legal reasons',
    500: 'Internal server error',
    501: 'Not implemented',
    502: 'Bad gateway',
    503: 'Service unavailable',
    504: 'Gateway timeout',
    505: 'HTTP version not supported',
    506: 'Variant also negotiates',
    507: 'Insufficient storage',
    508: 'Loop detected',
    510: 'Not extended',
  };

  for (const [statusCode, defaultMessage] of Object.entries(statuses)) {
    res[defaultMessage.replace(/\s+/g, '')] = (data, message = defaultMessage) => {
      handleResponse(Number(statusCode), message, null, data);
    };
  }

  res.error = (status, message, error) => handleResponse(status, message, error);

  next();
};

module.exports = responseHandler;