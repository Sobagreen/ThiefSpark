# Mirror Fight Prototype

This repository contains the "Mirror Fight" WebSocket prototype described in the pull request.

## Why the GitHub link does not "run" the game

The project is not a static web page that GitHub Pages can host directly. It depends on a Node.js
server (see `server.js`) that must be running so the browser can open a WebSocket connection. When
you only upload the source code to GitHub, no server process is started automatically, so the link
you shared simply shows the repository instead of launching the application.

To try the game you (or reviewers) need to clone the repository locally and run the Node server:

```bash
npm install
node server.js
```

Then open a browser at [http://localhost:8787](http://localhost:8787). The server hosts the static
client from `/public` and handles WebSocket traffic on the same port. Without that server running,
opening the HTML file directly or visiting the GitHub repository URL will not work because the
WebSocket endpoint `ws://localhost:8787` is unreachable.

## Using the hosted multiplayer server

By default the client now connects to the shared production socket at
`wss://mazepark-1.onrender.com`, which is the same service used by the previous prototype. You can
override this by appending `?ws=local` (to force a connection to your locally running `server.js`) or
`?ws=wss://example.com` (to test against a different endpoint) when opening `index.html`.

## Project structure

```
server.js
public/
  index.html
  styles.css
  main.js
```

The server serves the files under `public/` and coordinates PvP rooms via WebSockets.
