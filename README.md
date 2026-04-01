# QR Generator (rabiegadevelopment.pl)

Monorepo: **`apps/web`** — generator kodów QR (Vite, TypeScript, Tailwind CSS v4, [qr-code-styling](https://github.com/kozakdenys/qr-code-styling)); **`apps/api`** — szkielet NestJS pod przyszłe API lub serwowanie statyczne przy self-hostingu.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Serwer dev: [http://localhost:5173](http://localhost:5173) (Vite).

### Tylko backend (Nest)

```bash
cd apps/api
npm run start:dev
```

## Hosting pod własną domeną

| Platforma | Kiedy ma sens |
|-----------|----------------|
| **Vercel** / **Netlify** / **Cloudflare Pages** | Tanio i szybko dla samego frontu (ten projekt nie wymaga backendu do generowania QR). W panelu ustaw **katalog główny** projektu na `apps/web`, komenda build: `npm run build`, katalog wyjściowy: `dist`. Podłącz domenę w ustawieniach DNS dostawcy. |
| **Cloudflare Pages** | Bardzo dobre CDN i limit pod podstawowe strony statyczne. |
| **VPS + Caddy/nginx** | Pełna kontrola; możesz serwować `apps/web/dist` jako statyczne pliki lub dodać reverse proxy do Nest. |

**Propozycja:** na start wdrożenie **tylko `apps/web`** na Vercel lub Cloudflare Pages — zero serwera, najniższy koszt, własna domena w kilka minut. NestJS warto dodać, gdy pojawi się realna potrzeba API (konta, szablony po stronie serwera, analityka).

W repozytorium jest przykładowy `vercel.json` przy **korzeniu** repo (build z `apps/web`). Jeśli w Vercel ustawisz **Root Directory** na `apps/web`, możesz usunąć lub zignorować ten plik i polegać na ustawieniach UI.

## CI/CD

- **GitHub:** `.github/workflows/ci.yml` — build frontu i test + build API przy push/PR na `main`/`master`.
- **GitLab:** `.gitlab-ci.yml` — analogicznie (dostosuj reguły gałęzi pod swój flow).

Powielanie na GitHub i GitLab: dodaj dwa remotes (`origin` + `gitlab`) i `git push` na oba albo użyj mirror — pipeline uruchomi się osobno w każdej platformie.

## Skrypty (root `package.json`)

- `npm run dev` — front dev
- `npm run build` — build frontu
- `npm run build:all` — front + Nest
- `npm run test` — testy Nest

## Technologie (zgodnie z założeniami)

- HTML, **Tailwind CSS**, **TypeScript**, **Vite**
- **qr-code-styling** — podgląd na żywo i eksport
- **NestJS** — przygotowany pod rozszerzenia serwerowe
