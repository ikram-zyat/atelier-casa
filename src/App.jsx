import { useEffect, useState } from "react";
import products from "./data/products.json";
import site from "./data/site.json";
import Piece from "./Piece.jsx";
import Modal from "./Modal.jsx";
import { asset, price, waLink } from "./utils.js";

// Photo d'ambiance de l'accueil : placez une image dans public/images/hero.jpg (voir le README).
const HERO = asset("images/hero.jpg");

const Arrow = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6" /></svg>;
const parse = (h) => { const [, a = "", b = ""] = h.replace(/^#/, "").split("/"); return [a, decodeURIComponent(b)]; };
const NAV = [["collection", "Collection"], ["apropos", "À propos"], ["contact", "Contact"]];

function Card({ p }) {
  return (
    <a className="card" href={`#/produit/${p.id}`}>
      <div className="card__img"><Piece p={p} />{p.statut !== "Disponible" && <span className={`tag tag--${p.statut === "Épuisé" ? "off" : "on"} card__tag`}>{p.statut}</span>}</div>
      <h3>{p.nom}</h3>
      <p className="card__meta"><span>{p.categorie}</span><b>{price(p.prix, site.devise)}</b></p>
    </a>
  );
}

function Home() {
  const featured = products.filter((p) => p.vedette).slice(0, 3);
  return (
    <>
      <header className="hero">
        <img className="hero__img" src={HERO} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="hero__in">
          <p className="eyebrow">Conçu pour vivre avec</p>
          <h1>Du mobilier<br />avec <em>âme.</em></h1>
          <p className="hero__txt">Des pièces contemporaines, pensées avec soin, fabriquées avec des matériaux sincères et faites pour durer.</p>
          <a className="btn" href="#/collection">Découvrir la collection <Arrow /></a>
          {featured.length > 0 && (
            <div className="feat">
              <p className="eyebrow">Pièces en vedette</p>
              <div className="feat__row">
                {featured.map((p) => (
                  <a key={p.id} className="feat__card" href={`#/produit/${p.id}`}>
                    <div className="feat__img"><Piece p={p} /></div>
                    <span>{p.nom}</span><small>{price(p.prix, site.devise)}</small>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>
      <section className="sec">
        <div className="sec__head"><h2>Notre collection</h2><a className="lnk" href="#/collection">Tout voir <Arrow /></a></div>
        <div className="grid">{products.slice(0, 6).map((p) => <Card key={p.id} p={p} />)}</div>
      </section>
      <section className="band">
        <h2>Une question sur une pièce ?</h2>
        <p>Nous vous répondons avec plaisir et préparons un devis sur mesure.</p>
        <a className="btn" href="#/contact">Nous contacter <Arrow /></a>
      </section>
    </>
  );
}

function Collection({ cat }) {
  const [q, setQ] = useState("");
  const cats = [...new Set(products.map((p) => p.categorie))];
  const list = products.filter((p) => (!cat || p.categorie === cat) && `${p.nom} ${p.categorie} ${p.materiaux}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="sec sec--page">
      <h1>Collection</h1>
      <div className="tools">
        <div className="chips">
          <a className={!cat ? "on" : ""} href="#/collection">Tout</a>
          {cats.map((c) => <a key={c} className={cat === c ? "on" : ""} href={`#/collection/${encodeURIComponent(c)}`}>{c}</a>)}
        </div>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une pièce" aria-label="Rechercher une pièce" />
      </div>
      {list.length ? <div className="grid">{list.map((p) => <Card key={p.id} p={p} />)}</div> : <p className="empty">Aucune pièce ne correspond à votre recherche.</p>}
    </section>
  );
}

function About() {
  const items = [["Bois massif", "Des essences choisies pour leur tenue et leur beauté : chêne, noyer, frêne."], ["Textiles naturels", "Lin, coton et laine, pour des assises douces et durables."], ["Métal et laiton", "Des finitions sobres qui apportent de la lumière et de la précision."]];
  return (
    <section className="sec sec--page">
      <h1>À propos</h1>
      <p className="lead">{site.nom} imagine des meubles simples, confortables et faits pour durer. Chaque pièce est dessinée avec soin et réalisée avec des matériaux honnêtes, pour s'intégrer naturellement à votre intérieur.</p>
      <div className="three">{items.map(([t, d]) => <div key={t} className="box"><h3>{t}</h3><p>{d}</p></div>)}</div>
    </section>
  );
}

function Contact() {
  const send = (e) => {
    e.preventDefault();
    const d = new FormData(e.target), via = e.nativeEvent.submitter?.value;
    const msg = `Bonjour, je m'appelle ${d.get("nom")}.\n${d.get("message")}`;
    if (via === "mail") location.href = `mailto:${site.email}?subject=${encodeURIComponent("Demande d'information")}&body=${encodeURIComponent(msg)}`;
    else window.open(waLink(site, msg), "_blank", "noopener");
  };
  return (
    <section className="sec sec--page">
      <h1>Contact</h1>
      <div className="two">
        <div className="box">
          <h3>Nos coordonnées</h3>
          <ul className="info">
            {site.telephone && <li><span>Téléphone</span><a href={`tel:${site.telephone.replace(/\s/g, "")}`}>{site.telephone}</a></li>}
            {site.email && <li><span>E-mail</span><a href={`mailto:${site.email}`}>{site.email}</a></li>}
            {site.adresse && <li><span>Adresse</span>{site.adresse}</li>}
            {site.horaires && <li><span>Horaires</span>{site.horaires}</li>}
          </ul>
        </div>
        <form className="box" onSubmit={send}>
          <h3>Écrivez-nous</h3>
          <label>Votre nom<input name="nom" required autoComplete="name" /></label>
          <label>Votre message<textarea name="message" rows="5" required placeholder="Quelle pièce vous intéresse ?" /></label>
          <div className="modal__cta">
            {site.whatsapp && <button className="btn" value="wa">Envoyer par WhatsApp</button>}
            {site.email && <button className="btn btn--line" value="mail">Envoyer par e-mail</button>}
          </div>
        </form>
      </div>
    </section>
  );
}

export default function App() {
  const [hash, setHash] = useState(location.hash || "#/");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => { setHash(location.hash || "#/"); setOpen(false); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const [page, arg] = parse(hash);
  const product = page === "produit" ? products.find((p) => p.id === arg) : null;
  const view = page === "collection" ? <Collection cat={arg} /> : page === "apropos" ? <About /> : page === "contact" ? <Contact /> : page === "produit" ? <Collection cat="" /> : <Home />;

  return (
    <>
      <nav className="top">
        <a className="logo" href="#/">{site.nom}</a>
        <button className="burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">☰</button>
        <div className={`menu ${open ? "menu--open" : ""}`}>
          {NAV.map(([k, t]) => <a key={k} href={`#/${k}`} className={page === k ? "on" : ""}>{t}</a>)}
        </div>
        <a className="top__cta" href="#/contact">Nous contacter</a>
      </nav>
      <main>{view}</main>
      <footer className="foot">
        <b>{site.nom}</b>
        <span>{[site.adresse, site.telephone, site.email].filter(Boolean).join(" · ")}</span>
        <span>© {new Date().getFullYear()} {site.nom}. Tous droits réservés.</span>
      </footer>
      {product && <Modal key={product.id} product={product} site={site} onClose={() => { location.hash = "#/collection"; }} />}
    </>
  );
}
