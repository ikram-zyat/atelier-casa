// Petit serveur de l'espace admin : actif uniquement avec « npm run dev » / « npm run admin ».
// Il lit et écrit les fichiers du catalogue (src/data) et les photos (public/images/products).
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const STATUTS = ["Disponible", "Sur commande", "Épuisé"];
const text = (v, n = 2000) => (v == null ? "" : String(v).trim().slice(0, n));
const slug = (s) => text(s, 80).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "produit";
const derive = (pw, salt) => pbkdf2Sync(pw, salt, 200000, 64, "sha512").toString("hex");
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export default function adminApi() {
  const ROOT = process.cwd();
  const AUTH = join(ROOT, ".admin-auth.json");
  const DATA = join(ROOT, "src/data/products.json");
  const SITE = join(ROOT, "src/data/site.json");
  const IMG = join(ROOT, "public/images/products");
  const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return d; } };
  const writeJson = (f, v) => writeFileSync(f, JSON.stringify(v, null, 2) + "\n");
  const sessions = new Map();
  const fails = { n: 0, until: 0 };

  const send = (res, code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
  const token = (req) => (req.headers.cookie || "").split(";").map((s) => s.trim()).find((s) => s.startsWith("atelier_admin="))?.slice(14);
  const authed = (req) => { const t = token(req), e = t && sessions.get(t); if (!e) return false; if (e < Date.now()) { sessions.delete(t); return false; } return true; };
  const open = (res) => { const t = randomBytes(32).toString("hex"); sessions.set(t, Date.now() + 8 * 3600e3); res.setHeader("Set-Cookie", `atelier_admin=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`); };
  const body = (req) => new Promise((ok, ko) => {
    const parts = []; let n = 0;
    req.on("data", (c) => { n += c.length; if (n > 50e6) { ko(new Error("Fichier trop volumineux")); req.destroy(); } else parts.push(c); });
    req.on("end", () => { try { ok(JSON.parse(Buffer.concat(parts).toString() || "{}")); } catch { ko(new Error("Requête invalide")); } });
  });

  return {
    name: "atelier-admin",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__admin", async (req, res) => {
        try {
          const host = req.headers.host || "";
          if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return send(res, 403, { error: "Accès refusé" });
          if (req.method !== "GET" && req.headers.origin && req.headers.origin !== `http://${host}`) return send(res, 403, { error: "Accès refusé" });
          const url = new URL(req.url, "http://x");
          const route = `${req.method} ${url.pathname}`;

          if (route === "GET /status") return send(res, 200, { configured: existsSync(AUTH), loggedIn: authed(req) });

          if (route === "POST /setup") {
            if (existsSync(AUTH)) return send(res, 409, { error: "Un accès existe déjà." });
            const { email, password } = await body(req);
            if (!String(email).includes("@")) return send(res, 400, { error: "E-mail invalide." });
            if (String(password).length < 12) return send(res, 400, { error: "Le mot de passe doit contenir au moins 12 caractères." });
            const salt = randomBytes(16).toString("hex");
            writeJson(AUTH, { email: String(email).trim().toLowerCase(), salt, hash: derive(String(password), salt) });
            open(res); return send(res, 200, { ok: true });
          }

          if (route === "POST /login") {
            if (Date.now() < fails.until) return send(res, 429, { error: "Trop d'essais. Réessayez dans 15 minutes." });
            const { email, password } = await body(req);
            const a = readJson(AUTH, null);
            const ok = a && String(email).trim().toLowerCase() === a.email && same(derive(String(password), a.salt), a.hash);
            if (!ok) { if (++fails.n >= 5) { fails.n = 0; fails.until = Date.now() + 15 * 60e3; } return send(res, 401, { error: "E-mail ou mot de passe incorrect." }); }
            fails.n = 0; open(res); return send(res, 200, { ok: true });
          }

          if (route === "POST /logout") { sessions.delete(token(req)); res.setHeader("Set-Cookie", "atelier_admin=; Max-Age=0; Path=/"); return send(res, 200, { ok: true }); }

          if (!authed(req)) return send(res, 401, { error: "Non connecté" });

          if (route === "GET /data") return send(res, 200, { products: readJson(DATA, []), site: readJson(SITE, {}) });

          if (route === "POST /product") {
            const { product: p = {}, newImages = [] } = await body(req);
            const list = readJson(DATA, []);
            const old = list.find((x) => x.id === p.id);
            const nom = text(p.nom, 120);
            if (!nom) throw new Error("Le nom est obligatoire.");
            let id = old ? old.id : slug(nom);
            if (!old) { const base = id; let i = 2; while (list.some((x) => x.id === id)) id = `${base}-${i++}`; }
            const prefix = `/images/products/${id}/`;
            const before = old?.images || [];
            const images = (Array.isArray(p.images) ? p.images : []).filter((i) => before.includes(i));
            for (const i of before) if (!images.includes(i) && i.startsWith(prefix) && !i.includes("..")) rmSync(join(ROOT, "public", i), { force: true });
            for (const d of newImages.slice(0, 10)) {
              const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(d));
              if (!m) continue;
              const buf = Buffer.from(m[1], "base64");
              if (buf.length > 8e6) continue;
              mkdirSync(join(IMG, id), { recursive: true });
              const name = `${Date.now()}-${randomBytes(3).toString("hex")}.jpg`;
              writeFileSync(join(IMG, id, name), buf);
              images.push(prefix + name);
            }
            const prixNum = p.prix === "" || p.prix == null ? null : Number(p.prix);
            const out = {
              id, nom, categorie: text(p.categorie, 60) || "Divers",
              prix: prixNum == null || Number.isNaN(prixNum) ? null : Math.max(0, prixNum),
              statut: STATUTS.includes(p.statut) ? p.statut : "Disponible",
              description: text(p.description), materiaux: text(p.materiaux, 200), dimensions: text(p.dimensions, 200),
              vedette: !!p.vedette, images,
            };
            writeJson(DATA, old ? list.map((x) => (x.id === id ? out : x)) : [...list, out]);
            return send(res, 200, { product: out });
          }

          if (route === "DELETE /product") {
            const id = url.searchParams.get("id") || "";
            if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Identifiant invalide.");
            writeJson(DATA, readJson(DATA, []).filter((x) => x.id !== id));
            rmSync(join(IMG, id), { recursive: true, force: true });
            return send(res, 200, { ok: true });
          }

          if (route === "POST /site") {
            const s = await body(req);
            const out = {
              nom: text(s.nom, 60) || "Atelier", telephone: text(s.telephone, 30), whatsapp: text(s.whatsapp, 20).replace(/\D/g, ""),
              email: text(s.email, 120), adresse: text(s.adresse, 200), horaires: text(s.horaires, 120), devise: text(s.devise, 6) || "MAD",
            };
            writeJson(SITE, out);
            return send(res, 200, { site: out });
          }

          send(res, 404, { error: "Introuvable" });
        } catch (e) { send(res, 400, { error: e.message }); }
      });
    },
  };
}
