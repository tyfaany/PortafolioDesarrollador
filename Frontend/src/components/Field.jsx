function Field({ label, type = 'text', name, value, onChange, placeholder }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        className="softsave-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
    </label>
  );
}

export default Field;
