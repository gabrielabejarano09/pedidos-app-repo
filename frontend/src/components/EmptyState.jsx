import Button from "./Button.jsx";

export default function EmptyState({ onCreate }) {
  return (
    <div className="empty">
      <div className="emptyTitle">Aún no hay pedidos</div>
      <div className="emptyText">
        Crea tu primer pedido para empezar a ver métricas y estado.
      </div>
      <Button onClick={onCreate}>Crear pedido</Button>
    </div>
  );
}
