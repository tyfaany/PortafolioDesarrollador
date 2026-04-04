import PropTypes from 'prop-types';

function Field({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  autoComplete = undefined,
  icon = null,
  iconPosition = 'start',
  onIconClick = undefined,
  iconLabel = undefined,
  startIcon = null,
  endIcon = null,
  onStartIconClick = undefined,
  onEndIconClick = undefined,
  startIconLabel = undefined,
  endIconLabel = undefined,
}) {
  const resolvedStartIcon = startIcon ?? (iconPosition === 'start' ? icon : null);
  const resolvedEndIcon = endIcon ?? (iconPosition === 'end' ? icon : null);
  const resolvedStartClick = onStartIconClick ?? (iconPosition === 'start' ? onIconClick : undefined);
  const resolvedEndClick = onEndIconClick ?? (iconPosition === 'end' ? onIconClick : undefined);
  const resolvedStartLabel = startIconLabel ?? (iconPosition === 'start' ? iconLabel : undefined);
  const resolvedEndLabel = endIconLabel ?? (iconPosition === 'end' ? iconLabel : undefined);
  const hasStartIcon = Boolean(resolvedStartIcon);
  const hasEndIcon = Boolean(resolvedEndIcon);
  const startIconClass = 'auth-field__icon--start';
  const endIconClass = 'auth-field__icon--end';
  const startButtonClass = resolvedStartClick ? 'auth-field__icon--button' : '';
  const endButtonClass = resolvedEndClick ? 'auth-field__icon--button' : '';
  const wrapperClass = [
    'auth-field__control',
    hasStartIcon ? 'auth-field__control--icon-start' : '',
    hasEndIcon ? 'auth-field__control--icon-end' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className={wrapperClass}>
        {hasStartIcon && (
          resolvedStartClick ? (
            <button
              className={`auth-field__icon ${startIconClass} ${startButtonClass}`}
              type="button"
              onClick={resolvedStartClick}
              aria-label={resolvedStartLabel}
            >
              {resolvedStartIcon}
            </button>
          ) : (
            <span
              className={`auth-field__icon ${startIconClass}`}
              aria-hidden="true"
            >
              {resolvedStartIcon}
            </span>
          )
        )}
        <input
          className="softsave-input"
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {hasEndIcon && (
          resolvedEndClick ? (
            <button
              className={`auth-field__icon ${endIconClass} ${endButtonClass}`}
              type="button"
              onClick={resolvedEndClick}
              aria-label={resolvedEndLabel}
            >
              {resolvedEndIcon}
            </button>
          ) : (
            <span
              className={`auth-field__icon ${endIconClass}`}
              aria-hidden="true"
            >
              {resolvedEndIcon}
            </span>
          )
        )}
      </div>
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  autoComplete: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['start', 'end']),
  onIconClick: PropTypes.func,
  iconLabel: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  onStartIconClick: PropTypes.func,
  onEndIconClick: PropTypes.func,
  startIconLabel: PropTypes.string,
  endIconLabel: PropTypes.string,
};

export default Field;
