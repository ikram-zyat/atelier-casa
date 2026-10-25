import { useEffect, useState } from "react";

const STATUTS = ["Disponible", "Sur commande", "Épuisé"];
const EMPTY = { id: null, nom: "", categorie: "", prix: "", statut: "Disponible", description: "", materiaux: "", dimensions: "", vedette: false, images: [] };

const api = async (path, opts = {}) => {
  const r = await fetch("/__admin" + path, { credentials: "same-origin", method: opts.method || "GET", headers: { "Content-Type": "application/json" }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Erreur");
  return d;
};

// Réduit une photo à 1600 px de large (JPEG) avant l'envoi.
const resize = (file) => new Promise((ok, ko) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const s = Math.min(1, 1600 / img.width), c = document.createElement("canvas");
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", 0.85));
  };
  img.onerror = () => ko(new Error("Image illisible"));
  img.src = url;
});

function Auth({ setup, done }) {
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (setup && d.password !== d.confirm) return setErr("Les deux mots de passe ne sont pas identiques.");
    try { await api(setup ? "/setup" : "/login", { method: "POST", body: { email: d.email, password: d.password } }); done(); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="auth card">
      <h1>{setup ? "Créer votre accès" : "Connexion"}</h1>
      <p className="mute">{setup ? "Première utilisation : choisissez votre e-mail et un mot de passe de 12 caractères minimum. Cet accès reste sur votre ordinateur." : "Espace d'administration du catalogue."}</p>
      <form onSubmit={submit}>
        <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
        <label>Mot de passe<input name="password" type="password" autoComplete={setup ? "new-password" : "current-password"} minLength={setup ? 12 : undefined} required /></label>
        {setup && <label>Confirmer le mot de passe<input name="confirm" type="password" autoComplete="new-password" required /></label>}
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn">{setup ? "Créer mon accès" : "Se connecter"}</button>
      </form>
    </div>
  );
}

function ProductForm({ start, cats, saved, cancel }) {
  const [f, setF] = useState(start);
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const first = (src) => setF({ ...f, images: [src, ...f.images.filter((x) => x !== src)] });
  const drop = (src) => setF({ ...f, images: f.images.filter((x) => x !== src) });
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const newImages = await Promise.all(files.map(resize));
      await api("/product", { method: "POST", body: { product: f, newImages } });
      saved();
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <form className="card" onSubmit={save}>
      <div className="grid">
        <label>Nom du produit<input value={f.nom} onChange={set("nom")} required /></label>
        <label>Catégorie<input list="cats" value={f.categorie} onChange={set("categorie")} placeholder="Fauteuils, Tables…" required /><datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></label>
        <label>Prix (laisser vide pour « Sur demande »)<input type="number" min="0" value={f.prix ?? ""} onChange={set("prix")} /></label>
        <label>Disponibilité<select value={f.statut} onChange={set("statut")}>{STATUTS.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="full">Description<textarea rows="4" value={f.description} onChange={set("description")} /></label>
        <label>Matériaux<input value={f.materiaux} onChange={set("materiaux")} placeholder="Chêne massif, lin" /></label>
        <label>Dimensions<input value={f.dimensions} onChange={set("dimensions")} placeholder="L 78 × P 82 × H 76 cm" /></label>
        <label className="chk full"><input type="checkbox" checked={f.vedette} onChange={set("vedette")} />Mettre en vedette sur l'accueil (les 3 premières pièces en vedette s'affichent)</label>
        <div className="full">
          <p className="mute">Photos : la première sert de photo principale.</p>
          <div className="imgs">
            {f.images.map((s, n) => (
              <figure key={s}><img src={s} alt="" />
                <button type="button" className="btn btn--ghost" disabled={n === 0} onClick={() => first(s)}>{n === 0 ? "Principale" : "Mettre en premier"}</button>
                <button type="button" className="btn btn--ghost" onClick={() => drop(s)}>Retirer</button></figure>
            ))}
          </div>
          <label>Ajouter des photos<input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} /></label>
        </div>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="row"><button className="btn" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button><button type="button" className="btn btn--ghost" onClick={cancel}>Annuler</button></div>
    </form>
  );
}

