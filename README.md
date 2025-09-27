# P2P ChatApp

Simple React + Vite chat application with WebRTC calling and a small signaling server. Built with TypeScript, Tailwind CSS and Capacitor scaffolding for mobile support.

This README explains how to set up, run and build the project on macOS (or Linux/Windows with equivalent commands).

## Key features

- One-to-one chat UI with message bubbles and sidebar.
- WebRTC-based audio/video calling with a small Node.js WebSocket signaling server (`server/signaling.js`).
- Uses Vite, React (TypeScript), Tailwind CSS  components.
- Ready for Capacitor mobile packaging (Android / iOS) if you want to build a native wrapper.

## Prerequisites

- Node.js (v16+) and npm, yarn, pnpm or bun. This repo includes a `bun.lockb` if you prefer bun.
- (Optional) Capacitor CLI if you plan to build/install mobile apps: `npm install -g @capacitor/cli`.

## Install

Clone the repository and install dependencies. Example using npm:

```bash
git clone <your-repo-url>
cd chatapp
npm install
```

If you use bun:

```bash
bun install
```

## Available scripts

The project scripts are defined in `package.json`. Common ones you'll use:

- `npm run dev` — Starts the Vite dev server (web app) on host, default port 8080.
- `npm run dev:call` — Starts Vite on port 5174 (alternate dev mode used for call testing).
- `npm run build` — Produces a production build with Vite.
- `npm run build:dev` — Build with the `development` mode.
- `npm run preview` — Preview the production build locally.
- `npm run lint` — Run ESLint across the codebase.
- `npm run signaling` — Start the signaling server (Node.js) on port 8081 by default.

Run the web app in development:

```bash
npm run dev
```

Start the signaling server in a separate terminal (required for WebRTC call signaling):

```bash
npm run signaling
```

Notes:
- If you prefer a different package manager substitute `npm` with `yarn`, `pnpm`, or `bun`.
- The signaling script sets PORT=8081 and runs `node server/signaling.js`.

## Project structure (important files)

- `src/` — Frontend source (React + TypeScript).
  - `components/` — UI components (chat area, sidebar, call UI, auth flows).
  - `contexts/` — React context providers for auth, calls, notifications.
  - `services/WebRTCService.ts` — WebRTC helper logic.
- `server/signaling.js` — Minimal WebSocket signaling server used for WebRTC offer/answer exchange.
- `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts` — build and styling configuration.

## How to test calls locally

1. Start the Vite dev server: `npm run dev` (or `npm run dev:call` if you want the alternate port).
2. Start the signaling server: `npm run signaling`.
3. Open the app in two different browser windows (or two devices on the same network) and sign in.
4. Use the UI to make a call—signaling server will relay SDP and ICE candidates.


## Contributing

Feel free to open issues or PRs. A simple workflow:

1. Fork the repo and create a feature branch.
2. Make changes and run `npm run lint` and `npm run dev` to smoke-test.
3. Open a PR describing the change.


