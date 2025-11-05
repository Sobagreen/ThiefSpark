# Mirror Fight Prototype

Interactive prototype of the "Mirror Fight" roguelike card battler. The repository contains:

- `server.js` – a minimal Node.js + `ws` WebSocket host that also serves the static client.
- `public/` – the browser client (pure HTML/CSS/JS) with the entire UI flow, PvE encounters and PvP support.
- `index.html` – a tiny redirect helper so the project can be published unchanged on GitHub Pages.

## Running locally

```bash
npm install
node server.js
```

Then open [http://localhost:8787](http://localhost:8787). The Node server serves everything from
`/public` and exposes the WebSocket endpoint on the same port.

## Publishing on GitHub Pages

1. Push the repository to GitHub.
2. In the repository settings enable **GitHub Pages** for the `main` branch using the `/` (root)
   directory.
3. Visit `https://<username>.github.io/ThiefSpark/` – the root `index.html` will redirect the browser
   to `public/index.html`, and the client will automatically connect to the shared multiplayer server.

The static assets are self-contained; no build step is required. The PvP features rely on the hosted
WebSocket service, so the page can run entirely from GitHub Pages.

## Choosing a WebSocket endpoint

The browser defaults to `wss://mazepark-1.onrender.com`. You can override it via a query string:

- `?ws=local` – connect to a locally running `server.js` (uses `ws://localhost:8787` or `wss://` if
  the page itself is served over HTTPS on the same host).
- `?ws=wss://example.com/socket` – connect to an arbitrary endpoint.

The active endpoint is shown on the start screen so players know where the multiplayer session is
hosted.