function SiteForm({ site }) {
  const [f, setF] = useState(site);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); try { await api("/site", { method: "POST", body: f }); setMsg("Enregistré."); } catch (x) { setMsg(x.message); } };
  const fields = [["nom", "Nom de la boutique"], ["telephone", "Téléphone"], ["whatsapp", "Numéro WhatsApp (chiffres, avec l'indicatif : 212600000000)"], ["email", "E-mail"], ["adresse", "Adresse"], ["horaires", "Horaires"], ["devise", "Devise (MAD, EUR…)"]];
  return (
    <form className="card" onSubmit={save}>
      <div className="grid">{fields.map(([k, l]) => <label key={k} className={k === "whatsapp" ? "full" : ""}>{l}<input value={f[k] || ""} onChange={set(k)} /></label>)}</div>
      <div className="row"><button className="btn">Enregistrer</button>{msg && <p className="ok">{msg}</p>}</div>
    </form>
  );
}

export default function Admin() {
  const [state, setState] = useState("loading");
  const [tab, setTab] = useState("produits");
  const [data, setData] = useState({ products: [], site: {} });
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => { try { setData(await api("/data")); setState("ready"); } catch { setState("login"); } };
  useEffect(() => {
    api("/status").then((s) => (!s.configured ? setState("setup") : s.loggedIn ? load() : setState("login"))).catch(() => setState("login"));
  }, []);

  const del = async (p) => {
    if (!window.confirm(`Supprimer « ${p.nom} » et ses photos ?`)) return;
    try { await api(`/product?id=${encodeURIComponent(p.id)}`, { method: "DELETE" }); await load(); setMsg("Produit supprimé."); } catch (x) { setMsg(x.message); }
  };
  const logout = async () => { await api("/logout", { method: "POST" }); setState("login"); };

  if (state === "loading") return <div className="wrap"><p>Chargement…</p></div>;
  if (state === "setup") return <Auth setup done={load} />;
  if (state === "login") return <Auth done={load} />;

  const cats = [...new Set(data.products.map((p) => p.categorie))];
  return (
    <div className="wrap">
      <div className="bar"><h1>Administration du catalogue</h1><a className="btn btn--ghost" href="/" target="_blank" rel="noopener">Voir le site</a><button className="btn btn--ghost" onClick={logout}>Se déconnecter</button></div>
      <div className="tabs"><button className={tab === "produits" ? "on" : ""} onClick={() => { setTab("produits"); setEdit(null); }}>Produits</button><button className={tab === "site" ? "on" : ""} onClick={() => setTab("site")}>Informations du site</button></div>
      {tab === "site" ? <SiteForm site={data.site} /> : edit ? (
        <ProductForm key={edit.id || "new"} start={edit} cats={cats} cancel={() => setEdit(null)} saved={async () => { setEdit(null); await load(); setMsg("Produit enregistré. Pour le mettre en ligne : npm run publish."); }} />
      ) : (
        <div className="card">
          <div className="bar"><p className="mute" style={{ margin: 0 }}>{data.products.length} produit{data.products.length > 1 ? "s" : ""}</p><button className="btn" onClick={() => setEdit({ ...EMPTY })}>Ajouter un produit</button></div>
          {msg && <p className="ok">{msg}</p>}
          <table>
            <thead><tr><th></th><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Disponibilité</th><th>Vedette</th><th></th></tr></thead>
            <tbody>{data.products.map((p) => (
              <tr key={p.id}>
                <td>{p.images[0] ? <img className="thumb" src={p.images[0]} alt="" /> : <span className="thumb" />}</td>
                <td>{p.nom}</td><td>{p.categorie}</td><td>{p.prix == null ? "Sur demande" : `${p.prix} ${data.site.devise || ""}`}</td><td>{p.statut}</td><td>{p.vedette ? "★" : ""}</td>
                <td className="acts"><button className="btn btn--ghost btn--sm" onClick={() => setEdit({ ...EMPTY, ...p })}>Modifier</button><button className="btn btn--red btn--sm" onClick={() => del(p)}>Supprimer</button></td>
              </tr>
            ))}</tbody>
          </table>
          {data.products.length === 0 && <p className="mute">Aucun produit. Cliquez sur « Ajouter un produit ».</p>}
        </div>
      )}
    </div>
  );
}
