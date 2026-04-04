import PropTypes from 'prop-types';

function Field({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  iconPosition = 'start',
  onIconClick,
  iconLabel,
}) {
  const hasIcon = Boolean(icon);
  const iconClass = iconPosition === 'end' ? 'auth-field__icon--end' : 'auth-field__icon--start';
  const buttonClass = onIconClick ? 'auth-field__icon--button' : '';
  const wrapperClass = [
    'auth-field__control',
    hasIcon ? `auth-field__control--icon-${iconPosition}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className={wrapperClass}>
        {hasIcon && iconPosition === 'start' && (
          <button
            className={`auth-field__icon ${iconClass} ${buttonClass}`}
            type="button"
            onClick={onIconClick}
            aria-label={iconLabel}
            aria-hidden={onIconClick ? 'false' : 'true'}
          >
            {icon}
          </button>
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
        {hasIcon && iconPosition === 'end' && (
          <button
            className={`auth-field__icon ${iconClass} ${buttonClass}`}
            type="button"
            onClick={onIconClick}
            aria-label={iconLabel}
            aria-hidden={onIconClick ? 'false' : 'true'}
          >
            {icon}
          </button>
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
};

Field.defaultProps = {
  type: 'text',
  placeholder: '',
  autoComplete: undefined,
  icon: null,
  iconPosition: 'start',
  onIconClick: undefined,
  iconLabel: undefined,
};

export default Field;
