import { useEffect, useRef, useState } from "react";
import Piece from "./Piece.jsx";
import { asset, price, waLink } from "./utils.js";

// Fiche détaillée d'un produit : galerie, description, caractéristiques et contact (pas d'achat en ligne).
export default function Modal({ product, site, onClose }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const imgs = product.images || [];
  useEffect(() => { ref.current?.showModal(); }, []);
  const close = () => ref.current?.close();
  const msg = `Bonjour, je souhaite des informations sur « ${product.nom} ».`;
  return (
    <dialog ref={ref} className="modal" aria-label={product.nom} onClose={onClose} onClick={(e) => e.target === ref.current && close()}>
      <div className="modal__box">
        <button className="modal__x" onClick={close} aria-label="Fermer">×</button>
        <div className="modal__gal">
          <div className="modal__main">
            {imgs.length ? <img src={asset(imgs[i])} alt={product.nom} /> : <Piece p={product} />}
          </div>
          {imgs.length > 1 && (
            <div className="modal__thumbs">
              {imgs.map((s, n) => <button key={s} className={n === i ? "on" : ""} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`}><img src={asset(s)} alt="" /></button>)}
            </div>
          )}
        </div>
        <div className="modal__info">
          <p className="eyebrow">{product.categorie}</p>
          <h2>{product.nom}</h2>
          <p className="modal__price">{price(product.prix, site.devise)} <span className={`tag tag--${product.statut === "Épuisé" ? "off" : "on"}`}>{product.statut}</span></p>
          {product.description && <p>{product.description}</p>}
          <dl>
            {product.materiaux && <><dt>Matériaux</dt><dd>{product.materiaux}</dd></>}
            {product.dimensions && <><dt>Dimensions</dt><dd>{product.dimensions}</dd></>}
          </dl>
          <div className="modal__cta">
            {site.whatsapp && <a className="btn" href={waLink(site, msg)} target="_blank" rel="noopener noreferrer">Demander un devis</a>}
            {site.email && <a className="btn btn--line" href={`mailto:${site.email}?subject=${encodeURIComponent(product.nom)}&body=${encodeURIComponent(msg)}`}>Écrire un e-mail</a>}
          </div>
        </div>
      </div>
    </dialog>
  );
}
