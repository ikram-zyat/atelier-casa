// Ajoute le préfixe du site ("/atelier-casa/" en ligne) aux chemins du dossier public.
export const asset = (p) => (!p || /^(https?:|data:)/.test(p) ? p : import.meta.env.BASE_URL + p.replace(/^\//, ""));

export const price = (p, devise = "MAD") => (p === null || p === undefined || p === "" ? "Sur demande" : `${Number(p).toLocaleString("fr-FR")} ${devise}`);

export const waLink = (site, message) => `https://wa.me/${String(site.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

export const kind = (cat = "") => {
  const c = cat.toLowerCase();
  if (/lamp|lumin|éclair/.test(c)) return "lamp";
  if (/table|bureau/.test(c)) return "table";
  if (/rang|commode|biblio|buffet|vitrine/.test(c)) return "storage";
  return "seat";
};
