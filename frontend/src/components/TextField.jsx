export default function TextField({ label, hint, ...props }) {
  return (
    <label className="field">
      <span className="fieldLabel">{label}</span>
      <input className="input" {...props} />
      {hint ? <span className="fieldHint">{hint}</span> : null}
    </label>
  );
}
