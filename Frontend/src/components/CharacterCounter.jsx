import PropTypes from 'prop-types';

function CharacterCounter({ value, maxLength, currentLength = null, className = '' }) {
  if (maxLength === null || maxLength === undefined || maxLength === '') {
    return null;
  }

  const resolvedLength = currentLength === null || currentLength === undefined
    ? String(value ?? '').length
    : currentLength;
  const resolvedClassName = ['softsave-input-counter', className].filter(Boolean).join(' ');

  return (
    <span className={resolvedClassName} aria-live="polite">
      {resolvedLength}/{maxLength}
    </span>
  );
}

CharacterCounter.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

export default CharacterCounter;
