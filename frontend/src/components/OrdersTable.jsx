import Badge from "./Badge.jsx";
import Button from "./Button.jsx";
import { Trash2 } from "lucide-react";

export default function OrdersTable({ rows, onDelete }) {
  return (
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td className="mono">#{o.id}</td>
              <td>{o.customer}</td>
              <td className="mono">
                {Number(o.total || 0).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                })}
              </td>
              <td>
                <Badge status={o.status} />
              </td>
              <td className="muted">
                {o.createdAt
                  ? new Date(o.createdAt).toLocaleString("es-CO")
                  : "—"}
              </td>
              <td className="right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(o.id)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
