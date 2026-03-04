import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Plus, RefreshCw, Search } from "lucide-react";

import { OrdersAPI } from "./api/orders.js";
import Card from "./components/Card.jsx";
import Button from "./components/Button.jsx";
import Modal from "./components/Modal.jsx";
import TextField from "./components/TextField.jsx";
import OrdersTable from "./components/OrdersTable.jsx";
import EmptyState from "./components/EmptyState.jsx";
import StatCard from "./components/StatCard.jsx";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "CANCELED"];

export default function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    total: "",
    status: "PENDING",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await OrdersAPI.list();
      // Si tu API devuelve createdAt como Date, en JSON llega como string ISO: ok.
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(`No se pudo cargar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return orders
      .filter((o) =>
        status === "ALL" ? true : String(o.status).toUpperCase() === status
      )
      .filter((o) =>
        query
          ? String(o.customer || "")
              .toLowerCase()
              .includes(query) || String(o.id || "").includes(query)
          : true
      )
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [orders, q, status]);

  const metrics = useMemo(() => {
    const total = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const byStatus = orders.reduce((acc, o) => {
      const s = String(o.status || "").toUpperCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return { total, byStatus, count: orders.length };
  }, [orders]);

  async function createOrder(e) {
    e.preventDefault();
    const customer = form.customer.trim();
    const total = Number(form.total);

    if (!customer) return toast.error("Escribe el nombre del cliente.");
    if (!Number.isFinite(total) || total <= 0)
      return toast.error("Total inválido.");

    const payload = {
      customer,
      total,
      status: form.status,
    };

    const t = toast.loading("Creando pedido...");
    try {
      await OrdersAPI.create(payload);
      toast.success("Pedido creado ✅", { id: t });
      setOpen(false);
      setForm({ customer: "", total: "", status: "PENDING" });
      await load();
    } catch (e2) {
      toast.error(`Error creando: ${e2.message}`, { id: t });
    }
  }

  async function deleteOrder(id) {
    const t = toast.loading("Eliminando...");
    try {
      await OrdersAPI.remove(id);
      toast.success("Eliminado", { id: t });
      setOrders((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(`No se pudo eliminar: ${e.message}`, { id: t });
    }
  }

  return (
    <div className="app">
      <Toaster position="top-right" />
      <header className="topbar">
        <div className="brand">
          <div className="logo">O</div>
          <div>
            <div className="brandTitle">Orders</div>
            <div className="brandSub">
              Panel de pedidos (Frontend + API + Postgres)
            </div>
          </div>
        </div>

        <div className="actions">
          <Button variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw size={16} />
            Recargar
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nuevo pedido
          </Button>
        </div>
      </header>

      <main className="container">
        <div className="grid3">
          <StatCard
            title="Pedidos"
            value={metrics.count}
            sub="Total registrados"
          />
          <StatCard
            title="Facturación"
            value={metrics.total.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
            })}
            sub="Suma de totales"
          />
          <StatCard
            title="En curso"
            value={
              (metrics.byStatus.PENDING || 0) + (metrics.byStatus.SHIPPED || 0)
            }
            sub="Pendientes + Enviados"
          />
        </div>

        <Card className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Pedidos</div>
            <div className="filters">
              <div className="search">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por cliente o ID…"
                />
              </div>

              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">Todos</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="skeleton">
              <div className="skLine" />
              <div className="skLine" />
              <div className="skLine" />
              <div className="skLine" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onCreate={() => setOpen(true)} />
          ) : (
            <OrdersTable rows={filtered} onDelete={deleteOrder} />
          )}
        </Card>
      </main>

      <Modal
        open={open}
        title="Crear nuevo pedido"
        onClose={() => setOpen(false)}
      >
        <form className="form" onSubmit={createOrder}>
          <TextField
            label="Cliente"
            placeholder="Ej: Juan Pérez"
            value={form.customer}
            onChange={(e) =>
              setForm((p) => ({ ...p, customer: e.target.value }))
            }
          />

          <TextField
            label="Total (COP)"
            placeholder="Ej: 150000"
            type="number"
            min="1"
            value={form.total}
            onChange={(e) => setForm((p) => ({ ...p, total: e.target.value }))}
            hint="Se guarda como número (float) en la base de datos."
          />

          <label className="field">
            <span className="fieldLabel">Estado</span>
            <select
              className="select"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="formActions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
