import { asset, kind } from "./utils.js";

const SHAPES = {
  seat: <><path d="M30 45V27a8 8 0 0 1 8-8h44a8 8 0 0 1 8 8v18" /><path d="M18 52a8 8 0 0 1 16 0v14h52V52a8 8 0 0 1 16 0v22H18z" /><path d="M28 74v10M92 74v10" /></>,
  table: <><ellipse cx="60" cy="38" rx="42" ry="9" /><path d="M60 47v32M42 82h36" /></>,
  lamp: <><path d="M36 40a24 24 0 0 1 48 0z" /><path d="M60 40v36M44 80h32" /></>,
  storage: <><rect x="24" y="22" width="72" height="52" rx="3" /><path d="M24 48h72M60 22v52M32 74v8M88 74v8" /></>,
};

// Photo du produit, ou une silhouette élégante quand il n'y a pas encore de photo.
export default function Piece({ p }) {
  if (p.images?.[0]) return <img src={asset(p.images[0])} alt={p.nom} loading="lazy" />;
  const tone = (p.id || "").length % 4;
  return (
    <div className={`ph ph--${tone}`} role="img" aria-label={p.nom}>
      <svg viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SHAPES[kind(p.categorie)]}</svg>
    </div>
  );
}
