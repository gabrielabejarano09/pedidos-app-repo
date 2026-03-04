const map = {
  PENDING: "badge warning",
  PAID: "badge success",
  SHIPPED: "badge info",
  CANCELED: "badge danger",
};

export default function Badge({ status }) {
  const key = String(status || "").toUpperCase();
  return <span className={map[key] || "badge"}>{key || "UNKNOWN"}</span>;
}
