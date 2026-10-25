# Atelier Casa — site vitrine de mobilier

Site vitrine (React + Vite) pour une boutique d'ameublement. **Il n'y a pas d'achat en ligne** : les visiteurs découvrent la collection puis demandent un devis par WhatsApp ou par e-mail.

**Site en ligne :** https://VOTRE-NOM.github.io/atelier-casa/

## Fonctionnalités
- Accueil avec pièces en vedette, collection filtrable par catégorie et recherche, fiche détaillée de chaque produit (photos, matériaux, dimensions, disponibilité)
- Contact par WhatsApp ou e-mail, pages « À propos » et « Contact »
- **Espace d'administration** : ajouter, modifier et supprimer des produits avec leurs photos, choisir la photo principale, mettre des pièces en vedette, modifier les informations de la boutique

## Technologies
React 18, Vite 5, CSS, GitHub Actions et GitHub Pages.

## Démarrer
```bash
npm install
npm run dev        # le site : http://localhost:5173
npm run admin      # l'espace admin : http://localhost:5173/admin.html
```
À la première ouverture de l'admin, vous choisissez votre e-mail et un mot de passe (12 caractères minimum). Ils sont enregistrés dans `.admin-auth.json`, un fichier qui n'est jamais publié. Mot de passe oublié : supprimez ce fichier et relancez `npm run admin`.

## Mettre à jour le catalogue en ligne
1. `npm run admin`, puis ajoutez ou modifiez vos produits.
2. `npm run publish` : le site est mis à jour en 1 à 2 minutes.

## Sécurité
L'admin n'existe que sur votre ordinateur (pendant `npm run dev` / `npm run admin`). Il n'est **jamais publié** avec le site : personne d'autre ne peut y accéder en ligne. Le mot de passe est enregistré sous forme d'empreinte (PBKDF2), jamais en clair.

## Photo de l'accueil
Ajoutez une photo d'ambiance sous le nom `public/images/hero.jpg` (format paysage, environ 1920 px de large). Sans photo, un fond beige s'affiche à la place.
