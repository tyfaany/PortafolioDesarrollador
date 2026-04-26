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
