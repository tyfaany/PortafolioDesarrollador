function extractFromValidationErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return '';
  }

  const firstKey = Object.keys(errors)[0];
  if (!firstKey) {
    return '';
  }

  const firstValue = errors[firstKey];
  if (Array.isArray(firstValue)) {
    return String(firstValue[0] || '').trim();
  }

  return String(firstValue || '').trim();
}

export function getApiStatus(error) {
  const status = Number(error?.response?.status);
  return Number.isFinite(status) ? status : 0;
}

const STATUS_DEFAULT_MESSAGES = {
  400: 'La solicitud no es válida. Revisa los datos e intenta de nuevo.',
  401: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe o ya fue eliminado.',
  422: 'Hay datos inválidos en el formulario. Revísalos e intenta de nuevo.',
  429: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
  500: 'Ocurrió un error interno del servidor. Intenta de nuevo.',
  503: 'El servicio no está disponible temporalmente. Intenta de nuevo más tarde.',
};

export function extractApiMessage(error, fallback = 'Ocurrió un error. Intenta de nuevo.') {
  const data = error?.response?.data;
  const backendMessage = String(data?.message || '').trim();

  if (backendMessage) {
    return backendMessage;
  }

  const validationMessage = extractFromValidationErrors(data?.errors);
  if (validationMessage) {
    return validationMessage;
  }

  if (!error?.response) {
    return 'No se pudo conectar con el servidor. Intenta de nuevo.';
  }

  return fallback;
}

export function extractApiMessageByStatus(error, fallback = 'Ocurrió un error. Intenta de nuevo.', customByStatus = {}) {
  const status = getApiStatus(error);
  const statusFallback = customByStatus[status] || STATUS_DEFAULT_MESSAGES[status] || fallback;
  return extractApiMessage(error, statusFallback);
}
