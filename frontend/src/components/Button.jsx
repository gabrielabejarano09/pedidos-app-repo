export default function Button({
  children,
  variant = "primary",
  size = "md",
  ...props
}) {
  return (
    <button className={`btn ${variant} ${size}`} {...props}>
      {children}
    </button>
  );
}
