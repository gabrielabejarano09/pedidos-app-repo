import Card from "./Card.jsx";

export default function StatCard({ title, value, sub }) {
  return (
    <Card className="statCard">
      <div className="statTitle">{title}</div>
      <div className="statValue">{value}</div>
      <div className="statSub">{sub}</div>
    </Card>
  );
}
