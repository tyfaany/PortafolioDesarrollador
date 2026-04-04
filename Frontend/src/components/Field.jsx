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
            className={`auth-field__icon ${iconClass}`}
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
            className={`auth-field__icon ${iconClass}`}
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

export default Field;
